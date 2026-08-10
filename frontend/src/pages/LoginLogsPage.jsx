import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function LoginLogsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLoginLogs();
  }, []);

  const loadLoginLogs = async () => {
    try {
      const { data } = await api.get('/auth/login-logs');
      setLogs(data.logs);
    } catch (err) {
      toast.error('Failed to load login logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (success) => {
    return success ? (
      <span className="badge-green animate-fadeIn">✓ Success</span>
    ) : (
      <span className="badge-red animate-fadeIn">✗ Failed</span>
    );
  };

  const getBrowserFromUserAgent = (userAgent) => {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  };

  if (!user) {
    return (
      <div className="page-container">
        <div className="animate-fadeIn" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h2>Please log in to view login logs</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="animate-fadeUp" style={{ marginBottom: 32 }}>
        <h1 className="animate-slideInLeft" style={{ 
          fontFamily: 'Playfair Display', 
          fontSize: '2rem', 
          fontWeight: 700, 
          color: 'var(--text-primary)',
          marginBottom: 8
        }}>
          🔒 Login Activity
        </h1>
        <p className="animate-slideInRight stagger-1" style={{ 
          color: 'var(--text-muted)', 
          fontSize: '1rem' 
        }}>
          {user.role === 'admin' ? 'All user login attempts' : 'Your login history'}
        </p>
      </div>

      {/* Stats */}
      {logs.length > 0 && (
        <div className="animate-scaleIn" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', 
          gap: 16, 
          marginBottom: 32 
        }}>
          <div className="stat-card hover-lift animate-bounceIn">
            <div className="animate-float" style={{ 
              width: 44, height: 44, borderRadius: 12, 
              background: '#10b98120', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', 
              fontSize: 22 
            }}>📊</div>
            <div>
              <div className="animate-slideInRight" style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>
                {logs.length}
              </div>
              <div className="animate-slideInRight stagger-1" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Total Entries
              </div>
            </div>
          </div>

          <div className="stat-card hover-lift animate-bounceIn stagger-1">
            <div className="animate-float" style={{ 
              width: 44, height: 44, borderRadius: 12, 
              background: '#10b98120', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', 
              fontSize: 22, animationDelay: '0.5s'
            }}>✓</div>
            <div>
              <div className="animate-slideInRight" style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>
                {logs.filter(l => l.success).length}
              </div>
              <div className="animate-slideInRight stagger-1" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Successful
              </div>
            </div>
          </div>

          <div className="stat-card hover-lift animate-bounceIn stagger-2">
            <div className="animate-float" style={{ 
              width: 44, height: 44, borderRadius: 12, 
              background: '#ef444420', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', 
              fontSize: 22, animationDelay: '1s'
            }}>✗</div>
            <div>
              <div className="animate-slideInRight" style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>
                {logs.filter(l => !l.success).length}
              </div>
              <div className="animate-slideInRight stagger-1" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Failed
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="animate-fadeIn" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
          <p style={{ color: 'var(--text-muted)' }}>Loading login logs...</p>
        </div>
      )}

      {/* Login Logs Table */}
      {!loading && logs.length > 0 && (
        <div className="glass animate-fadeUp" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(16,185,129,0.1)' }}>
                  <th className="animate-slideInLeft" style={{ padding: '16px 20px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: '#10b981' }}>
                    Status
                  </th>
                  {user.role === 'admin' && (
                    <th className="animate-slideInLeft stagger-1" style={{ padding: '16px 20px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: '#10b981' }}>
                      User
                    </th>
                  )}
                  <th className="animate-slideInLeft stagger-2" style={{ padding: '16px 20px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: '#10b981' }}>
                    Email
                  </th>
                  <th className="animate-slideInLeft stagger-3" style={{ padding: '16px 20px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: '#10b981' }}>
                    Time
                  </th>
                  <th className="animate-slideInLeft stagger-4" style={{ padding: '16px 20px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: '#10b981' }}>
                    IP Address
                  </th>
                  <th className="animate-slideInLeft stagger-5" style={{ padding: '16px 20px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: '#10b981' }}>
                    Browser
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr key={log.id} className={`animate-fadeIn stagger-${index % 5}`} style={{ 
                    borderBottom: '1px solid var(--border)',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '16px 20px' }}>
                      {getStatusBadge(log.success)}
                    </td>
                    {user.role === 'admin' && (
                      <td style={{ padding: '16px 20px', fontSize: 14, color: 'var(--text-primary)' }}>
                        {log.user_name || 'Unknown'}
                      </td>
                    )}
                    <td style={{ padding: '16px 20px', fontSize: 14, color: 'var(--text-primary)' }}>
                      {log.email}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: 14, color: 'var(--text-muted)' }}>
                      {formatDate(log.login_time)}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: 14, color: 'var(--text-muted)' }}>
                      <span className="hover-scale" style={{ 
                        background: 'rgba(59,130,246,0.1)', 
                        color: '#60a5fa', 
                        padding: '4px 8px', 
                        borderRadius: 6, 
                        fontSize: 12, 
                        fontFamily: 'monospace',
                        cursor: 'default'
                      }}>
                        {log.ip_address}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: 14, color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        🌐 {getBrowserFromUserAgent(log.user_agent)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && logs.length === 0 && (
        <div className="animate-fadeIn" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div className="animate-bounceIn" style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
          <h3 className="animate-slideInLeft" style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
            No login logs found
          </h3>
          <p className="animate-slideInRight">Login attempts will appear here once the tracking system is active.</p>
        </div>
      )}
    </div>
  );
}