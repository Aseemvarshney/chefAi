import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useState, useEffect } from 'react';

export default function Navbar({ isCollapsed, toggleSidebar }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, changeLanguage, t } = useLanguage();
  const nav = useNavigate();
  const loc = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [loc.pathname]);

  // Auto-open "More Options" if current location matches any item in exploreLinks
  useEffect(() => {
    const isExploreRoute = exploreLinks.some(l => l.to === loc.pathname);
    if (isExploreRoute) {
      setMoreOpen(true);
    }
  }, [loc.pathname]);

  const handleLogout = () => {
    logout();
    nav('/login');
  };

  const navLinks = [
    { to: '/', icon: '🏠', label: t('dashboard') },
    { to: '/location-meals', icon: '📍', label: 'Local Meals' },
    { to: '/smart-fridge', icon: '⚡', label: 'Smart Fridge' },
    { to: '/favorites', icon: '❤️', label: t('favorites') },
    { to: '/grocery', icon: '🛒', label: t('grocery') },
    { to: '/meal-planner', icon: '📅', label: t('mealPlan') },
    { to: '/reviews', icon: '💬', label: t('reviews') },
  ];

  const exploreLinks = [
    { to: '/fridge-mode', icon: '🧊', label: 'Basic Fridge' },
    { to: '/features', icon: '🚀', label: 'Features' },
    { to: '/about', icon: 'ℹ️', label: 'About' },
    { to: '/profile', icon: '👤', label: t('profile') },
    { to: '/login-logs', icon: '🔒', label: 'Login Logs' },
    ...(user?.role === 'admin' ? [{ to: '/admin', icon: '⚙️', label: t('adminPanel') }] : []),
  ];

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ];

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="mobile-header" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        zIndex: 90,
        display: 'none',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px'
      }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>🍳</span>
          <span style={{ fontFamily: 'Playfair Display', fontSize: '1.25rem', fontWeight: 700 }} className="gradient-text">
            ChefAI
          </span>
        </Link>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            background: 'rgba(16,185,129,0.15)',
            border: '1px solid rgba(16,185,129,0.3)',
            color: '#10b981',
            borderRadius: 10,
            padding: '8px 14px',
            fontSize: 18,
            cursor: 'pointer'
          }}
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Backdrop for Mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 95
          }}
        />
      )}

      {/* Left Sidebar Navigation */}
      <aside
        className={`sidebar-container ${mobileOpen ? 'mobile-open' : ''} ${isCollapsed ? 'collapsed' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: isCollapsed ? 72 : 260,
          background: 'var(--bg-card)',
          borderRight: '1px solid var(--border)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: isCollapsed ? '20px 8px' : '24px 16px',
          transition: 'width 0.3s ease, padding 0.3s ease, transform 0.3s ease',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
      >
        <div>
          {/* Brand Logo & Gate Toggle Button */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            marginBottom: 28,
            padding: isCollapsed ? '0' : '0 4px'
          }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: isCollapsed ? 28 : 32 }}>🍳</span>
              {!isCollapsed && (
                <div>
                  <h2 style={{ fontFamily: 'Playfair Display', fontSize: '1.4rem', fontWeight: 700, margin: 0 }} className="gradient-text">
                    ChefAI
                  </h2>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 0.5 }}>INTELLIGENT KITCHEN</span>
                </div>
              )}
            </Link>

            {/* Sidebar Gate Toggle (Open/Close Gate) */}
            <button
              onClick={toggleSidebar}
              className="hover-scale"
              title={isCollapsed ? 'Expand Sidebar (Open Gate)' : 'Collapse Sidebar (Close Gate)'}
              style={{
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.3)',
                color: '#10b981',
                borderRadius: 8,
                width: 30,
                height: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 14,
                flexShrink: 0
              }}
            >
              {isCollapsed ? '▶' : '◀'}
            </button>
          </div>

          {/* Main Navigation */}
          <div style={{ marginBottom: 20 }}>
            {!isCollapsed && (
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1.2, padding: '0 12px 8px 12px' }}>
                MAIN MENU
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {navLinks.map((l) => {
                const isActive = loc.pathname === l.to;
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    className="hover-scale"
                    title={isCollapsed ? l.label : undefined}
                    style={{
                      textDecoration: 'none',
                      padding: isCollapsed ? '10px 0' : '10px 14px',
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: isActive ? 600 : 500,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      gap: 12,
                      transition: 'all 0.2s',
                      background: isActive ? 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.08) 100%)' : 'transparent',
                      color: isActive ? '#10b981' : 'var(--text-primary)',
                      border: isActive ? '1px solid rgba(16,185,129,0.35)' : '1px solid transparent',
                      boxShadow: isActive ? '0 4px 12px rgba(16,185,129,0.1)' : 'none'
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{l.icon}</span>
                    {!isCollapsed && <span>{l.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* More Options Collapsible Section */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 8 }}>
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className="hover-scale"
              title={isCollapsed ? 'More Options' : undefined}
              style={{
                width: '100%',
                background: moreOpen ? 'rgba(16,185,129,0.12)' : 'transparent',
                color: moreOpen ? '#10b981' : 'var(--text-muted)',
                border: '1px solid transparent',
                borderRadius: 12,
                padding: isCollapsed ? '10px 0' : '10px 14px',
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 18 }}>⋯</span>
                {!isCollapsed && <span>More Options</span>}
              </div>
              {!isCollapsed && (
                <span style={{ fontSize: 10, transition: 'transform 0.2s', transform: moreOpen ? 'rotate(180deg)' : 'none' }}>
                  ▼
                </span>
              )}
            </button>

            {/* Collapsible Submenu for EXPLORE & TOOLS */}
            {moreOpen && (
              <div className="animate-fadeIn" style={{
                marginTop: 6,
                paddingLeft: isCollapsed ? 0 : 8,
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}>
                {!isCollapsed && (
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, padding: '4px 10px' }}>
                    EXPLORE & TOOLS
                  </div>
                )}
                {exploreLinks.map((l) => {
                  const isActive = loc.pathname === l.to;
                  return (
                    <Link
                      key={l.to}
                      to={l.to}
                      className="hover-scale"
                      title={l.label}
                      style={{
                        textDecoration: 'none',
                        padding: isCollapsed ? '9px 0' : '9px 12px',
                        borderRadius: 10,
                        fontSize: 13.5,
                        fontWeight: isActive ? 600 : 500,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        gap: 10,
                        transition: 'all 0.2s',
                        background: isActive ? 'rgba(16,185,129,0.2)' : 'transparent',
                        color: isActive ? '#10b981' : 'var(--text-muted)',
                        border: isActive ? '1px solid rgba(16,185,129,0.3)' : '1px solid transparent'
                      }}
                    >
                      <span style={{ fontSize: 17 }}>{l.icon}</span>
                      {!isCollapsed && <span>{l.label}</span>}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer / User Controls */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: 14,
          marginTop: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          {/* Quick Controls: Theme & Language */}
          <div style={{ display: 'flex', flexDirection: isCollapsed ? 'column' : 'row', gap: 6 }}>
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '8px',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                fontSize: 13,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
              {!isCollapsed && <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>}
            </button>

            {/* Language Selector */}
            <div style={{ position: 'relative', flex: 1 }}>
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                title="Change language"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '8px',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <span>{languages.find(l => l.code === language)?.flag}</span>
                {!isCollapsed && <span>{languages.find(l => l.code === language)?.code.toUpperCase()}</span>}
              </button>

              {langMenuOpen && (
                <div className="animate-scaleIn" style={{
                  position: 'absolute',
                  bottom: '110%',
                  left: 0,
                  minWidth: 140,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 6,
                  zIndex: 200,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                }}>
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => { changeLanguage(lang.code); setLangMenuOpen(false); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 10px',
                        width: '100%',
                        background: language === lang.code ? 'rgba(16,185,129,0.15)' : 'transparent',
                        color: language === lang.code ? '#10b981' : 'var(--text-primary)',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: 8,
                        fontSize: 13
                      }}
                    >
                      {lang.flag} {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* User Account Info & Logout */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: isCollapsed ? '8px 4px' : '10px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            gap: isCollapsed ? 0 : 8
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                fontWeight: 700,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {user?.name?.[0]?.toUpperCase() || 'C'}
              </div>
              {!isCollapsed && (
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.name || 'Chef'}
                  </div>
                  <div style={{ fontSize: 11, color: '#10b981', textTransform: 'capitalize' }}>
                    {user?.role || 'User'}
                  </div>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                onClick={handleLogout}
                title={t('logout')}
                style={{
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#f87171',
                  borderRadius: 8,
                  padding: '5px 8px',
                  cursor: 'pointer',
                  fontSize: 13
                }}
              >
                🚪
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
