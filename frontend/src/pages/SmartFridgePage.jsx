import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function SmartFridgePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Ingredient state grouped by category
  const [ingredients, setIngredients] = useState({
    fridge: [
      { id: 1, name: 'Eggs', quantity: '4', unit: 'pcs' },
      { id: 2, name: 'Milk', quantity: '1', unit: 'cup' },
      { id: 3, name: 'Tomatoes', quantity: '2', unit: 'pcs' }
    ],
    pantry: [
      { id: 4, name: 'Rice', quantity: '2', unit: 'cups' },
      { id: 5, name: 'Olive Oil', quantity: '2', unit: 'tbsp' }
    ],
    spices: [
      { id: 6, name: 'Black Pepper', quantity: '1', unit: 'tsp' },
      { id: 7, name: 'Garlic Powder', quantity: '1', unit: 'tsp' }
    ]
  });

  const [inputForms, setInputForms] = useState({
    fridge: { name: '', quantity: '', unit: '' },
    pantry: { name: '', quantity: '', unit: '' },
    spices: { name: '', quantity: '', unit: '' }
  });

  const [maxTime, setMaxTime] = useState(45);
  const [dietaryPref, setDietaryPref] = useState('none');
  const [suggestions, setSuggestions] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const addIngredient = (category) => {
    const form = inputForms[category];
    if (!form.name.trim()) {
      toast.error('Ingredient name is required');
      return;
    }

    const newItem = {
      id: Date.now(),
      name: form.name.trim(),
      quantity: form.quantity.trim(),
      unit: form.unit.trim()
    };

    setIngredients(prev => ({
      ...prev,
      [category]: [...prev[category], newItem]
    }));

    setInputForms(prev => ({
      ...prev,
      [category]: { name: '', quantity: '', unit: '' }
    }));
  };

  const removeIngredient = (category, id) => {
    setIngredients(prev => ({
      ...prev,
      [category]: prev[category].filter(item => item.id !== id)
    }));
  };

  const getCombinedIngredientsList = () => {
    const list = [];
    Object.keys(ingredients).forEach(cat => {
      ingredients[cat].forEach(item => {
        list.push({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: cat
        });
      });
    });
    return list;
  };

  const fetchSmartSuggestions = async () => {
    const allIngs = getCombinedIngredientsList();
    if (allIngs.length === 0) {
      toast.error('Please add at least one ingredient');
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await api.post('/ai/smart-fridge', {
        ingredients: allIngs,
        dietary_preference: dietaryPref,
        max_cooking_time: maxTime
      });
      setSuggestions(res.data.suggestions || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to get smart fridge recipe suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleCookNow = async (dishName) => {
    toast.loading(`Creating full recipe for ${dishName}...`, { id: 'fridge-recipe' });
    try {
      const res = await api.post('/recipes/generate', { dish_name: dishName, servings: 2 });
      toast.success(`Recipe created for ${dishName}!`, { id: 'fridge-recipe' });
      navigate(`/recipe/${res.data.id}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate recipe', { id: 'fridge-recipe' });
    }
  };

  const categoryConfigs = [
    { key: 'fridge', title: '🧊 Fridge Items', subtitle: 'Fresh produce, meats, dairy' },
    { key: 'pantry', title: '🧺 Pantry Grains & Oils', subtitle: 'Rice, pasta, flour, oils' },
    { key: 'spices', title: '🌶️ Spices & Seasonings', subtitle: 'Herbs, spice powders, salt' }
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px' }}>
      {/* Page Title & Intro */}
      <div className="animate-fadeIn" style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(99,102,241,0.15) 100%)',
        border: '1px solid rgba(16,185,129,0.3)',
        borderRadius: 24,
        padding: '32px 28px',
        marginBottom: 32
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <span style={{ fontSize: 36 }}>⚡</span>
          <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 800 }} className="gradient-text">
            Smart Fridge & Ingredient Analyzer
          </h1>
        </div>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: 700 }}>
          Organize your available ingredients across your fridge, pantry, and spice rack. AI will instantly match delicious recipes tailored to your exact stock & time limits!
        </p>
      </div>

      {/* 3-Column Ingredient Organizer */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 24,
        marginBottom: 32
      }}>
        {categoryConfigs.map((catConfig) => (
          <div key={catConfig.key} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 700 }}>
                {catConfig.title}
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: 13, color: 'var(--text-muted)' }}>
                {catConfig.subtitle}
              </p>

              {/* Tag Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20, minHeight: 60 }}>
                {ingredients[catConfig.key].length === 0 ? (
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No items added yet
                  </span>
                ) : (
                  ingredients[catConfig.key].map(item => (
                    <span key={item.id} style={{
                      background: 'rgba(16,185,129,0.12)',
                      color: '#10b981',
                      border: '1px solid rgba(16,185,129,0.3)',
                      borderRadius: 20,
                      padding: '6px 12px',
                      fontSize: 13,
                      fontWeight: 500,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <span>{item.name}</span>
                      {item.quantity && <span style={{ opacity: 0.75, fontSize: 11 }}>({item.quantity} {item.unit})</span>}
                      <button
                        onClick={() => removeIngredient(catConfig.key, item.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: 14,
                          lineHeight: 1,
                          padding: '0 2px'
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Input Form for this category */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed var(--border)',
              borderRadius: 14,
              padding: 12
            }}>
              <input
                type="text"
                placeholder="Ingredient name (e.g. Garlic)"
                value={inputForms[catConfig.key].name}
                onChange={(e) => setInputForms({
                  ...inputForms,
                  [catConfig.key]: { ...inputForms[catConfig.key], name: e.target.value }
                })}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-main)',
                  color: 'var(--text-main)',
                  fontSize: 13
                }}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  placeholder="Qty (e.g. 2)"
                  value={inputForms[catConfig.key].quantity}
                  onChange={(e) => setInputForms({
                    ...inputForms,
                    [catConfig.key]: { ...inputForms[catConfig.key], quantity: e.target.value }
                  })}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: 13
                  }}
                />
                <input
                  type="text"
                  placeholder="Unit (e.g. pcs/tbsp)"
                  value={inputForms[catConfig.key].unit}
                  onChange={(e) => setInputForms({
                    ...inputForms,
                    [catConfig.key]: { ...inputForms[catConfig.key], unit: e.target.value }
                  })}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: 13
                  }}
                />
                <button
                  onClick={() => addIngredient(catConfig.key)}
                  className="hover-scale"
                  style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    padding: '0 14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 16
                  }}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Constraints Settings Bar */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: 24,
        marginBottom: 32,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20
      }}>
        {/* Cooking Time Slider */}
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>
              ⏱️ Max Cooking Time
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>
              {maxTime} mins
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="120"
            step="5"
            value={maxTime}
            onChange={(e) => setMaxTime(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
          />
        </div>

        {/* Dietary Preference Filter */}
        <div style={{ minWidth: 220 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-main)', marginBottom: 8 }}>
            🥗 Dietary Preference
          </label>
          <select
            value={dietaryPref}
            onChange={(e) => setDietaryPref(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--bg-main)',
              color: 'var(--text-main)',
              fontSize: 14
            }}
          >
            <option value="none">None (All Meals)</option>
            <option value="vegetarian">Vegetarian 🌿</option>
            <option value="vegan">Vegan 🌱</option>
            <option value="gluten-free">Gluten-Free 🌾</option>
            <option value="keto">Keto / Low-Carb 🥑</option>
          </select>
        </div>

        {/* Generate Button */}
        <div style={{ alignSelf: 'flex-end' }}>
          <button
            onClick={fetchSmartSuggestions}
            disabled={loading}
            className="hover-scale"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 14,
              padding: '14px 28px',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(16,185,129,0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}
          >
            {loading ? '🔍 Analyzing Ingredients...' : '🚀 Find Recipe Matches'}
          </button>
        </div>
      </div>

      {/* Suggestion Results */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="animate-float" style={{ fontSize: 48, marginBottom: 16 }}>🧊</div>
          <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>Calculating optimal ingredient combinations...</p>
        </div>
      ) : hasSearched && suggestions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          No matching recipes found. Try adding more pantry or fridge items!
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {suggestions.map((dish, i) => {
            const matchCount = dish.matching_ingredients?.length || 0;
            const missingCount = dish.missing_ingredients?.length || 0;
            const total = matchCount + missingCount || 1;
            const matchPct = Math.round((matchCount / total) * 100);

            return (
              <div
                key={i}
                className={`animate-fadeIn stagger-${(i % 4) + 1}`}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 20,
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.05)'
                }}
              >
                <div>
                  {/* Top Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{
                      background: 'rgba(16,185,129,0.15)',
                      color: '#10b981',
                      borderRadius: 12,
                      padding: '4px 10px',
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      ⚡ {matchPct}% Match
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      🔥 ~{dish.estimated_calories || 400} kcal
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 10px 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {dish.name}
                  </h3>

                  {/* Match Progress Bar */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ height: 6, width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${matchPct}%`, background: '#10b981', borderRadius: 3 }} />
                    </div>
                  </div>

                  {/* Matching vs Missing chips */}
                  <div style={{ fontSize: 13, marginBottom: 14 }}>
                    <div style={{ color: '#10b981', fontWeight: 600, marginBottom: 4 }}>
                      ✅ In Stock: {dish.matching_ingredients?.join(', ')}
                    </div>
                    {dish.missing_ingredients?.length > 0 && (
                      <div style={{ color: '#f87171', fontWeight: 500 }}>
                        🛒 Need: {dish.missing_ingredients?.join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    marginBottom: 16,
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 10
                  }}>
                    ⏱️ {dish.cooking_time || 25} mins | 📊 {dish.difficulty || 'Medium'}
                  </div>

                  <button
                    onClick={() => handleCookNow(dish.name)}
                    className="hover-scale"
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 12,
                      padding: '12px',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    🍳 Cook Now
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
