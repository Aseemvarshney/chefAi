import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import RecipeCard from '../components/RecipeCard';
import toast from 'react-hot-toast';
import { sound } from '../utils/soundEffects';
import { CULINARY_VIBES } from '../utils/recipeImages';

function TypingDots() {
  const { t } = useLanguage();
  return (
    <div className="animate-fadeIn" style={{ display: 'flex', gap: 5, padding: '16px 20px', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 14, color: '#34d399', fontWeight: 600, marginRight: 8 }}>
        🍳 {t('aiCooking') || 'Chef AI is crafting your recipe...'}
      </span>
      {[0, 1, 2].map(i => (
        <div key={i} className="typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />
      ))}
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
  const [selectedVibe, setSelectedVibe] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/recipes/trending').then(r => setTrending(r.data)).catch(() => {}),
      api.get('/recipes/history').then(r => setHistory(r.data)).catch(() => {}),
      api.get('/ai/recommendations').then(r => setRecs(r.data.recommendations || [])).catch(() => {}),
      api.get('/profile/stats').then(r => setStats(r.data)).catch(() => {}),
    ]);
  }, []);

  const handleSearch = async (e, dishNameOverride) => {
    if (e) e.preventDefault();
    const query = (dishNameOverride || dish).trim();
    if (!query) return;

    sound.playSizzle();
    setSearching(true);
    try {
      const { data } = await api.post('/recipes/search', { dish_name: query, servings });
      sound.playSuccess();
      nav(`/recipe/${data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleVibeClick = (vibe) => {
    sound.playClick();
    setSelectedVibe(vibe.id);
    setDish(vibe.presetDish);
    toast(`Vibe selected: ${vibe.name}`, { icon: vibe.icon });
  };

  const STAT_ITEMS = [
    { icon: '❤️', label: t('favorites') || 'Favorites', value: stats?.favorites ?? '–', color: '#ef4444' },
    { icon: '🔍', label: t('searches') || 'Searches', value: stats?.searches ?? '–', color: '#3b82f6' },
    { icon: '📅', label: t('mealPlans') || 'Meal Plans', value: stats?.meal_plans ?? '–', color: '#10b981' },
    { icon: '🛒', label: t('groceryLists') || 'Groceries', value: stats?.grocery_lists ?? '–', color: '#f59e0b' },
  ];

  return (
    <div className="page-container">
      {/* Hero Welcome */}
      <div className="animate-fadeUp" style={{ textAlign: 'center', padding: '30px 0 24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 20, padding: '4px 14px', fontSize: 12.5, color: '#34d399', fontWeight: 600, marginBottom: 12 }}>
          <span>✨</span>
          <span>Next-Gen AI Culinary Intelligence</span>
        </div>
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 700, marginBottom: 10 }}>
          {t('hello') || 'Hello'}, <span className="gradient-text">{user?.name?.split(' ')[0] || 'Chef'}!</span> 👨‍🍳
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: 540, margin: '0 auto' }}>
          What culinary masterpiece are we creating in your kitchen today?
        </p>
      </div>

      {/* Culinary Vibe & Occasion Carousel */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '0 4px' }}>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: '#94a3b8' }}>
            🍽️ Choose Today's Culinary Vibe
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Tap a vibe for instant inspiration
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 12
        }}>
          {CULINARY_VIBES.map(vibe => {
            const isSelected = selectedVibe === vibe.id;
            return (
              <button
                key={vibe.id}
                onClick={() => handleVibeClick(vibe)}
                className="hover-lift"
                style={{
                  background: isSelected ? vibe.gradient : 'rgba(15,22,36,0.7)',
                  border: `1px solid ${isSelected ? 'transparent' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 16,
                  padding: '14px 16px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                  boxShadow: isSelected ? `0 8px 24px ${vibe.bgGlow}` : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 24 }}>{vibe.icon}</span>
                  {isSelected && <span style={{ fontSize: 12, color: 'white', fontWeight: 700 }}>✓ Active</span>}
                </div>
                <div style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: isSelected ? '#ffffff' : 'var(--text-primary)',
                  fontFamily: 'Playfair Display'
                }}>
                  {vibe.name}
                </div>
                <div style={{
                  fontSize: 11.5,
                  color: isSelected ? 'rgba(255,255,255,0.9)' : 'var(--text-muted)',
                  lineHeight: 1.3
                }}>
                  {vibe.tagline}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Gourmet Search Console */}
      <div className="glass" style={{
        padding: '26px 30px',
        marginBottom: 32,
        borderRadius: 20,
        boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>
              {t('dishName') || 'Search Dish or Craving'}
            </label>
            <input
              className="input-field"
              placeholder={t('dishPlaceholder') || 'e.g. Truffle Mushroom Risotto, Thai Green Curry...'}
              value={dish}
              onChange={e => setDish(e.target.value)}
              style={{ fontSize: 15, padding: '14px 18px', borderRadius: 14 }}
            />
          </div>

          <div style={{ width: 110 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>
              {t('servings') || 'Servings'}
            </label>
            <input
              className="input-field"
              type="number"
              min={1}
              max={20}
              value={servings}
              onChange={e => setServings(+e.target.value)}
              style={{ fontSize: 15, padding: '14px 14px', borderRadius: 14, textAlign: 'center' }}
            />
          </div>

          <button
            className="btn-primary hover-lift"
            type="submit"
            disabled={searching}
            style={{
              padding: '14px 30px',
              fontSize: 15,
              whiteSpace: 'nowrap',
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
            <span>🔥</span>
            <span>{searching ? (t('searching') || 'Cooking...') : (t('cookIt') || 'Cook It')}</span>
          </button>
        </form>

        {searching && <TypingDots />}

        {/* Quick popular cuisine searches */}
        <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 4 }}>Chef Specials:</span>
          {['Chicken Biryani', 'Pasta Carbonara', 'Butter Chicken', 'Margherita Pizza', 'Thai Coconut Curry', 'Salmon Poke Bowl'].map(q => (
            <button
              key={q}
              onClick={() => {
                sound.playClick();
                setDish(q);
              }}
              className="hover-scale"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
                padding: '5px 12px',
                fontSize: 12,
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Kitchen Activity Bento Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16, marginBottom: 36 }}>
          {STAT_ITEMS.map((s, i) => (
            <div key={s.label} className="glass hover-lift" style={{
              padding: '16px 20px',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 14
            }}>
              <div style={{ 
                width: 44,
                height: 44,
                borderRadius: 12, 
                background: `${s.color}20`,
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'center', 
                fontSize: 22 
              }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trending Gourmet Recipes Grid */}
      {trending.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 className="section-title" style={{ fontSize: '1.4rem', margin: 0 }}>
              🔥 Trending Culinary Inspirations
            </h2>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Popular in community</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
            {trending.map((r, i) => (
              <RecipeCard key={r.id} recipe={r} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {recs.length > 0 && (
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h2 className="section-title" style={{ margin: 0, fontSize: '1.4rem' }}>
                🤖 Personalized AI Menu Curations
              </h2>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                Handcrafted for your palate based on your tastes & history
              </p>
            </div>
            <button
              onClick={() => {
                sound.playClick();
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
                cursor: 'pointer'
              }}
            >
              🎲 Refresh Ideas
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
            {recs.map((r, i) => (
              <div
                key={i}
                className="glass hover-lift"
                onClick={() => handleSearch(null, r.name)}
                style={{
                  padding: 18,
                  borderRadius: 16,
                  cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{ fontSize: 26 }}>🍽️</span>
                  <span style={{ fontSize: 11, background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
                    Match
                  </span>
                </div>
                <h3 style={{
                  fontFamily: 'Playfair Display',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 6
                }}>
                  {r.name}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: 10 }}>
                  {r.reason}
                </p>
                <div style={{ fontSize: 12, color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>Cook this now</span>
                  <span>→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
