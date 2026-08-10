import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function FavoritesPage() {
  const [favs, setFavs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const nav = useNavigate();

  useEffect(() => { api.get('/favorites/').then(r => setFavs(r.data)).finally(() => setLoading(false)); }, []);

  const remove = async (favId) => {
    await api.delete(`/favorites/${favId}`);
    setFavs(p => p.filter(f => f.id !== favId));
    toast.success('Removed from favorites');
  };

  const categories = ['All', ...new Set(favs.map(f => f.category || 'General'))];
  const filtered = filter === 'All' ? favs : favs.filter(f => f.category === filter);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>;

  return (
    <div className="page-container">
      <h1 className="section-title" style={{ fontSize: '1.8rem', marginBottom: 24 }}>❤️ My Favorites</h1>

      {/* Filter */}
      {categories.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {categories.map(c => (
            <button key={c} onClick={() => setFilter(c)} className="tag-chip" style={{ background: filter === c ? 'rgba(16,185,129,0.15)' : '', borderColor: filter === c ? '#10b981' : '', color: filter === c ? '#10b981' : '' }}>
              {c} {c === 'All' ? `(${favs.length})` : `(${favs.filter(f=>f.category===c).length})`}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748b' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>💔</div>
          <h3 style={{ fontSize: '1.2rem', color: '#94a3b8', marginBottom: 8 }}>No favorites yet</h3>
          <p>Search for recipes and save your favorites!</p>
          <button className="btn-primary" onClick={() => nav('/')} style={{ marginTop: 24 }}>Find Recipes</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
          {filtered.map(fav => {
            const r = fav.recipe;
            const totalTime = (r.preparation_time || 0) + (r.cooking_time || 0);
            return (
              <div key={fav.id} className="recipe-card" style={{ padding: 20, position: 'relative' }}>
                <button onClick={e => { e.stopPropagation(); remove(fav.id); }}
                  style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#f87171', fontSize: 16 }}>✕</button>
                <div onClick={() => nav(`/recipe/${r.id}`)} style={{ cursor: 'pointer' }}>
                  <div style={{ marginBottom: 4 }}><span className="badge badge-blue" style={{ fontSize: 11 }}>{fav.category}</span></div>
                  <h3 style={{ fontFamily: 'Playfair Display', fontSize: '1.1rem', fontWeight: 700, margin: '10px 0 6px', color: '#f1f5f9' }}>{r.name}</h3>
                  <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: 14,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.description}</p>
                  <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#94a3b8' }}>
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
