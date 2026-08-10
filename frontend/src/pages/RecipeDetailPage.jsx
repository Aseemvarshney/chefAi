import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function RecipeDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [favId, setFavId] = useState(null);
  const [tips, setTips] = useState([]);
  const [subs, setSubs] = useState({});
  const [subIngredient, setSubIngredient] = useState('');
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/recipes/${id}`),
      api.get(`/favorites/check/${id}`),
      api.get(`/ai/cooking-tips/${id}`),
    ]).then(([rRes, fRes, tRes]) => {
      setRecipe(rRes.data);
      setIsFav(fRes.data.is_favorite);
      setFavId(fRes.data.favorite_id);
      setTips(tRes.data.tips || []);
    }).catch(() => toast.error('Recipe not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleFav = async () => {
    if (isFav) {
      await api.delete(`/favorites/${favId}`);
      setIsFav(false); setFavId(null);
      toast.success('Removed from favorites');
    } else {
      const { data } = await api.post('/favorites/', { recipe_id: +id });
      setIsFav(true); setFavId(data.id);
      toast.success('Added to favorites ❤️');
    }
  };

  const addToGrocery = async () => {
    try {
      await api.post(`/grocery/from-recipe/${id}`);
      toast.success('Grocery list created! 🛒');
    } catch { toast.error('Failed to create grocery list'); }
  };

  const getSubstitution = async (ingredient) => {
    setSubIngredient(ingredient);
    setSubLoading(true);
    try {
      const { data } = await api.post('/ai/substitution', { ingredient, context: recipe?.name });
      setSubs(p => ({ ...p, [ingredient]: data.substitutions }));
    } catch { toast.error('Failed to get substitutions'); }
    finally { setSubLoading(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="spinner" />
    </div>
  );
  if (!recipe) return <div style={{ textAlign: 'center', padding: 60 }}>Recipe not found</div>;

  let instructions = [];
  try { instructions = JSON.parse(recipe.instructions || '[]'); } catch {}

  const nutr = recipe.nutrition;
  const nutChartData = nutr ? [
    { name: 'Carbs', value: nutr.carbohydrates, color: '#3b82f6' },
    { name: 'Protein', value: nutr.protein, color: '#10b981' },
    { name: 'Fat', value: nutr.fat, color: '#f59e0b' },
    { name: 'Fiber', value: nutr.fiber, color: '#8b5cf6' },
  ] : [];

  const totalTime = (recipe.preparation_time || 0) + (recipe.cooking_time || 0);
  const diffColor = { Easy: '#10b981', Medium: '#f59e0b', Hard: '#ef4444' }[recipe.difficulty] || '#94a3b8';

  return (
    <div className="page-container" style={{ maxWidth: 900 }}>
      {/* Back */}
      <button onClick={() => nav(-1)} className="btn-secondary" style={{ marginBottom: 24, padding: '8px 18px', fontSize: 14 }}>
        ← Back
      </button>

      {/* Header */}
      <div className="glass" style={{ padding: 32, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              {recipe.is_ai_generated && <span className="badge badge-green">🤖 AI Generated</span>}
              <span className="badge badge-blue">{recipe.cuisine || 'International'}</span>
              <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: `${diffColor}20`, color: diffColor, border: `1px solid ${diffColor}40` }}>
                ● {recipe.difficulty}
              </span>
            </div>
            <h1 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(1.5rem,4vw,2.2rem)', fontWeight: 700, marginBottom: 12 }}>
              {recipe.name}
            </h1>
            <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>{recipe.description}</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            <button onClick={toggleFav} style={{
              background: isFav ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${isFav ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 10, padding: '10px 18px', cursor: 'pointer',
              color: isFav ? '#f87171' : '#94a3b8', fontSize: 18, transition: 'all 0.2s'
            }}>{isFav ? '❤️' : '🤍'}</button>
            <button onClick={addToGrocery} className="btn-primary" style={{ padding: '10px 18px', fontSize: 14 }}>
              🛒 Grocery List
            </button>
          </div>
        </div>

        {/* Time stats */}
        <div style={{ display: 'flex', gap: 24, marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.07)', flexWrap: 'wrap' }}>
          {[
            { icon: '⏱️', label: 'Prep Time', value: `${recipe.preparation_time} min` },
            { icon: '🔥', label: 'Cook Time', value: `${recipe.cooking_time} min` },
            { icon: '⏰', label: 'Total Time', value: `${totalTime} min` },
            { icon: '🍽️', label: 'Servings', value: `${recipe.servings} people` },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
        {/* Ingredients */}
        <div className="glass" style={{ padding: 28 }}>
          <h2 className="section-title">🧂 Ingredients</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recipe.ingredients?.map(ing => (
              <div key={ing.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.2s' }}>
                  <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{ing.name}</span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>{ing.quantity} {ing.unit}</span>
                    <button onClick={() => getSubstitution(ing.name)} title="Get AI substitution"
                      style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                        borderRadius: 6, padding: '2px 8px', fontSize: 12, color: '#f59e0b', cursor: 'pointer' }}>
                      ↔
                    </button>
                  </div>
                </div>
                {subs[ing.name] && (
                  <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)',
                    borderRadius: 8, padding: '10px 14px', marginTop: 4 }}>
                    <div style={{ fontSize: 11, color: '#f59e0b', marginBottom: 6, fontWeight: 600 }}>Substitutions:</div>
                    {subs[ing.name].map((s, i) => (
                      <div key={i} style={{ fontSize: 12, color: '#94a3b8', padding: '3px 0' }}>• {s}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Nutrition */}
        {nutr && (
          <div className="glass" style={{ padding: 28 }}>
            <h2 className="section-title">📊 Nutrition <span style={{ fontSize: 13, color: '#64748b', fontFamily: 'Inter' }}>(per serving)</span></h2>
            <div style={{ height: 180 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={nutChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {nutChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v}g`, n]} contentStyle={{ background: '#0f1624', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {[
                { label: 'Calories', value: `${Math.round(nutr.calories)} kcal`, color: '#f87171' },
                { label: 'Protein', value: `${nutr.protein}g`, color: '#10b981' },
                { label: 'Carbohydrates', value: `${nutr.carbohydrates}g`, color: '#3b82f6' },
                { label: 'Fat', value: `${nutr.fat}g`, color: '#f59e0b' },
                { label: 'Fiber', value: `${nutr.fiber}g`, color: '#8b5cf6' },
              ].map(n => (
                <div key={n.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#94a3b8' }}>{n.label}</span>
                  <span style={{ color: n.color, fontWeight: 600 }}>{n.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="glass" style={{ padding: 32, marginTop: 24 }}>
        <h2 className="section-title">📋 Step-by-Step Instructions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {instructions.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="step-number">{i + 1}</div>
              <p style={{ color: '#cbd5e1', lineHeight: 1.7, flex: 1 }}>{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      {tips.length > 0 && (
        <div className="glass" style={{ padding: 28, marginTop: 24 }}>
          <h2 className="section-title">💡 AI Cooking Tips</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 16px',
                background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10 }}>
                <span style={{ color: '#10b981', fontSize: 18 }}>✦</span>
                <span style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
