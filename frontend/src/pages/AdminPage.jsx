import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/users').then(r => setUsers(r.data)),
      api.get('/admin/stats').then(r => setStats(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const toggleStatus = async (userId, isActive) => {
    await api.patch(`/admin/users/${userId}/status`, { is_active: !isActive });
    setUsers(p => p.map(u => u.id === userId ? { ...u, is_active: !isActive } : u));
    toast.success(isActive ? 'User deactivated' : 'User activated');
  };

  const toggleRole = async (userId, role) => {
    const newRole = role === 'admin' ? 'user' : 'admin';
    await api.patch(`/admin/users/${userId}/role`, { role: newRole });
    setUsers(p => p.map(u => u.id === userId ? { ...u, role: newRole } : u));
    toast.success(`Role changed to ${newRole}`);
  };

  const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    await api.delete(`/admin/users/${userId}`);
    setUsers(p => p.filter(u => u.id !== userId));
    toast.success('User deleted');
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>;

  const STAT_CARDS = [
    { icon: '👥', label: 'Total Users', value: stats?.total_users, color: '#3b82f6' },
    { icon: '✅', label: 'Active Users', value: stats?.active_users, color: '#10b981' },
    { icon: '🍽️', label: 'Total Recipes', value: stats?.total_recipes, color: '#f59e0b' },
    { icon: '🤖', label: 'AI Generated', value: stats?.ai_generated_recipes, color: '#8b5cf6' },
    { icon: '❤️', label: 'Favorites', value: stats?.total_favorites, color: '#ef4444' },
    { icon: '🔍', label: 'Total Searches', value: stats?.total_searches, color: '#06b6d4' },
  ];

  return (
    <div className="page-container">
      <h1 className="section-title" style={{ fontSize: '1.8rem', marginBottom: 28 }}>⚙️ Admin Panel</h1>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 14, marginBottom: 32 }}>
          {STAT_CARDS.map(s => (
            <div key={s.label} className="stat-card">
              <div style={{ width: 42, height: 42, borderRadius: 12, background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Users Table */}
      <div className="glass" style={{ padding: 24, overflowX: 'auto' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 20, color: '#f1f5f9' }}>👥 User Management</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['ID','Name','Email','Role','Status','Joined','Actions'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>#{u.id}</td>
                <td style={{ padding: '12px 14px', color: '#f1f5f9', fontWeight: 500 }}>{u.name}</td>
                <td style={{ padding: '12px 14px', color: '#94a3b8' }}>{u.email}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span className={u.role === 'admin' ? 'badge badge-gold' : 'badge badge-blue'} style={{ fontSize: 11 }}>
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span className={u.is_active ? 'badge badge-green' : 'badge badge-red'} style={{ fontSize: 11 }}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 12 }}>
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => toggleRole(u.id, u.role)} style={{
                      padding: '5px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', border: '1px solid rgba(245,158,11,0.3)',
                      background: 'rgba(245,158,11,0.1)', color: '#f59e0b', transition: 'all 0.2s'
                    }}>
                      {u.role === 'admin' ? '→ User' : '→ Admin'}
                    </button>
                    <button onClick={() => toggleStatus(u.id, u.is_active)} style={{
                      padding: '5px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                      border: `1px solid ${u.is_active ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                      background: u.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                      color: u.is_active ? '#f87171' : '#10b981', transition: 'all 0.2s'
                    }}>
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => deleteUser(u.id)} style={{
                      padding: '5px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                      border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.08)', color: '#ef4444'
                    }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No users found</div>}
      </div>
    </div>
  );
}
