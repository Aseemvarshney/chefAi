import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' };
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

function getWeekStart(offset = 0) {
  const d = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1 + offset * 7);
  return d.toISOString().split('T')[0];
}

export default function MealPlannerPage() {
  const [plans, setPlans] = useState([]);
  const [weekStart, setWeekStart] = useState(getWeekStart());
  const [weekOffset, setWeekOffset] = useState(0);
  const [aiPlan, setAiPlan] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [addModal, setAddModal] = useState(null); // { date, mealType }
  const [customMeal, setCustomMeal] = useState('');

  useEffect(() => {
    const ws = getWeekStart(weekOffset);
    setWeekStart(ws);
    api.get(`/meal-plans/week/${ws}`).then(r => setPlans(r.data)).catch(() => {});
  }, [weekOffset]);

  const getPlanFor = (day, mealType) => {
    const dayIndex = DAYS.indexOf(day);
    const d = new Date(weekStart);
    d.setDate(d.getDate() + dayIndex);
    const dateStr = d.toISOString().split('T')[0];
    return plans.find(p => p.date === dateStr && p.meal_type === mealType);
  };

  const getDateFor = (day) => {
    const dayIndex = DAYS.indexOf(day);
    const d = new Date(weekStart);
    d.setDate(d.getDate() + dayIndex);
    return d.toISOString().split('T')[0];
  };

  const openAdd = (day, mealType) => {
    setAddModal({ date: getDateFor(day), mealType });
    setCustomMeal('');
  };

  const saveEntry = async () => {
    if (!customMeal.trim()) return;
    try {
      const { data } = await api.post('/meal-plans/', { date: addModal.date, meal_type: addModal.mealType, custom_meal: customMeal });
      setPlans(p => [...p.filter(x => !(x.date === addModal.date && x.meal_type === addModal.mealType)), data]);
      setAddModal(null);
      toast.success('Meal added!');
    } catch { toast.error('Failed to save'); }
  };

  const deleteEntry = async (planId) => {
    await api.delete(`/meal-plans/${planId}`);
    setPlans(p => p.filter(x => x.id !== planId));
    toast.success('Removed');
  };

  const generateAIPlan = async () => {
    setAiLoading(true);
    try {
      const { data } = await api.post('/ai/meal-plan-ai', { plan_type: 'weekly', calories_target: 2000, budget: 'medium' });
      setAiPlan(data);
      toast.success('AI meal plan generated! 🤖');
    } catch { toast.error('Failed to generate AI plan'); }
    finally { setAiLoading(false); }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
        <h1 className="section-title" style={{ fontSize: '1.8rem', margin: 0 }}>📅 Meal Planner</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setWeekOffset(o => o - 1)} className="btn-secondary" style={{ padding: '8px 16px' }}>← Prev</button>
          <button onClick={() => setWeekOffset(0)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>This Week</button>
          <button onClick={() => setWeekOffset(o => o + 1)} className="btn-secondary" style={{ padding: '8px 16px' }}>Next →</button>
        </div>
      </div>

      {/* AI Generate button */}
      <div className="glass" style={{ padding: 20, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>🤖 Generate AI Meal Plan</p>
          <p style={{ fontSize: 13, color: '#64748b' }}>Let AI create a balanced weekly meal plan for you</p>
        </div>
        <button className="btn-primary" onClick={generateAIPlan} disabled={aiLoading} style={{ padding: '10px 24px' }}>
          {aiLoading ? 'Generating...' : '✨ Generate Plan'}
        </button>
      </div>

      {/* AI Plan result */}
      {aiPlan && (
        <div className="glass" style={{ padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 16, color: '#f1f5f9' }}>
            🤖 AI Suggested Plan <span style={{ fontSize: 13, color: '#64748b', fontWeight: 400 }}>({aiPlan.daily_calories} cal/day)</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(aiPlan.plan || {}).map(([day, meals]) => (
              <div key={day} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontWeight: 600, color: '#10b981', marginBottom: 8 }}>{day}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 8 }}>
                  {Object.entries(meals).map(([type, val]) => (
                    <div key={type} style={{ fontSize: 12 }}>
                      <span style={{ color: '#64748b' }}>{MEAL_ICONS[type]} {type}: </span>
                      <span style={{ color: '#e2e8f0' }}>{val.meal}</span>
                      <span style={{ color: '#f59e0b', marginLeft: 4 }}>({val.calories} cal)</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Calendar Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 14 }}>
        {DAYS.map(day => (
          <div key={day} className="glass" style={{ padding: 16 }}>
            <h4 style={{ fontWeight: 700, fontSize: 14, color: '#10b981', marginBottom: 12 }}>{day}</h4>
            {MEAL_TYPES.map(type => {
              const plan = getPlanFor(day, type);
              return (
                <div key={type} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                    {MEAL_ICONS[type]} {type}
                  </div>
                  {plan ? (
                    <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#e2e8f0', position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ flex: 1 }}>{plan.custom_meal || plan.recipe?.name || 'Meal'}</span>
                      <button onClick={() => deleteEntry(plan.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12, padding: 0, marginLeft: 4 }}>✕</button>
                    </div>
                  ) : (
                    <button onClick={() => openAdd(day, type)} style={{
                      width: '100%', padding: '6px 8px', background: 'rgba(255,255,255,0.02)',
                      border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 8, color: '#475569',
                      cursor: 'pointer', fontSize: 12, transition: 'all 0.2s'
                    }} onMouseEnter={e => { e.target.style.borderColor='rgba(16,185,129,0.4)'; e.target.style.color='#10b981'; }}
                       onMouseLeave={e => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.color='#475569'; }}>
                      + Add
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {addModal && (
        <div className="modal-overlay" onClick={() => setAddModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 6 }}>Add Meal</h3>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
              {MEAL_ICONS[addModal.mealType]} {addModal.mealType} on {addModal.date}
            </p>
            <input className="input-field" placeholder="Enter meal name..." value={customMeal}
              onChange={e => setCustomMeal(e.target.value)} onKeyDown={e => e.key==='Enter' && saveEntry()} autoFocus style={{ marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-primary" onClick={saveEntry} style={{ flex: 1 }}>Save</button>
              <button className="btn-secondary" onClick={() => setAddModal(null)} style={{ flex: 1 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
