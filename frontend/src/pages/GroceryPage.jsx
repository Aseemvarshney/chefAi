import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function GroceryPage() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newListName, setNewListName] = useState('');
  const [newItem, setNewItem] = useState({ listId: null, name: '', qty: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => { api.get('/grocery/').then(r => setLists(r.data)).finally(() => setLoading(false)); }, []);

  const createList = async () => {
    if (!newListName.trim()) return;
    setCreating(true);
    try {
      const { data } = await api.post('/grocery/', { name: newListName, items: [] });
      setLists(p => [data, ...p]);
      setNewListName('');
      toast.success('Shopping list created!');
    } catch { toast.error('Failed to create list'); }
    finally { setCreating(false); }
  };

  const deleteList = async (id) => {
    await api.delete(`/grocery/${id}`);
    setLists(p => p.filter(l => l.id !== id));
    toast.success('List deleted');
  };

  const addItem = async (listId) => {
    if (!newItem.name.trim()) return;
    try {
      const { data } = await api.post(`/grocery/${listId}/items`, { ingredient_name: newItem.name, quantity: newItem.qty });
      setLists(p => p.map(l => l.id === listId ? { ...l, items: [...l.items, data] } : l));
      setNewItem({ listId: null, name: '', qty: '' });
    } catch { toast.error('Failed to add item'); }
  };

  const toggleItem = async (listId, itemId, checked) => {
    const { data } = await api.patch(`/grocery/${listId}/items/${itemId}`, { is_checked: checked });
    setLists(p => p.map(l => l.id === listId ? { ...l, items: l.items.map(i => i.id === itemId ? data : i) } : l));
  };

  const deleteItem = async (listId, itemId) => {
    await api.delete(`/grocery/${listId}/items/${itemId}`);
    setLists(p => p.map(l => l.id === listId ? { ...l, items: l.items.filter(i => i.id !== itemId) } : l));
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>;

  return (
    <div className="page-container">
      <h1 className="section-title" style={{ fontSize: '1.8rem', marginBottom: 24 }}>🛒 Grocery Lists</h1>

      {/* Create new list */}
      <div className="glass" style={{ padding: 24, marginBottom: 28 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 14, color: '#94a3b8' }}>Create New List</h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <input className="input-field" placeholder="e.g. Weekly Shopping, Biryani Ingredients..." value={newListName}
            onChange={e => setNewListName(e.target.value)} onKeyDown={e => e.key==='Enter' && createList()} />
          <button className="btn-primary" onClick={createList} disabled={creating} style={{ whiteSpace: 'nowrap', padding: '12px 24px' }}>
            {creating ? '...' : '+ Create'}
          </button>
        </div>
      </div>

      {lists.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
          <p>No grocery lists yet. Create one or generate from a recipe!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {lists.map(list => {
            const checked = list.items.filter(i => i.is_checked).length;
            const pct = list.items.length > 0 ? Math.round(checked / list.items.length * 100) : 0;
            return (
              <div key={list.id} className="glass" style={{ padding: 24 }}>
                {/* List header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f1f5f9' }}>{list.name}</h3>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{checked}/{list.items.length} items • {pct}% complete</span>
                  </div>
                  <button onClick={() => deleteList(list.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '6px 14px', color: '#f87171', cursor: 'pointer', fontSize: 13 }}>Delete</button>
                </div>

                {/* Progress bar */}
                {list.items.length > 0 && (
                  <div className="nutrition-bar" style={{ marginBottom: 16 }}>
                    <div className="nutrition-fill" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#10b981,#059669)' }} />
                  </div>
                )}

                {/* Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {list.items.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                      background: item.is_checked ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
                      borderRadius: 10, border: `1px solid ${item.is_checked ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`,
                      transition: 'all 0.2s' }}>
                      <input type="checkbox" checked={item.is_checked} onChange={e => toggleItem(list.id, item.id, e.target.checked)}
                        style={{ width: 18, height: 18, accentColor: '#10b981', cursor: 'pointer' }} />
                      <span style={{ flex: 1, color: item.is_checked ? '#64748b' : '#e2e8f0', textDecoration: item.is_checked ? 'line-through' : 'none', transition: 'all 0.2s' }}>
                        {item.ingredient_name}
                      </span>
                      {item.quantity && <span style={{ fontSize: 13, color: '#10b981', fontWeight: 600 }}>{item.quantity}</span>}
                      <button onClick={() => deleteItem(list.id, item.id)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>✕</button>
                    </div>
                  ))}
                </div>

                {/* Add item */}
                {newItem.listId === list.id ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="input-field" placeholder="Item name" style={{ flex: 2 }} value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} autoFocus />
                    <input className="input-field" placeholder="Qty" style={{ flex: 1 }} value={newItem.qty} onChange={e => setNewItem(p => ({ ...p, qty: e.target.value }))} />
                    <button className="btn-primary" onClick={() => addItem(list.id)} style={{ padding: '10px 18px' }}>Add</button>
                    <button className="btn-secondary" onClick={() => setNewItem({ listId: null, name: '', qty: '' })} style={{ padding: '10px 14px' }}>✕</button>
                  </div>
                ) : (
                  <button onClick={() => setNewItem({ listId: list.id, name: '', qty: '' })} className="btn-secondary" style={{ fontSize: 14, padding: '10px 18px' }}>
                    + Add Item
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
