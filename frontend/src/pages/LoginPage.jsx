import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

// ─── OTP digit input boxes ─────────────────────────────────────────────────
function OTPInput({ value, onChange }) {
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      const next = digits.map((d, idx) => idx === i ? '' : d).join('');
      onChange(next);
      if (i > 0) refs[i - 1].current?.focus();
    } else if (/^\d$/.test(e.key)) {
      const next = digits.map((d, idx) => idx === i ? e.key : d).join('');
      onChange(next);
      if (i < 5) refs[i + 1].current?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, '').slice(0, 6).replace(/\s/g, ''));
    refs[Math.min(pasted.length, 5)].current?.focus();
    e.preventDefault();
  };

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '20px 0' }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          onChange={() => {}}
          style={{
            width: 48, height: 56,
            textAlign: 'center',
            fontSize: '1.4rem',
            fontWeight: 700,
            background: d ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
            border: `2px solid ${d ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 12,
            color: 'var(--text-primary)',
            outline: 'none',
            transition: 'all 0.2s',
            caretColor: 'transparent',
          }}
          onFocus={e => e.target.style.borderColor = '#10b981'}
          onBlur={e => e.target.style.borderColor = d ? '#10b981' : 'rgba(255,255,255,0.1)'}
        />
      ))}
    </div>
  );
}

// ─── Countdown timer ──────────────────────────────────────────────────────
function Countdown({ seconds, onEnd }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    setLeft(seconds);
    const t = setInterval(() => setLeft(p => {
      if (p <= 1) { clearInterval(t); onEnd(); return 0; }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  const pct = (left / seconds) * 100;
  const color = left > 30 ? '#10b981' : left > 10 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={52} height={52} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={26} cy={26} r={22} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
        <circle cx={26} cy={26} r={22} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={`${2 * Math.PI * 22}`}
          strokeDashoffset={`${2 * Math.PI * 22 * (1 - pct / 100)}`}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }} />
      </svg>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
        {left}s remaining
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { login, sendOTP, verifyOTP } = useAuth();
  const { theme } = useTheme();
  const nav = useNavigate();

  // 'method' — which tab: 'password' | 'otp'
  const [method, setMethod] = useState('otp');
  // OTP flow step: 'identifier' | 'otp'
  const [step, setStep] = useState('identifier');

  // Classic login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  // OTP state
  const [identifier, setIdentifier] = useState('');
  const [idType, setIdType] = useState('email'); // 'email' | 'phone'
  const [otp, setOtp] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [canResend, setCanResend] = useState(false);

  const [loading, setLoading] = useState(false);

  // auto-detect email vs phone
  useEffect(() => {
    const v = identifier.trim();
    if (/^\+?\d[\d\s\-()]+$/.test(v) && v.replace(/\D/g, '').length >= 6) {
      setIdType('phone');
    } else {
      setIdType('email');
    }
  }, [identifier]);

  // ── classic login ────────────────────────────────────────────────────────
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back! 👨‍🍳');
      nav('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed');
    } finally { setLoading(false); }
  };

  const [devOtp, setDevOtp] = useState('');

  // ── OTP step 1 — send ────────────────────────────────────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) return toast.error('Enter your email or phone number');
    setLoading(true);
    try {
      const res = await sendOTP(identifier.trim(), idType);
      setIsNewUser(res.is_new_user);
      setCanResend(false);
      if (res.dev_otp) {
        setDevOtp(res.dev_otp);
        toast.success(`OTP Code: ${res.dev_otp}`, { duration: 8000 });
      } else {
        toast.success(`OTP sent to your ${idType}!`);
      }
      setStep('otp');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  // ── OTP step 2 — verify ──────────────────────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.replace(/\D/g, '').length < 6) return toast.error('Enter all 6 digits');
    if (isNewUser && !newUserName.trim()) return toast.error('Please enter your name');
    setLoading(true);
    try {
      await verifyOTP(identifier.trim(), idType, otp, isNewUser ? newUserName : null);
      toast.success(isNewUser ? 'Account created! Welcome! 🎉' : 'Welcome back! 👨‍🍳');
      nav('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  // ── resend OTP ───────────────────────────────────────────────────────────
  const handleResend = async () => {
    setLoading(true);
    setOtp('');
    try {
      const res = await sendOTP(identifier.trim(), idType);
      setCanResend(false);
      if (res.dev_otp) {
        setDevOtp(res.dev_otp);
        toast.success(`New OTP Code: ${res.dev_otp}`, { duration: 8000 });
      } else {
        toast.success('New OTP sent!');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to resend OTP');
    } finally { setLoading(false); }
  };

  // ── UI helpers ───────────────────────────────────────────────────────────
  const inputBg = theme === 'light'
    ? 'rgba(0,0,0,0.04)'
    : 'rgba(255,255,255,0.04)';

  const tabStyle = (active) => ({
    flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
    borderRadius: 10, fontSize: 14, fontWeight: 600,
    background: active ? 'linear-gradient(135deg,#10b981,#059669)' : 'transparent',
    color: active ? '#fff' : 'var(--text-muted)',
    transition: 'all 0.25s',
    boxShadow: active ? '0 4px 14px rgba(16,185,129,0.35)' : 'none',
  });

  return (
    <div className="auth-container animate-fadeIn">
      <div style={{ width: '100%', maxWidth: 460 }}>

        {/* Logo */}
        <div className="animate-bounceIn" style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 52, marginBottom: 8 }} className="animate-float">🍳</div>
          <h1 className="gradient-text" style={{ fontFamily: 'Playfair Display', fontSize: '2.2rem', fontWeight: 700 }}>
            ChefAI
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Your AI-Powered Cooking Assistant</p>
        </div>

        <div className="glass animate-fadeUp" style={{ padding: '32px 36px' }}>

          {/* ── Method tabs ── */}
          <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.04)',
            borderRadius: 12, padding: 5, marginBottom: 28 }}>
            <button style={tabStyle(method === 'otp')} onClick={() => { setMethod('otp'); setStep('identifier'); }}>
              📱 OTP Login
            </button>
            <button style={tabStyle(method === 'password')} onClick={() => setMethod('password')}>
              🔑 Password
            </button>
          </div>

          {/* ══════════ PASSWORD LOGIN ══════════ */}
          {method === 'password' && (
            <form onSubmit={handlePasswordLogin} className="animate-fadeIn"
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                  Email Address
                </label>
                <input className="input-field" type="email" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input className="input-field" type={showPw ? 'text' : 'password'}
                    placeholder="••••••••" value={password}
                    onChange={e => setPassword(e.target.value)} required
                    style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPw(p => !p)} style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: 18,
                    color: 'var(--text-muted)'
                  }}>
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <button className="btn-primary hover-lift" type="submit" disabled={loading}
                style={{ marginTop: 4, padding: '14px', fontSize: 15 }}>
                {loading ? '⏳ Signing in…' : '🔑 Sign In'}
              </button>
            </form>
          )}

          {/* ══════════ OTP LOGIN — STEP 1: enter identifier ══════════ */}
          {method === 'otp' && step === 'identifier' && (
            <form onSubmit={handleSendOTP} className="animate-fadeIn"
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div style={{ textAlign: 'center', marginBottom: 4 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                  Enter your email or phone number and we'll send you a 6-digit code.
                </p>
              </div>

              {/* Toggle email / phone */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                {['email', 'phone'].map(t => (
                  <button key={t} type="button"
                    onClick={() => { setIdType(t); setIdentifier(''); }}
                    className="hover-scale"
                    style={{
                      flex: 1, padding: '8px', borderRadius: 10, border: 'none',
                      cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      background: idType === t ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
                      color: idType === t ? '#10b981' : 'var(--text-muted)',
                      border: `1px solid ${idType === t ? 'rgba(16,185,129,0.4)' : 'var(--border)'}`,
                      transition: 'all 0.2s',
                    }}>
                    {t === 'email' ? '📧 Email' : '📱 Phone'}
                  </button>
                ))}
              </div>

              <div>
                <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                  {idType === 'email' ? 'Email Address' : 'Phone Number'}
                </label>
                <input className="input-field" autoFocus
                  type={idType === 'email' ? 'email' : 'tel'}
                  placeholder={idType === 'email' ? 'you@example.com' : '+1 234 567 8900'}
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)} required />
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
                  {idType === 'phone' ? 'Include country code e.g. +91 9876543210' : 'We\'ll send a 6-digit code to this email'}
                </p>
              </div>

              <button className="btn-primary hover-lift animate-pulse-glow" type="submit"
                disabled={loading} style={{ padding: '14px', fontSize: 15 }}>
                {loading ? '⏳ Sending OTP…' : `📨 Send OTP via ${idType === 'email' ? 'Email' : 'SMS'}`}
              </button>
            </form>
          )}

          {/* ══════════ OTP LOGIN — STEP 2: enter code ══════════ */}
          {method === 'otp' && step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="animate-scaleIn"
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Header */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>
                  {idType === 'email' ? '📧' : '📱'}
                </div>
                <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Check your {idType === 'email' ? 'inbox' : 'messages'}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  We sent a 6-digit code to
                </p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#10b981', marginTop: 2 }}>
                  {identifier}
                </p>
              </div>

              {/* Name field for new users */}
              {isNewUser && (
                <div className="animate-slideInLeft" style={{
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: 12, padding: '14px 16px'
                }}>
                  <p style={{ fontSize: 12, color: '#10b981', marginBottom: 8, fontWeight: 600 }}>
                    🎉 New here! What should we call you?
                  </p>
                  <input className="input-field" type="text" placeholder="Your full name"
                    value={newUserName} onChange={e => setNewUserName(e.target.value)}
                    style={{ fontSize: 14 }} autoFocus />
                </div>
              )}

              {/* Dev Mode OTP Banner */}
              {devOtp && (
                <div style={{
                  background: 'rgba(16,185,129,0.12)',
                  border: '1px solid rgba(16,185,129,0.4)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  textAlign: 'center',
                  marginTop: 4,
                }}>
                  <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600, marginBottom: 4 }}>
                    ⚡ DEVELOPMENT OTP CODE
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: 6, color: '#10b981' }}>
                    {devOtp}
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtp(devOtp)}
                    style={{
                      background: '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '6px 14px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      marginTop: 8,
                    }}
                  >
                    Auto-fill OTP Code
                  </button>
                </div>
              )}

              {/* 6-box OTP input */}
              <OTPInput value={otp} onChange={setOtp} />

              {/* Timer + resend */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                {!canResend
                  ? <Countdown seconds={60} onEnd={() => setCanResend(true)} />
                  : <button type="button" onClick={handleResend} disabled={loading}
                      className="hover-scale"
                      style={{
                        background: 'none', border: '1px solid rgba(16,185,129,0.3)',
                        borderRadius: 8, padding: '8px 16px', color: '#10b981',
                        cursor: 'pointer', fontSize: 13, fontWeight: 600
                      }}>
                      🔄 Resend OTP
                    </button>
                }
                <button type="button" onClick={() => { setStep('identifier'); setOtp(''); }}
                  className="hover-scale"
                  style={{
                    background: 'none', border: 'none', color: 'var(--text-muted)',
                    cursor: 'pointer', fontSize: 13
                  }}>
                  ← Change {idType}
                </button>
              </div>

              <button className="btn-primary hover-lift" type="submit"
                disabled={loading || otp.replace(/\D/g, '').length < 6}
                style={{ padding: '14px', fontSize: 15 }}>
                {loading ? '⏳ Verifying…' : '✅ Verify & Sign In'}
              </button>
            </form>
          )}

          {/* Footer link */}
          <p style={{ textAlign: 'center', marginTop: 22, color: 'var(--text-muted)', fontSize: 14 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#10b981', textDecoration: 'none', fontWeight: 600 }}>
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
