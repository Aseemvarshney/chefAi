import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { getRecipeImage } from '../utils/recipeImages';
import { sound } from '../utils/soundEffects';

export default function FavoritesPage() {
  const [favs, setFavs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const nav = useNavigate();

  useEffect(() => {
    api.get('/favorites/')
      .then(r => setFavs(r.data))
      .finally(() => setLoading(false));
  }, []);

  const remove = async (favId) => {
    sound.playClick();
    await api.delete(`/favorites/${favId}`);
    setFavs(p => p.filter(f => f.id !== favId));
    toast.success('Removed from favorites');
  };

  const categories = ['All', ...new Set(favs.map(f => f.category || 'General'))];
  const filtered = filter === 'All' ? favs : favs.filter(f => f.category === filter);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="section-title" style={{ fontSize: '2rem', margin: 0 }}>❤️ Saved Cookbook</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Your curated collection of favorite gourmet recipes ({favs.length})
          </p>
        </div>

        {/* Category Filter Pills */}
        {categories.length > 1 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {categories.map(c => (
              <button
                key={c}
                onClick={() => {
                  sound.playClick();
                  setFilter(c);
                }}
                className="tag-chip"
                style={{
                  background: filter === c ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                  borderColor: filter === c ? '#10b981' : 'rgba(255,255,255,0.1)',
                  color: filter === c ? '#10b981' : 'var(--text-muted)',
                  fontWeight: 600
                }}>
                {c} {c === 'All' ? `(${favs.length})` : `(${favs.filter(f => f.category === c).length})`}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="glass" style={{ textAlign: 'center', padding: '80px 20px', color: '#64748b', borderRadius: 20 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📖❤️</div>
          <h3 style={{ fontSize: '1.3rem', color: '#f1f5f9', marginBottom: 8, fontFamily: 'Playfair Display' }}>
            Your Cookbook is Empty
          </h3>
          <p style={{ maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.5 }}>
            Explore recipes on the dashboard or use the Smart Fridge, and click the heart icon to save your favorites here.
          </p>
          <button className="btn-primary" onClick={() => nav('/')} style={{ padding: '12px 28px' }}>
            Explore Recipes
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {filtered.map(fav => {
            const r = fav.recipe;
            const totalTime = (r.preparation_time || 0) + (r.cooking_time || 0);
            const imageUrl = getRecipeImage(r);

            return (
              <div
                key={fav.id}
                className="recipe-card hover-lift"
                style={{
                  padding: 0,
                  position: 'relative',
                  borderRadius: 18,
                  overflow: 'hidden',
                  background: 'rgba(15,22,36,0.85)',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}>
                
                {/* Image Banner */}
                <div style={{ position: 'relative', width: '100%', height: 160, overflow: 'hidden' }}>
                  <img
                    src={imageUrl}
                    alt={r.name}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.85)' }}
                  />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(15,22,36,0.95) 100%)'
                  }} />

                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(fav.id);
                    }}
                    title="Remove from favorites"
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      background: 'rgba(239,68,68,0.25)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(239,68,68,0.5)',
                      borderRadius: 10,
                      width: 32,
                      height: 32,
                      cursor: 'pointer',
                      color: '#fca5a5',
                      fontSize: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 3
                    }}>
                    ✕
                  </button>

                  <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }}>
                    <span className="badge badge-blue" style={{ fontSize: 11 }}>{fav.category}</span>
                  </div>
                </div>

                {/* Content */}
                <div
                  onClick={() => {
                    sound.playClick();
                    nav(`/recipe/${r.id}`);
                  }}
                  style={{ padding: '16px 18px', cursor: 'pointer' }}>
                  <h3 style={{
                    fontFamily: 'Playfair Display',
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    margin: '0 0 6px',
                    color: '#f1f5f9',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {r.name}
                  </h3>
                  <p style={{
                    fontSize: 12.5,
                    color: '#94a3b8',
                    lineHeight: 1.5,
                    marginBottom: 14,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {r.description}
                  </p>

                  <div style={{
                    display: 'flex',
                    gap: 14,
                    fontSize: 12,
                    color: '#94a3b8',
                    paddingTop: 10,
                    borderTop: '1px solid rgba(255,255,255,0.06)'
                  }}>
                    <span>⏱️ {totalTime} min</span>
                    <span>🍽️ {r.servings} servings</span>
                    {r.nutrition?.calories > 0 && <span>🔥 {Math.round(r.nutrition.calories)} kcal</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
