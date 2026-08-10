import { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function FridgeModePage() {
  const [input, setInput] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);

  const addIngredient = () => {
    const val = input.trim();
    if (val && !ingredients.includes(val)) {
      setIngredients(p => [...p, val]);
    }
    setInput('');
  };

  const removeIngredient = (ing) => setIngredients(p => p.filter(i => i !== ing));

  const getSuggestions = async () => {
    if (ingredients.length === 0) return toast.error('Add at least one ingredient!');
    setLoading(true);
    setSuggestions(null);
    try {
      const { data } = await api.post('/ai/fridge-mode', { ingredients });
      setSuggestions(data.suggestions);
    } catch { toast.error('Failed to get suggestions'); }
    finally { setLoading(false); }
  };

  const EXAMPLE_INGREDIENTS = ['Eggs', 'Tomato', 'Onion', 'Rice', 'Chicken', 'Pasta', 'Garlic', 'Potato'];

  return (
    <div className="page-container" style={{ maxWidth: 800 }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>🧊</div>
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: '2rem', fontWeight: 700, marginBottom: 8 }} className="gradient-text">Fridge Mode</h1>
        <p style={{ color: '#64748b', fontSize: '1rem' }}>Enter what's in your fridge and get AI recipe suggestions!</p>
      </div>

      {/* Input */}
      <div className="glass" style={{ padding: 28, marginBottom: 24 }}>
        <h3 style={{ fontWeight: 600, color: '#94a3b8', fontSize: '0.9rem', marginBottom: 12 }}>ADD INGREDIENTS</h3>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input className="input-field" placeholder="Type an ingredient..." value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addIngredient()} />
          <button className="btn-primary" onClick={addIngredient} style={{ padding: '12px 24px', whiteSpace: 'nowrap' }}>+ Add</button>
        </div>

        {/* Quick add */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          <span style={{ fontSize: 12, color: '#64748b', alignSelf: 'center' }}>Quick add:</span>
          {EXAMPLE_INGREDIENTS.map(ing => !ingredients.includes(ing) && (
            <button key={ing} onClick={() => setIngredients(p => [...p, ing])} className="tag-chip" style={{ fontSize: 12 }}>{ing}</button>
          ))}
        </div>

        {/* Added ingredients */}
        {ingredients.length > 0 && (
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>Your ingredients ({ingredients.length}):</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {ingredients.map(ing => (
                <span key={ing} className="tag-chip active" style={{ background: 'rgba(16,185,129,0.15)', borderColor: '#10b981', color: '#10b981' }}>
                  {ing}
                  <span className="remove" onClick={() => removeIngredient(ing)} style={{ cursor: 'pointer', marginLeft: 6, fontSize: 14, color: '#ef4444' }}>✕</span>
                </span>
              ))}
            </div>
            <button className="btn-primary" onClick={getSuggestions} disabled={loading} style={{ width: '100%', padding: '14px', fontSize: 15 }}>
              {loading ? (
                <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                  <span>🤖 AI is finding recipes</span>
                  {[0,1,2].map(i => <div key={i} className="typing-dot" style={{ animationDelay: `${i*0.2}s` }} />)}
                </span>
              ) : '🔍 Find Recipes!'}
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {suggestions && (
        <div>
          <h2 className="section-title">✨ Recipe Suggestions ({suggestions.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {suggestions.map((s, i) => (
              <div key={i} className="glass" style={{ padding: 24, borderLeft: '3px solid #10b981' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f1f5f9', marginBottom: 12 }}>{s.name}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600, marginBottom: 6 }}>✅ You have:</div>
                    {s.matching_ingredients?.map(ing => (
                      <div key={ing} style={{ fontSize: 13, color: '#94a3b8', padding: '2px 0' }}>• {ing}</div>
                    ))}
                  </div>
                  {s.missing_ingredients?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600, marginBottom: 6 }}>🛒 You need:</div>
                      {s.missing_ingredients.map(ing => (
                        <div key={ing} style={{ fontSize: 13, color: '#94a3b8', padding: '2px 0' }}>• {ing}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
