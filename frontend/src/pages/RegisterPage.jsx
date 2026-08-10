import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ── Countdown timer (mirrors LoginPage) ─────────────────────────────────────
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

// ── 6-box OTP input ──────────────────────────────────────────────────────────
function OTPBoxes({ value, onChange }) {
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);

  const focus = (el) => el?.focus();

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '12px 0' }}>
      {digits.map((d, i) => (
        <input
          key={i}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => {
            const val = e.target.value.replace(/\D/g, '');
            const arr = digits.map((x, idx) => idx === i ? val : x);
            onChange(arr.join('').slice(0, 6));
            if (val) focus(e.target.parentElement.children[i + 1]);
          }}
          onKeyDown={e => {
            if (e.key === 'Backspace' && !d && i > 0) {
              const arr = digits.map((x, idx) => idx === i - 1 ? '' : x);
              onChange(arr.join(''));
              focus(e.target.parentElement.children[i - 1]);
            }
          }}
          onPaste={e => {
            const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
            onChange(pasted);
            focus(e.target.parentElement.children[Math.min(pasted.length, 5)]);
            e.preventDefault();
          }}
          style={{
            width: 48, height: 56, textAlign: 'center',
            fontSize: '1.4rem', fontWeight: 700,
            background: d ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
            border: `2px solid ${d ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 12, color: 'var(--text-primary)',
            outline: 'none', transition: 'all 0.2s', caretColor: 'transparent',
          }}
          onFocus={e => { e.target.style.borderColor = '#10b981'; }}
          onBlur={e => { e.target.style.borderColor = d ? '#10b981' : 'rgba(255,255,255,0.1)'; }}
        />
      ))}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const { register, sendOTP, verifyOTP } = useAuth();
  const nav = useNavigate();

  const [method, setMethod]     = useState('password'); // 'password' | 'otp'
  const [step, setStep]         = useState('form');     // 'form' | 'otp'

  // Classic fields
  const [form, setForm]         = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [showPw, setShowPw]     = useState(false);

  // OTP fields
  const [idType, setIdType]     = useState('email');
  const [identifier, setIdentifier] = useState('');
  const [otpName, setOtpName]   = useState('');
  const [otp, setOtp]           = useState('');
  const [devOtp, setDevOtp]       = useState('');
  const [canResend, setCanResend] = useState(false);

  const [loading, setLoading]   = useState(false);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.phone || null);
      toast.success("Account created! Let's cook! 🎉");
      nav('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally { setLoading(false); }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!otpName.trim()) return toast.error('Enter your name');
    if (!identifier.trim()) return toast.error(`Enter your ${idType}`);
    setLoading(true);
    try {
      const res = await sendOTP(identifier.trim(), idType);
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

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length < 6) return toast.error('Enter all 6 digits');
    setLoading(true);
    try {
      await verifyOTP(identifier.trim(), idType, otp, otpName);
      toast.success("Account created! Let's cook! 🎉");
      nav('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid OTP');
    } finally { setLoading(false); }
  };

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

  // ── Styles ────────────────────────────────────────────────────────────────

  const tabStyle = (active) => ({
    flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
    borderRadius: 10, fontSize: 14, fontWeight: 600,
    background: active ? 'linear-gradient(135deg,#10b981,#059669)' : 'transparent',
    color: active ? '#fff' : 'var(--text-muted)',
    transition: 'all 0.25s',
    boxShadow: active ? '0 4px 14px rgba(16,185,129,0.35)' : 'none',
  });

  const toggleBtn = (active) => ({
    flex: 1, padding: '8px', borderRadius: 10, cursor: 'pointer',
    fontSize: 13, fontWeight: 600,
    background: active ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
    color: active ? '#10b981' : 'var(--text-muted)',
    border: `1px solid ${active ? 'rgba(16,185,129,0.4)' : 'var(--border)'}`,
    transition: 'all 0.2s',
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="auth-container animate-fadeIn">
      <div style={{ width: '100%', maxWidth: 460 }}>

        {/* Logo */}
        <div className="animate-bounceIn" style={{ textAlign: 'center', marginBottom: 36 }}>
          <div className="animate-float" style={{ fontSize: 52, marginBottom: 8 }}>🍳</div>
          <h1 className="gradient-text"
            style={{ fontFamily: 'Playfair Display', fontSize: '2.2rem', fontWeight: 700 }}>
            ChefAI
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Join thousands of home cooks</p>
        </div>

        <div className="glass animate-fadeUp" style={{ padding: '32px 36px' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: 20 }}>Create Account</h2>

          {/* Method tabs */}
          <div style={{
            display: 'flex', gap: 6, background: 'rgba(255,255,255,0.04)',
            borderRadius: 12, padding: 5, marginBottom: 24,
          }}>
            <button style={tabStyle(method === 'password')}
              onClick={() => { setMethod('password'); setStep('form'); }}>
              🔑 Password
            </button>
            <button style={tabStyle(method === 'otp')}
              onClick={() => { setMethod('otp'); setStep('form'); }}>
              📱 OTP
            </button>
          </div>

          {/* ══ CLASSIC REGISTER ══ */}
          {method === 'password' && (
            <form onSubmit={handleRegister} className="animate-fadeIn"
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {[
                { key: 'name',  label: 'Full Name',        type: 'text',  placeholder: 'John Doe',         required: true  },
                { key: 'email', label: 'Email Address',    type: 'email', placeholder: 'you@example.com',  required: true  },
                { key: 'phone', label: 'Phone (optional)', type: 'tel',   placeholder: '+1 234 567 8900',  required: false },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                    {f.label}
                  </label>
                  <input className="input-field" type={f.type} placeholder={f.placeholder}
                    value={form[f.key]} required={f.required}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}

              {/* Password */}
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input className="input-field" type={showPw ? 'text' : 'password'}
                    placeholder="••••••••" value={form.password} required style={{ paddingRight: 44 }}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                  <button type="button" onClick={() => setShowPw(p => !p)} style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 18, color: 'var(--text-muted)',
                  }}>
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Confirm */}
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                  Confirm Password
                </label>
                <input className="input-field" type="password" placeholder="••••••••"
                  value={form.confirm} required
                  onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} />
              </div>

              {/* Strength bar */}
              {form.password && (
                <div className="animate-fadeIn">
                  <div style={{ height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.08)', marginBottom: 4 }}>
                    <div style={{
                      height: '100%', borderRadius: 4, transition: 'width 0.3s, background 0.3s',
                      width: form.password.length < 6 ? '25%' : form.password.length < 10 ? '60%' : '100%',
                      background: form.password.length < 6 ? '#ef4444' : form.password.length < 10 ? '#f59e0b' : '#10b981',
                    }} />
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {form.password.length < 6 ? 'Too short' : form.password.length < 10 ? 'Good' : '✓ Strong password'}
                  </p>
                </div>
              )}

              <button className="btn-primary hover-lift" type="submit" disabled={loading}
                style={{ marginTop: 6, padding: '14px', fontSize: 15 }}>
                {loading ? '⏳ Creating Account…' : '🚀 Create Account'}
              </button>
            </form>
          )}

          {/* ══ OTP — STEP 1: details ══ */}
          {method === 'otp' && step === 'form' && (
            <form onSubmit={handleSendOTP} className="animate-fadeIn"
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', marginBottom: 4 }}>
                No password needed — just verify with a one-time code.
              </p>

              {/* Name */}
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                  Full Name
                </label>
                <input className="input-field" type="text" placeholder="John Doe"
                  value={otpName} onChange={e => setOtpName(e.target.value)} required autoFocus />
              </div>

              {/* Email / Phone toggle */}
              <div style={{ display: 'flex', gap: 8 }}>
                {['email', 'phone'].map(t => (
                  <button key={t} type="button" className="hover-scale"
                    onClick={() => { setIdType(t); setIdentifier(''); }}
                    style={toggleBtn(idType === t)}>
                    {t === 'email' ? '📧 Email' : '📱 Phone'}
                  </button>
                ))}
              </div>

              <div>
                <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                  {idType === 'email' ? 'Email Address' : 'Phone Number'}
                </label>
                <input className="input-field"
                  type={idType === 'email' ? 'email' : 'tel'}
                  placeholder={idType === 'email' ? 'you@example.com' : '+91 98765 43210'}
                  value={identifier} onChange={e => setIdentifier(e.target.value)} required />
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
                  {idType === 'phone' ? 'Include country code e.g. +91 9876543210' : "We'll send a 6-digit code to this email"}
                </p>
              </div>

              <button className="btn-primary hover-lift animate-pulse-glow" type="submit"
                disabled={loading} style={{ padding: '14px', fontSize: 15 }}>
                {loading ? '⏳ Sending OTP…' : `📨 Send OTP via ${idType === 'email' ? 'Email' : 'SMS'}`}
              </button>
            </form>
          )}

          {/* ══ OTP — STEP 2: enter code ══ */}
          {method === 'otp' && step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="animate-scaleIn"
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Header */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>
                  {idType === 'email' ? '📧' : '📱'}
                </div>
                <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Almost there, {otpName.split(' ')[0]}!
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Enter the 6-digit code sent to
                </p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#10b981', marginTop: 2 }}>
                  {identifier}
                </p>
              </div>

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

              {/* OTP boxes */}
              <OTPBoxes value={otp} onChange={setOtp} />

              {/* Timer + resend */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {!canResend
                  ? <Countdown seconds={60} onEnd={() => setCanResend(true)} />
                  : <button type="button" onClick={handleResend} disabled={loading}
                      className="hover-scale"
                      style={{
                        background: 'none', border: '1px solid rgba(16,185,129,0.3)',
                        borderRadius: 8, padding: '7px 14px', color: '#10b981',
                        cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      }}>
                      🔄 Resend OTP
                    </button>
                }
                <button type="button" className="hover-scale"
                  onClick={() => { setStep('form'); setOtp(''); }}
                  style={{
                    background: 'none', border: 'none',
                    color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13,
                  }}>
                  ← Go back
                </button>
              </div>

              <button className="btn-primary hover-lift" type="submit"
                disabled={loading || otp.length < 6}
                style={{ padding: '14px', fontSize: 15 }}>
                {loading ? '⏳ Verifying…' : '🎉 Create Account'}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: 22, color: 'var(--text-muted)', fontSize: 14 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#10b981', textDecoration: 'none', fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
