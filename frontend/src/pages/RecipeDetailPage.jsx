import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import toast from 'react-hot-toast';
import { getRecipeImage } from '../utils/recipeImages';
import { sound } from '../utils/soundEffects';
import FlavorRadarChart from '../components/FlavorRadarChart';
import CookModeModal from '../components/CookModeModal';

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
  const [cookModeOpen, setCookModeOpen] = useState(false);

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
    sound.playClick();
    if (isFav) {
      await api.delete(`/favorites/${favId}`);
      setIsFav(false); setFavId(null);
      toast.success('Removed from favorites');
    } else {
      const { data } = await api.post('/favorites/', { recipe_id: +id });
      setIsFav(true); setFavId(data.id);
      sound.playSuccess();
      toast.success('Added to favorites ❤️');
    }
  };

  const addToGrocery = async () => {
    sound.playClick();
    try {
      await api.post(`/grocery/from-recipe/${id}`);
      sound.playSuccess();
      toast.success('Grocery list created! 🛒');
    } catch { toast.error('Failed to create grocery list'); }
  };

  const getSubstitution = async (ingredient) => {
    sound.playClick();
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
  const heroImage = getRecipeImage(recipe);

  return (
    <div className="page-container" style={{ maxWidth: 960 }}>
      {/* Back button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button onClick={() => nav(-1)} className="btn-secondary" style={{ padding: '8px 18px', fontSize: 14 }}>
          ← Back
        </button>

        {/* Live Cook Mode Hero Trigger */}
        <button
          onClick={() => {
            sound.playChime();
            setCookModeOpen(true);
          }}
          className="btn-primary animate-pulse-glow hover-lift"
          style={{
            padding: '10px 22px',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 0 25px rgba(16,185,129,0.45)'
          }}
        >
          <span style={{ fontSize: 18 }}>👨‍🍳</span>
          <span>Start Live Cook Mode</span>
        </button>
      </div>

      {/* Hero Visual Card with High-Res Culinary Photography */}
      <div style={{
        position: 'relative',
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 28,
        minHeight: 340,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '32px 36px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        {/* Background Image */}
        <img
          src={heroImage}
          alt={recipe.name}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(0.55)',
            transform: 'scale(1.02)',
            transition: 'transform 0.8s ease'
          }}
        />

        {/* Gradient Overlay for rich readability */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(8,12,20,0.2) 0%, rgba(8,12,20,0.7) 50%, rgba(8,12,20,0.98) 100%)'
        }} />

        {/* Content over image */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* Badges */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {recipe.is_ai_generated && <span className="badge badge-green">🤖 AI Signature</span>}
            <span className="badge badge-blue">{recipe.cuisine || 'International'}</span>
            <span style={{
              fontSize: 12,
              padding: '4px 12px',
              borderRadius: 20,
              background: `${diffColor}25`,
              color: diffColor,
              border: `1px solid ${diffColor}60`,
              fontWeight: 600
            }}>
              ● {recipe.difficulty}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <h1 style={{
                fontFamily: 'Playfair Display',
                fontSize: 'clamp(1.8rem, 4.5vw, 2.7rem)',
                fontWeight: 700,
                color: '#ffffff',
                marginBottom: 8,
                textShadow: '0 2px 10px rgba(0,0,0,0.6)'
              }}>
                {recipe.name}
              </h1>
              <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: 650 }}>
                {recipe.description}
              </p>
            </div>

            {/* Quick action buttons */}
            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              <button onClick={toggleFav} style={{
                background: isFav ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${isFav ? '#ef4444' : 'rgba(255,255,255,0.2)'}`,
                borderRadius: 14,
                padding: '10px 18px',
                cursor: 'pointer',
                color: isFav ? '#f87171' : '#f1f5f9',
                fontSize: 18,
                transition: 'all 0.2s'
              }}>
                {isFav ? '❤️' : '🤍'}
              </button>
              <button onClick={addToGrocery} className="btn-secondary" style={{
                padding: '10px 18px',
                fontSize: 14,
                backdropFilter: 'blur(10px)',
                background: 'rgba(255,255,255,0.12)'
              }}>
                🛒 Add to Grocery
              </button>
            </div>
          </div>

          {/* Time & Servings Bar */}
          <div style={{
            display: 'flex',
            gap: 24,
            marginTop: 24,
            paddingTop: 18,
            borderTop: '1px solid rgba(255,255,255,0.15)',
            flexWrap: 'wrap'
          }}>
            {[
              { icon: '⏱️', label: 'Prep Time', value: `${recipe.preparation_time} min` },
              { icon: '🔥', label: 'Cook Time', value: `${recipe.cooking_time} min` },
              { icon: '⏰', label: 'Total Time', value: `${totalTime} min` },
              { icon: '🍽️', label: 'Servings', value: `${recipe.servings} portions` },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Flavor Radar + Nutrition Donut */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 24 }}>
        {/* AI Flavor Radar Chart */}
        <FlavorRadarChart recipe={recipe} />

        {/* Nutrition Card */}
        {nutr && (
          <div className="glass" style={{ padding: 24, borderRadius: 18 }}>
            <h2 className="section-title" style={{ fontSize: '1.15rem', marginBottom: 12 }}>
              📊 Nutritional Composition <span style={{ fontSize: 12, color: '#64748b' }}>(per serving)</span>
            </h2>
            <div style={{ height: 180 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={nutChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                    {nutChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v}g`, n]} contentStyle={{ background: '#0f1624', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 12 }}>
              {[
                { label: 'Calories', value: `${Math.round(nutr.calories)} kcal`, color: '#f87171' },
                { label: 'Protein', value: `${nutr.protein}g`, color: '#10b981' },
                { label: 'Carbs', value: `${nutr.carbohydrates}g`, color: '#3b82f6' },
                { label: 'Fat', value: `${nutr.fat}g`, color: '#f59e0b' },
                { label: 'Fiber', value: `${nutr.fiber}g`, color: '#8b5cf6' },
              ].map(n => (
                <div key={n.label} style={{
                  background: 'rgba(255,255,255,0.03)',
                  padding: '6px 12px',
                  borderRadius: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 12.5
                }}>
                  <span style={{ color: '#94a3b8' }}>{n.label}</span>
                  <span style={{ color: n.color, fontWeight: 700 }}>{n.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Ingredients & Substitution */}
      <div className="glass" style={{ padding: 28, marginBottom: 24, borderRadius: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="section-title" style={{ fontSize: '1.25rem', margin: 0 }}>
            🧂 Ingredients & Smart Substitutions
          </h2>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Tap ↔ for AI swaps
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {recipe.ingredients?.map(ing => (
            <div key={ing.id || ing.name} style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.06)',
              padding: '12px 14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>{ing.name}</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: '#10b981', fontWeight: 600, fontSize: 13 }}>{ing.quantity} {ing.unit}</span>
                  <button onClick={() => getSubstitution(ing.name)} title="Get AI substitution"
                    style={{
                      background: 'rgba(245,158,11,0.12)',
                      border: '1px solid rgba(245,158,11,0.3)',
                      borderRadius: 6,
                      padding: '3px 8px',
                      fontSize: 12,
                      color: '#f59e0b',
                      cursor: 'pointer'
                    }}>
                    ↔
                  </button>
                </div>
              </div>
              {subs[ing.name] && (
                <div style={{
                  background: 'rgba(245,158,11,0.06)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  marginTop: 8
                }}>
                  <div style={{ fontSize: 11, color: '#f59e0b', marginBottom: 4, fontWeight: 700 }}>AI Alternatives:</div>
                  {subs[ing.name].map((s, i) => (
                    <div key={i} style={{ fontSize: 12, color: '#cbd5e1', padding: '2px 0' }}>• {s}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step by Step Instructions with Timer Indicators */}
      <div className="glass" style={{ padding: 32, marginBottom: 24, borderRadius: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 className="section-title" style={{ fontSize: '1.25rem', margin: 0 }}>
            📋 Method & Steps
          </h2>
          <button
            onClick={() => {
              sound.playChime();
              setCookModeOpen(true);
            }}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: 13 }}
          >
            Open Interactive Cook Mode 👨‍🍳
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {instructions.map((step, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: 16,
              padding: 16,
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <div className="step-number" style={{ minWidth: 32, height: 32, fontSize: 14 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#cbd5e1', lineHeight: 1.7, margin: 0, fontSize: 15 }}>{step}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Cooking Tips */}
      {tips.length > 0 && (
        <div className="glass" style={{ padding: 28, borderRadius: 18 }}>
          <h2 className="section-title" style={{ fontSize: '1.2rem', marginBottom: 16 }}>💡 Master Chef Secrets</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tips.map((tip, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                padding: '12px 16px',
                background: 'rgba(16,185,129,0.05)',
                border: '1px solid rgba(16,185,129,0.15)',
                borderRadius: 12
              }}>
                <span style={{ color: '#10b981', fontSize: 18 }}>✦</span>
                <span style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.6 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Screen Live Cook Mode Modal */}
      {cookModeOpen && (
        <CookModeModal
          recipe={recipe}
          instructions={instructions}
          onClose={() => setCookModeOpen(false)}
        />
      )}
    </div>
  );
}
