import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useLocationContext } from '../context/LocationContext';

export default function LocationMealsPage() {
  const navigate = useNavigate();
  const { location, flagEmoji, updateLocation, detectLocation, isDetecting } = useLocationContext();
  const [loading, setLoading] = useState(false);
  const [manualLocation, setManualLocation] = useState({ country: location.country || '', city: location.city || '' });
  const [mealTime, setMealTime] = useState('dinner');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (location.country) {
      setManualLocation({ country: location.country, city: location.city || '' });
      fetchLocationMeals(location.country, location.city, mealTime);
    }
  }, [location, mealTime]);

  const getFlag = (countryName) => {
    if (!countryName) return '📍';
    const c = countryName.toLowerCase();
    if (c.includes('india')) return '🇮🇳';
    if (c.includes('italy') || c.includes('italian')) return '🇮🇹';
    if (c.includes('mexico')) return '🇲🇽';
    if (c.includes('japan')) return '🇯🇵';
    if (c.includes('united states') || c.includes('usa') || c.includes('america')) return '🇺🇸';
    if (c.includes('france')) return '🇫🇷';
    if (c.includes('spain')) return '🇪🇸';
    if (c.includes('thailand')) return '🇹🇭';
    if (c.includes('china')) return '🇨🇳';
    if (c.includes('united kingdom') || c.includes('uk')) return '🇬🇧';
    return '🌎';
  };

  const handleReDetect = () => {
    detectLocation(true);
  };

  const fetchLocationMeals = async (country, city, mTime) => {
    setLoading(true);
    try {
      const res = await api.post('/ai/location-meals', {
        country: country || 'India',
        city: city || '',
        meal_time: mTime,
        dietary_preference: 'none'
      });
      setSuggestions(res.data.suggestions || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch location meal suggestions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    detectLocation();
  }, []);

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!manualLocation.country.trim()) {
      toast.error('Please enter a country name');
      return;
    }
    setLocation({ country: manualLocation.country, city: manualLocation.city });
    setFlagEmoji(getFlag(manualLocation.country));
    fetchLocationMeals(manualLocation.country, manualLocation.city, mealTime);
  };

  const handleMealTimeChange = (newTime) => {
    setMealTime(newTime);
    fetchLocationMeals(location.country, location.city, newTime);
  };

  const handleCookDish = async (dishName) => {
    toast.loading(`Generating AI recipe for ${dishName}...`, { id: 'gen-recipe' });
    try {
      const res = await api.post('/recipes/generate', { dish_name: dishName, servings: 2 });
      toast.success(`Recipe for ${dishName} created!`, { id: 'gen-recipe' });
      navigate(`/recipe/${res.data.id}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate recipe', { id: 'gen-recipe' });
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px' }}>
      {/* Header Banner */}
      <div className="animate-fadeIn" style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(6,182,212,0.15) 100%)',
        border: '1px solid rgba(16,185,129,0.3)',
        borderRadius: 24,
        padding: '36px 30px',
        marginBottom: 32,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 36 }}>{flagEmoji}</span>
              <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 800 }} className="gradient-text">
                Local & Regional Culinary Specialties
              </h1>
            </div>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: 650 }}>
              Discover regional dishes tailored to your location context: 
              <strong style={{ color: '#10b981', marginLeft: 6 }}>
                {location.city ? `${location.city}, ` : ''}{location.country || 'Detecting...'}
              </strong>
            </p>
          </div>

          <button
            onClick={handleReDetect}
            disabled={isDetecting}
            className="hover-scale"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              border: 'none',
              borderRadius: 14,
              padding: '12px 20px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(16,185,129,0.3)'
            }}
          >
            {isDetecting ? '📍 Detecting...' : '🔄 Re-detect Location'}
          </button>
        </div>
      </div>

      {/* Control Bar: Location Override & Meal Time Filters */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 20,
        marginBottom: 32
      }}>
        {/* Manual Location Input Form */}
        <form onSubmit={handleManualSearch} style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🗺️</span> Override Location
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Country (e.g. Italy)"
              value={manualLocation.country}
              onChange={(e) => setManualLocation({ ...manualLocation, country: e.target.value })}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-main)',
                color: 'var(--text-main)',
                fontSize: 14
              }}
            />
            <input
              type="text"
              placeholder="City (Optional)"
              value={manualLocation.city}
              onChange={(e) => setManualLocation({ ...manualLocation, city: e.target.value })}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-main)',
                color: 'var(--text-main)',
                fontSize: 14
              }}
            />
            <button
              type="submit"
              className="hover-scale"
              style={{
                background: 'rgba(16,185,129,0.15)',
                border: '1px solid rgba(16,185,129,0.4)',
                color: '#10b981',
                borderRadius: 10,
                padding: '0 16px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Search
            </button>
          </div>
        </form>

        {/* Meal Time Selector */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 12
        }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>⏰</span> Select Meal Time
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { id: 'breakfast', label: '🌅 Breakfast' },
              { id: 'lunch', label: '☀️ Lunch' },
              { id: 'dinner', label: '🌙 Dinner' },
              { id: 'any', label: '🍽️ Any Time' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => handleMealTimeChange(t.id)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: mealTime === t.id ? '1px solid #10b981' : '1px solid var(--border)',
                  background: mealTime === t.id ? 'rgba(16,185,129,0.2)' : 'transparent',
                  color: mealTime === t.id ? '#10b981' : 'var(--text-muted)',
                  transition: 'all 0.2s'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dish Grid Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="animate-float" style={{ fontSize: 48, marginBottom: 16 }}>🍳</div>
          <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>Scanning culinary recommendations for {location.country}...</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
          gap: 24
        }}>
          {suggestions.map((dish, i) => (
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
                boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
                position: 'relative',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
            >
              <div>
                {/* Header Tag */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{
                    background: 'rgba(16,185,129,0.12)',
                    color: '#10b981',
                    border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: 20,
                    padding: '4px 12px',
                    fontSize: 12,
                    fontWeight: 600
                  }}>
                    {dish.cuisine || 'Regional'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    ⏱️ {dish.prep_time || 25} min
                  </span>
                </div>

                {/* Title & Description */}
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {dish.name}
                </h3>
                <p style={{ margin: '0 0 16px 0', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {dish.description}
                </p>
              </div>

              <div>
                {/* Reason Banner */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 12,
                  padding: '10px 12px',
                  marginBottom: 16,
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  borderLeft: '3px solid #10b981'
                }}>
                  💡 {dish.reason}
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleCookDish(dish.name)}
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
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 4px 12px rgba(16,185,129,0.25)'
                  }}
                >
                  ⚡ Cook Now with AI
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
