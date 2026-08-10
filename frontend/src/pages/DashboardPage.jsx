import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import RecipeCard from '../components/RecipeCard';
import FeatureShowcase from '../components/FeatureShowcase';
import toast from 'react-hot-toast';

function TypingDots() {
  const { t } = useLanguage();
  return (
    <div className="animate-fadeIn" style={{ display: 'flex', gap: 5, padding: '16px 20px', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: 'var(--text-muted)', marginRight: 6 }}>{t('aiCooking')}</span>
      {[0,1,2].map(i => <div key={i} className="typing-dot" style={{ animationDelay: `${i*0.2}s` }} />)}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const nav = useNavigate();
  const [dish, setDish] = useState('');
  const [servings, setServings] = useState(2);
  const [searching, setSearching] = useState(false);
  const [trending, setTrending] = useState([]);
  const [history, setHistory] = useState([]);
  const [recs, setRecs] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/recipes/trending').then(r => setTrending(r.data)).catch(() => {}),
      api.get('/recipes/history').then(r => setHistory(r.data)).catch(() => {}),
      api.get('/ai/recommendations').then(r => setRecs(r.data.recommendations || [])).catch(() => {}),
      api.get('/profile/stats').then(r => setStats(r.data)).catch(() => {}),
    ]);
  }, []);

  const handleSearch = async e => {
    e.preventDefault();
    if (!dish.trim()) return;
    setSearching(true);
    try {
      const { data } = await api.post('/recipes/search', { dish_name: dish, servings });
      nav(`/recipe/${data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Search failed');
    } finally { setSearching(false); }
  };

  const STAT_ITEMS = [
    { icon: '❤️', label: t('favorites'), value: stats?.favorites ?? '–', color: '#ef4444' },
    { icon: '🔍', label: t('searches'), value: stats?.searches ?? '–', color: '#3b82f6' },
    { icon: '📅', label: t('mealPlans'), value: stats?.meal_plans ?? '–', color: '#10b981' },
    { icon: '🛒', label: t('groceryLists'), value: stats?.grocery_lists ?? '–', color: '#f59e0b' },
  ];

  return (
    <div className="page-container">
      {/* Hero */}
      <div className="animate-fadeUp" style={{ textAlign: 'center', padding: '40px 0 32px' }}>
        <h1 className="animate-bounceIn" style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(1.8rem,5vw,2.8rem)', fontWeight: 700, marginBottom: 12 }}>
          {t('hello')}, <span className="gradient-text animate-wiggle">{user?.name?.split(' ')[0]}!</span> 👨‍🍳
        </h1>
        <p className="animate-slideInRight stagger-1" style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>{t('whatToCook')}</p>
      </div>

      {/* Search Bar */}
      <div className="glass animate-pulse-glow hover-glow animate-scaleIn" style={{ padding: '24px 28px', marginBottom: 32, maxWidth: 700, margin: '0 auto 32px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="animate-slideInLeft" style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>{t('dishName')}</label>
            <input className="input-field hover-glow" placeholder={t('dishPlaceholder')} value={dish}
              onChange={e => setDish(e.target.value)} style={{ fontSize: 16 }} />
          </div>
          <div className="animate-slideInRight" style={{ width: 120 }}>
            <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>{t('servings')}</label>
            <input className="input-field hover-glow" type="number" min={1} max={20} value={servings}
              onChange={e => setServings(+e.target.value)} />
          </div>
          <button className="btn-primary hover-lift animate-bounceIn" type="submit" disabled={searching} style={{ padding: '13px 28px', fontSize: 15, whiteSpace: 'nowrap' }}>
            {searching ? t('searching') : t('cookIt')}
          </button>
        </form>
        {searching && <TypingDots />}

        {/* Quick searches */}
        <div className="animate-fadeIn stagger-2" style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['Chicken Biryani','Pasta Carbonara','Butter Chicken','Margherita Pizza','Thai Curry'].map((q, i) => (
            <button key={q} onClick={() => setDish(q)} className={`hover-scale animate-slideInLeft stagger-${i + 1}`} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20, padding: '5px 14px', fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer',
              transition: 'all 0.2s'
            }} onMouseEnter={e => { 
              e.target.style.background='rgba(16,185,129,0.1)'; 
              e.target.style.color='#10b981'; 
              e.target.style.borderColor='rgba(16,185,129,0.3)'; 
              e.target.classList.add('animate-wiggle');
            }}
               onMouseLeave={e => { 
                 e.target.style.background='rgba(255,255,255,0.04)'; 
                 e.target.style.color='var(--text-muted)'; 
                 e.target.style.borderColor='rgba(255,255,255,0.08)'; 
                 e.target.classList.remove('animate-wiggle');
               }}>
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="animate-scaleIn" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16, marginBottom: 36 }}>
          {STAT_ITEMS.map((s, i) => (
            <div key={s.label} className={`stat-card hover-lift animate-bounceIn stagger-${i + 1}`}>
              <div className="animate-float" style={{ 
                width: 44, height: 44, borderRadius: 12, 
                background: `${s.color}20`, display: 'flex', 
                alignItems: 'center', justifyContent: 'center', 
                fontSize: 22, animationDelay: `${i * 0.5}s` 
              }}>{s.icon}</div>
              <div>
                <div className="animate-slideInRight" style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div className="animate-slideInRight stagger-1" style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Searches */}
      {history.length > 0 && (
        <div className="animate-slideInLeft" style={{ marginBottom: 36 }}>
          <h2 className="section-title animate-fadeIn">{t('recentSearches')}</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {history.slice(0,8).map((h, i) => (
              <button key={h.id} onClick={() => setDish(h.keyword)} className={`tag-chip hover-scale animate-slideInLeft stagger-${i + 1}`}>
                🕐 {h.keyword}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      <div className="animate-slideInRight" style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 className="section-title animate-fadeIn" style={{ margin: 0 }}>
            🤖 {t('aiRecommendations')}
          </h2>
          <button
            onClick={() => {
              api.get('/ai/recommendations').then(r => setRecs(r.data.recommendations || []));
            }}
            className="hover-scale"
            style={{
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid rgba(16,185,129,0.3)',
              color: '#10b981',
              borderRadius: 12,
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            🎲 Refresh Suggestions
          </button>
        </div>

        {recs.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
            {recs.map((r, i) => (
              <div
                key={`${r.name}-${i}`}
                className={`glass hover-lift hover-glow animate-scaleIn stagger-${(i % 6) + 1}`}
                style={{
                  padding: 18,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, rgba(15,22,36,0.9) 0%, rgba(19,29,46,0.9) 100%)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
                onClick={() => { setDish(r.name); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                onMouseEnter={e => e.currentTarget.style.borderColor='rgba(16,185,129,0.5)'}
                onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{
                      background: 'rgba(16,185,129,0.15)',
                      color: '#10b981',
                      borderRadius: 10,
                      padding: '3px 8px',
                      fontSize: 11,
                      fontWeight: 600
                    }}>
                      {r.tag || r.cuisine || 'AI Choice'}
                    </span>
                    {r.prep_time && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        ⏱️ {r.prep_time} min
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, fontSize: 15 }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#10b981', marginBottom: 8, fontWeight: 500 }}>
                    {r.cuisine} Cuisine
                  </div>
                </div>

                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.4, background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: 8 }}>
                  💡 {r.reason}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trending Recipes */}
      {trending.length > 0 && (
        <div className="animate-fadeIn" style={{ marginBottom: 36 }}>
          <h2 className="section-title animate-slideInLeft">{t('trendingRecipes')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
            {trending.map((r, i) => <RecipeCard key={r.id} recipe={r} index={i} />)}
          </div>
        </div>
      )}

      {/* Empty state */}
      {trending.length === 0 && !searching && (
        <div className="animate-fadeIn" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div className="animate-bounceIn" style={{ fontSize: 64, marginBottom: 16 }}>🍽️</div>
          <h3 className="animate-slideInLeft" style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>{t('noRecipesYet')}</h3>
          <p className="animate-slideInRight">{t('searchFirst')}</p>
        </div>
      )}
      
      {/* Feature Showcase */}
      <FeatureShowcase />
    </div>
  );
}
