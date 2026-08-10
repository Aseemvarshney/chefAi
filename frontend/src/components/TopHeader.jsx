import { useState } from 'react';
import { useLocationContext } from '../context/LocationContext';
import toast from 'react-hot-toast';

export default function TopHeader() {
  const { location, flagEmoji, updateLocation, detectLocation, isDetecting } = useLocationContext();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [tempCity, setTempCity] = useState(location.city || '');
  const [tempCountry, setTempCountry] = useState(location.country || '');

  const handleSave = (e) => {
    e.preventDefault();
    if (!tempCountry.trim()) {
      toast.error('Country name is required');
      return;
    }
    updateLocation({ country: tempCountry.trim(), city: tempCity.trim() });
    setPopoverOpen(false);
    toast.success(`Region updated to ${tempCity ? tempCity + ', ' : ''}${tempCountry}`);
  };

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: '16px 28px 0 28px',
      position: 'relative',
      zIndex: 80
    }}>
      {/* Top Right Region Badge */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => {
            setTempCity(location.city || '');
            setTempCountry(location.country || '');
            setPopoverOpen(!popoverOpen);
          }}
          className="hover-scale"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(6,182,212,0.12) 100%)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 20,
            padding: '8px 16px',
            color: 'var(--text-main)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13.5,
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            backdropFilter: 'blur(8px)'
          }}
        >
          <span style={{ fontSize: 16 }}>📍</span>
          <span>{location.city ? `${location.city}, ` : ''}{location.country}</span>
          <span style={{ fontSize: 16 }}>{flagEmoji}</span>
          <span style={{ fontSize: 10, opacity: 0.7 }}>▼</span>
        </button>

        {/* Region Selector Popover */}
        {popoverOpen && (
          <div className="animate-scaleIn" style={{
            position: 'absolute',
            top: '120%',
            right: 0,
            width: 300,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 18,
            padding: 20,
            boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
            zIndex: 300
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>
                📍 Your Location / Region
              </h4>
              <button
                onClick={() => setPopoverOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                  City / Town
                </label>
                <input
                  type="text"
                  placeholder="e.g. Greater Noida"
                  value={tempCity}
                  onChange={(e) => setTempCity(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: 13
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Country
                </label>
                <input
                  type="text"
                  placeholder="e.g. India"
                  value={tempCountry}
                  onChange={(e) => setTempCountry(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: 13
                  }}
                />
              </div>

              <button
                type="submit"
                className="hover-scale"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  padding: '9px',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  marginTop: 4
                }}
              >
                Save Region
              </button>
            </form>

            <button
              onClick={() => {
                detectLocation(true);
                setPopoverOpen(false);
              }}
              disabled={isDetecting}
              style={{
                width: '100%',
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.3)',
                color: '#10b981',
                borderRadius: 10,
                padding: '9px',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              🔄 {isDetecting ? 'Detecting GPS...' : 'Auto-Detect via GPS'}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
