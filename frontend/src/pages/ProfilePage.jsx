import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const DIETS = ['none','vegetarian','vegan','keto','gluten_free','dairy_free'];
const CUISINES = ['Italian','Indian','Chinese','Mexican','Japanese','Thai','Mediterranean','American','French','Pakistani'];

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ name: '', dietary_preference: 'none', allergies: '', favorite_cuisine: '' });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('profile'); // profile | security

  useEffect(() => {
    if (user) setForm({ name: user.name || '', dietary_preference: user.dietary_preference || 'none', allergies: user.allergies || '', favorite_cuisine: user.favorite_cuisine || '' });
    api.get('/profile/stats').then(r => setStats(r.data)).catch(() => {});
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.patch('/profile/', form);
      await refreshUser();
      toast.success('Profile updated! ✅');
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (pwForm.new_password !== pwForm.confirm) return toast.error('Passwords do not match');
    if (pwForm.new_password.length < 6) return toast.error('Password must be at least 6 characters');
    setSavingPw(true);
    try {
      await api.post('/profile/change-password', { current_password: pwForm.current_password, new_password: pwForm.new_password });
      toast.success('Password changed successfully!');
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to change password'); }
    finally { setSavingPw(false); }
  };

  return (
    <div className="page-container" style={{ maxWidth: 700 }}>
      {/* Avatar header */}
      <div className="glass" style={{ padding: 32, marginBottom: 24, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ width: 80, height: 80, background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, color: 'white', flexShrink: 0 }}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: '1.6rem', fontWeight: 700, marginBottom: 4 }}>{user?.name}</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 8 }}>{user?.email}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="badge badge-green">{user?.role === 'admin' ? '⚙️ Admin' : '👤 User'}</span>
            <span className="badge badge-blue">🥗 {user?.dietary_preference || 'No preference'}</span>
          </div>
        </div>
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[['❤️', stats.favorites, 'Favs'], ['🔍', stats.searches, 'Searches'], ['📅', stats.meal_plans, 'Plans'], ['🛒', stats.grocery_lists, 'Lists']].map(([icon, val, label]) => (
              <div key={label} style={{ textAlign: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 20 }}>{icon}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981' }}>{val}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {['profile','security'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14, border: 'none',
            background: tab === t ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
            color: tab === t ? '#10b981' : '#94a3b8', transition: 'all 0.2s',
          }}>{t === 'profile' ? '👤 Profile' : '🔒 Security'}</button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="glass" style={{ padding: 32 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 24, color: '#f1f5f9' }}>Edit Profile</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6, display: 'block' }}>Full Name</label>
              <input className="input-field" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6, display: 'block' }}>Dietary Preference</label>
              <select className="input-field" value={form.dietary_preference} onChange={e => setForm(p => ({ ...p, dietary_preference: e.target.value }))}>
                {DIETS.map(d => <option key={d} value={d}>{d.replace('_',' ')}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6, display: 'block' }}>Allergies (comma separated)</label>
              <input className="input-field" placeholder="e.g. peanuts, shellfish, dairy" value={form.allergies} onChange={e => setForm(p => ({ ...p, allergies: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8, display: 'block' }}>Favorite Cuisine</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CUISINES.map(c => (
                  <button key={c} onClick={() => setForm(p => ({ ...p, favorite_cuisine: c }))} className="tag-chip"
                    style={{ background: form.favorite_cuisine === c ? 'rgba(16,185,129,0.15)' : '', borderColor: form.favorite_cuisine === c ? '#10b981' : '', color: form.favorite_cuisine === c ? '#10b981' : '' }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn-primary" onClick={saveProfile} disabled={saving} style={{ padding: '14px', fontSize: 15, marginTop: 8 }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div className="glass" style={{ padding: 32 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 24, color: '#f1f5f9' }}>Change Password</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[['current_password','Current Password'], ['new_password','New Password'], ['confirm','Confirm New Password']].map(([key, label]) => (
              <div key={key}>
                <label style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6, display: 'block' }}>{label}</label>
                <input className="input-field" type="password" placeholder="••••••••" value={pwForm[key]}
                  onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))} />
              </div>
            ))}
            <button className="btn-primary" onClick={changePassword} disabled={savingPw} style={{ padding: '14px', fontSize: 15, marginTop: 8 }}>
              {savingPw ? 'Changing...' : '🔒 Change Password'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
