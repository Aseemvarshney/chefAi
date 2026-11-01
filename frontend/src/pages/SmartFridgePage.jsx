import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { sound } from '../utils/soundEffects';
import { getRecipeImage } from '../utils/recipeImages';

export default function SmartFridgePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Grouped ingredients with freshness indicators
  const [ingredients, setIngredients] = useState({
    fridge: [
      { id: 1, name: 'Eggs', quantity: '4', unit: 'pcs', freshness: 'fresh' },
      { id: 2, name: 'Whole Milk', quantity: '1', unit: 'cup', freshness: 'fresh' },
      { id: 3, name: 'Ripe Tomatoes', quantity: '3', unit: 'pcs', freshness: 'expiring' },
      { id: 4, name: 'Baby Spinach', quantity: '100', unit: 'g', freshness: 'good' },
      { id: 5, name: 'Cheddar Cheese', quantity: '50', unit: 'g', freshness: 'good' }
    ],
    pantry: [
      { id: 6, name: 'Basmati Rice', quantity: '2', unit: 'cups', freshness: 'fresh' },
      { id: 7, name: 'Extra Virgin Olive Oil', quantity: '2', unit: 'tbsp', freshness: 'fresh' },
      { id: 8, name: 'Penne Pasta', quantity: '250', unit: 'g', freshness: 'fresh' }
    ],
    spices: [
      { id: 9, name: 'Cracked Black Pepper', quantity: '1', unit: 'tsp', freshness: 'fresh' },
      { id: 10, name: 'Garlic Cloves', quantity: '4', unit: 'cloves', freshness: 'good' },
      { id: 11, name: 'Smoked Paprika', quantity: '1', unit: 'tsp', freshness: 'fresh' }
    ]
  });

  const [inputForms, setInputForms] = useState({
    fridge: { name: '', quantity: '', unit: '' },
    pantry: { name: '', quantity: '', unit: '' },
    spices: { name: '', quantity: '', unit: '' }
  });

  const [maxTime, setMaxTime] = useState(35);
  const [dietaryPref, setDietaryPref] = useState('none');
  const [suggestions, setSuggestions] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Selected ingredients in the interactive wok
  const [selectedInWok, setSelectedInWok] = useState([1, 2, 3, 6, 7, 10]);

  const toggleWokItem = (id) => {
    sound.playClick();
    setSelectedInWok(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const addIngredient = (category) => {
    const form = inputForms[category];
    if (!form.name.trim()) {
      toast.error('Ingredient name is required');
      return;
    }

    sound.playClick();
    const newItem = {
      id: Date.now(),
      name: form.name.trim(),
      quantity: form.quantity.trim() || '1',
      unit: form.unit.trim() || 'portion',
      freshness: 'fresh'
    };

    setIngredients(prev => ({
      ...prev,
      [category]: [...prev[category], newItem]
    }));

    setSelectedInWok(prev => [...prev, newItem.id]);

    setInputForms(prev => ({
      ...prev,
      [category]: { name: '', quantity: '', unit: '' }
    }));
    toast.success(`Added ${newItem.name} to shelf`);
  };

  const removeIngredient = (category, id) => {
    sound.playClick();
    setIngredients(prev => ({
      ...prev,
      [category]: prev[category].filter(item => item.id !== id)
    }));
    setSelectedInWok(prev => prev.filter(x => x !== id));
  };

  const getAllIngredients = () => {
    const list = [];
    Object.keys(ingredients).forEach(cat => {
      ingredients[cat].forEach(item => {
        if (selectedInWok.includes(item.id)) {
          list.push({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            category: cat
          });
        }
      });
    });
    return list;
  };

  const fetchSmartSuggestions = async () => {
    const activeIngs = getAllIngredients();
    if (activeIngs.length === 0) {
      toast.error('Select at least one ingredient for the cooking wok!');
      return;
    }

    sound.playSizzle();
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await api.post('/ai/smart-fridge', {
        ingredients: activeIngs,
        dietary_preference: dietaryPref,
        max_cooking_time: maxTime
      });
      sound.playSuccess();
      setSuggestions(res.data.suggestions || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to get smart fridge recipe suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleCookNow = async (dishName) => {
    sound.playSizzle();
    toast.loading(`Chef AI is crafting recipe for ${dishName}...`, { id: 'fridge-recipe' });
    try {
      const res = await api.post('/recipes/search', { dish_name: dishName, servings: 2 });
      sound.playSuccess();
      toast.success(`Recipe crafted for ${dishName}!`, { id: 'fridge-recipe' });
      navigate(`/recipe/${res.data.id}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to generate recipe', { id: 'fridge-recipe' });
    }
  };

  const categoryConfigs = [
    {
      key: 'fridge',
      title: '🥬 Chilled Crisper & Dairy',
      subtitle: 'Fresh produce, meats, eggs & cheeses',
      bg: 'rgba(16,185,129,0.06)',
      border: 'rgba(16,185,129,0.2)'
    },
    {
      key: 'pantry',
      title: '🏺 Artisanal Pantry',
      subtitle: 'Grains, pasta, flour, stocks & oils',
      bg: 'rgba(245,158,11,0.06)',
      border: 'rgba(245,158,11,0.2)'
    },
    {
      key: 'spices',
      title: '🌶️ Spice & Herb Rack',
      subtitle: 'Aromatics, fresh herbs, seasonings',
      bg: 'rgba(239,68,68,0.06)',
      border: 'rgba(239,68,68,0.2)'
    }
  ];

  const selectedCount = selectedInWok.length;

  return (
    <div className="page-container" style={{ maxWidth: 1200 }}>
      {/* Hero Banner */}
      <div className="glass" style={{
        padding: '32px 36px',
        borderRadius: 24,
        marginBottom: 28,
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(59,130,246,0.1) 100%)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <span style={{ fontSize: 36 }}>🧊</span>
          <h1 style={{
            fontFamily: 'Playfair Display',
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            fontWeight: 700,
            color: '#ffffff',
            margin: 0
          }}>
            Virtual Smart Fridge & Culinary Wok
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', margin: 0, maxWidth: 720, lineHeight: 1.5 }}>
          Inspect your virtual shelves, tap items into your active cooking wok, and let AI synthesize zero-waste gourmet recipes matched to your exact ingredients!
        </p>
      </div>

      {/* 3 Virtual Fridge Shelves */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 20,
        marginBottom: 28
      }}>
        {categoryConfigs.map((catConfig) => (
          <div
            key={catConfig.key}
            className="glass"
            style={{
              padding: 22,
              borderRadius: 20,
              background: catConfig.bg,
              border: `1px solid ${catConfig.border}`,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Shelf Header */}
            <div style={{ marginBottom: 16 }}>
              <h3 style={{
                fontFamily: 'Playfair Display',
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 4px'
              }}>
                {catConfig.title}
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                {catConfig.subtitle}
              </p>
            </div>

            {/* Ingredient Pills on Shelf */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16, minHeight: 90 }}>
              {ingredients[catConfig.key].map(item => {
                const inWok = selectedInWok.includes(item.id);
                const freshnessColor = item.freshness === 'expiring' ? '#ef4444' : item.freshness === 'good' ? '#f59e0b' : '#10b981';

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleWokItem(item.id)}
                    className="hover-scale"
                    style={{
                      background: inWok ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${inWok ? '#10b981' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 20,
                      padding: '6px 12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: inWok ? '0 0 12px rgba(16,185,129,0.25)' : 'none'
                    }}
                  >
                    {/* Freshness Dot */}
                    <span
                      title={item.freshness === 'expiring' ? 'Use today! (Expiring soon)' : 'Fresh'}
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: freshnessColor,
                        boxShadow: `0 0 6px ${freshnessColor}`
                      }}
                    />

                    <span style={{ fontSize: 13, fontWeight: 500, color: inWok ? '#ffffff' : '#cbd5e1' }}>
                      {item.name}
                    </span>

                    <span style={{ fontSize: 11, color: '#94a3b8' }}>
                      {item.quantity} {item.unit}
                    </span>

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeIngredient(catConfig.key, item.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        fontSize: 12,
                        padding: 0,
                        marginLeft: 2
                      }}
                      title="Remove from fridge"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Quick Add Form for this shelf */}
            <div style={{
              marginTop: 'auto',
              paddingTop: 12,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              gap: 8
            }}>
              <input
                className="input-field"
                placeholder="Add ingredient..."
                value={inputForms[catConfig.key].name}
                onChange={e => setInputForms(p => ({
                  ...p,
                  [catConfig.key]: { ...p[catConfig.key], name: e.target.value }
                }))}
                onKeyDown={e => e.key === 'Enter' && addIngredient(catConfig.key)}
                style={{ fontSize: 13, padding: '8px 12px', borderRadius: 10 }}
              />
              <button
                onClick={() => addIngredient(catConfig.key)}
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: 13, whiteSpace: 'nowrap', borderRadius: 10 }}
              >
                + Add
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Cooking Wok / Cauldron Dock */}
      <div className="glass" style={{
        padding: '24px 30px',
        borderRadius: 22,
        marginBottom: 32,
        border: '1px solid rgba(16,185,129,0.3)',
        background: 'linear-gradient(135deg, rgba(15,22,36,0.9) 0%, rgba(13,27,42,0.95) 100%)',
        boxShadow: '0 16px 40px rgba(0,0,0,0.35)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32 }} className="animate-wiggle">🍳</span>
            <div>
              <h3 style={{
                fontFamily: 'Playfair Display',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#ffffff',
                margin: 0
              }}>
                Active Cooking Wok ({selectedCount} Selected)
              </h3>
              <p style={{ fontSize: 12.5, color: '#94a3b8', margin: '2px 0 0' }}>
                Tap items on the shelves above to add or remove them from your pot
              </p>
            </div>
          </div>

          {/* Time & Dietary Constraints */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#cbd5e1' }}>⏱️ Limit:</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>{maxTime} min</span>
              <input
                type="range"
                min="15"
                max="90"
                step="5"
                value={maxTime}
                onChange={e => setMaxTime(+e.target.value)}
                style={{ width: 100, accentColor: '#10b981', cursor: 'pointer' }}
              />
            </div>

            <select
              value={dietaryPref}
              onChange={e => setDietaryPref(e.target.value)}
              className="input-field"
              style={{ width: 150, padding: '8px 12px', fontSize: 13, borderRadius: 10 }}
            >
              <option value="none">Any Diet 🌎</option>
              <option value="vegetarian">Vegetarian 🌿</option>
              <option value="vegan">Vegan 🌱</option>
              <option value="keto">Keto / Low-Carb 🥑</option>
              <option value="high-protein">High Protein 💪</option>
            </select>

            <button
              onClick={fetchSmartSuggestions}
              disabled={loading || selectedCount === 0}
              className="btn-primary hover-lift"
              style={{
                padding: '12px 26px',
                fontSize: 14,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap'
              }}
            >
              <span>🔥</span>
              <span>{loading ? 'Synthesizing Recipes...' : 'Ignite Wok & Match Recipes'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Suggestion Results Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="animate-float" style={{ fontSize: 54, marginBottom: 16 }}>🍲✨</div>
          <h3 style={{ fontFamily: 'Playfair Display', fontSize: '1.4rem', color: '#f1f5f9', marginBottom: 8 }}>
            Chef AI is Crafting Recipes from Your Stock
          </h3>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>
            Maximizing flavor balance, minimizing waste...
          </p>
        </div>
      ) : hasSearched && suggestions.length === 0 ? (
        <div className="glass" style={{ textAlign: 'center', padding: '60px 20px', borderRadius: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <h3 style={{ color: '#f1f5f9', marginBottom: 6 }}>No exact match found</h3>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>
            Try adding standard pantry staples like olive oil, garlic, or increase the cooking time limit.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 22
        }}>
          {suggestions.map((dish, i) => {
            const matchCount = dish.matching_ingredients?.length || 0;
            const missingCount = dish.missing_ingredients?.length || 0;
            const total = matchCount + missingCount || 1;
            const matchPct = Math.round((matchCount / total) * 100);
            const dishImage = getRecipeImage({ name: dish.name, tags: dish.matching_ingredients?.join(' ') });

            return (
              <div
                key={i}
                className="recipe-card hover-lift"
                style={{
                  padding: 0,
                  borderRadius: 20,
                  overflow: 'hidden',
                  background: 'rgba(15,22,36,0.85)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Visual Header */}
                <div style={{ position: 'relative', width: '100%', height: 160, overflow: 'hidden' }}>
                  <img
                    src={dishImage}
                    alt={dish.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.85)' }}
                  />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(15,22,36,0.95) 100%)'
                  }} />

                  <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{
                      background: 'rgba(16,185,129,0.3)',
                      backdropFilter: 'blur(8px)',
                      color: '#34d399',
                      border: '1px solid rgba(16,185,129,0.5)',
                      borderRadius: 20,
                      padding: '3px 10px',
                      fontSize: 11,
                      fontWeight: 700
                    }}>
                      ⚡ {matchPct}% Stock Match
                    </span>
                    <span style={{
                      background: 'rgba(0,0,0,0.6)',
                      borderRadius: 12,
                      padding: '2px 8px',
                      fontSize: 11.5,
                      color: '#f1f5f9'
                    }}>
                      ⏱️ {dish.cooking_time || 30} min
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{
                    fontFamily: 'Playfair Display',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    margin: '0 0 8px'
                  }}>
                    {dish.name}
                  </h3>

                  <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5, marginBottom: 14 }}>
                    {dish.reason}
                  </p>

                  {/* Matching ingredients chips */}
                  <div style={{ marginBottom: 16, marginTop: 'auto' }}>
                    <div style={{ fontSize: 11.5, color: '#10b981', fontWeight: 600, marginBottom: 6 }}>
                      ✓ Uses from your stock:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {dish.matching_ingredients?.map((m, idx) => (
                        <span key={idx} style={{
                          background: 'rgba(16,185,129,0.1)',
                          border: '1px solid rgba(16,185,129,0.25)',
                          borderRadius: 8,
                          padding: '2px 7px',
                          fontSize: 11,
                          color: '#34d399'
                        }}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Missing items if any */}
                  {dish.missing_ingredients?.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11.5, color: '#f59e0b', fontWeight: 600, marginBottom: 4 }}>
                        + Needed:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {dish.missing_ingredients.map((m, idx) => (
                          <span key={idx} style={{
                            background: 'rgba(245,158,11,0.1)',
                            border: '1px solid rgba(245,158,11,0.25)',
                            borderRadius: 8,
                            padding: '2px 7px',
                            fontSize: 11,
                            color: '#fbbf24'
                          }}>
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleCookNow(dish.name)}
                    className="btn-primary hover-lift"
                    style={{ width: '100%', padding: '10px 0', fontSize: 13.5, borderRadius: 12, marginTop: 10 }}
                  >
                    Generate Full Recipe & Cook 👨‍🍳
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
