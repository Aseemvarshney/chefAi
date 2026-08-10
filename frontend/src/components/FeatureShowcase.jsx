import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import NutritionInfo from './NutritionInfo';

export default function FeatureShowcase() {
  const { theme, toggleTheme } = useTheme();
  const { language, changeLanguage, t } = useLanguage();
  const [showDemo, setShowDemo] = useState(false);

  const sampleNutrition = {
    calories: 350,
    protein: 25,
    carbohydrates: 45,
    fat: 12,
    fiber: 8
  };

  const sampleRecipe = {
    id: 'demo',
    name: 'Enhanced Chicken Stir-Fry',
    description: 'A delicious and nutritious chicken stir-fry with vegetables',
    cuisine: 'Asian Fusion',
    difficulty: 'Medium',
    preparation_time: 15,
    cooking_time: 20,
    servings: 4,
    nutrition: sampleNutrition,
    is_ai_generated: true
  };

  if (!showDemo) {
    return (
      <div className="animate-fadeIn" style={{ 
        position: 'fixed', 
        bottom: 20, 
        right: 20, 
        zIndex: 1000 
      }}>
        <button 
          onClick={() => setShowDemo(true)} 
          className="btn-primary hover-lift animate-pulse-glow"
          style={{ 
            borderRadius: '50%', 
            width: 60, 
            height: 60, 
            fontSize: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0
          }}
          title="View New Features"
        >
          ✨
        </button>
      </div>
    );
  }

  return (
    <div className="modal-overlay animate-fadeIn" onClick={(e) => e.target === e.currentTarget && setShowDemo(false)}>
      <div className="modal-box animate-scaleIn" style={{ maxWidth: 600 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 className="animate-slideInLeft" style={{ 
            fontFamily: 'Playfair Display', 
            fontSize: '1.5rem', 
            fontWeight: 700, 
            color: 'var(--text-primary)',
            margin: 0
          }}>
            ✨ New Features Showcase
          </h2>
          <button 
            onClick={() => setShowDemo(false)}
            className="hover-scale"
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: 16
            }}
          >
            ×
          </button>
        </div>

        {/* Theme Toggle Demo */}
        <div className="animate-slideInLeft stagger-1" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: 8 }}>
            🌓 Dark/Light Theme
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12 }}>
            Switch between dark and light themes with smooth transitions.
          </p>
          <button 
            onClick={toggleTheme} 
            className="btn-secondary hover-lift"
            style={{ fontSize: 14 }}
          >
            {theme === 'dark' ? '☀️ Switch to Light' : '🌙 Switch to Dark'}
          </button>
        </div>

        {/* Language Demo */}
        <div className="animate-slideInLeft stagger-2" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: 8 }}>
            🌍 Multi-Language Support
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12 }}>
            Current language: {language.toUpperCase()} - Interface supports English, Spanish, and French.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {['en', 'es', 'fr'].map(lang => (
              <button 
                key={lang}
                onClick={() => changeLanguage(lang)} 
                className={`btn-secondary hover-scale ${language === lang ? 'active' : ''}`}
                style={{ 
                  fontSize: 12,
                  padding: '6px 12px',
                  background: language === lang ? 'rgba(16,185,129,0.15)' : undefined,
                  borderColor: language === lang ? 'rgba(16,185,129,0.3)' : undefined,
                  color: language === lang ? '#10b981' : undefined
                }}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Enhanced Animations */}
        <div className="animate-slideInLeft stagger-3" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: 8 }}>
            🎭 Enhanced Animations
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12 }}>
            Smooth animations, hover effects, and staggered entrance animations throughout the app.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['fadeUp', 'slideInLeft', 'bounceIn', 'scaleIn', 'wiggle', 'heartbeat'].map((anim, i) => (
              <span 
                key={anim}
                className={`animate-${anim} hover-scale`}
                style={{
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: 16,
                  padding: '4px 10px',
                  fontSize: 11,
                  color: '#10b981',
                  animationDelay: `${i * 0.1}s`,
                  cursor: 'default'
                }}
              >
                {anim}
              </span>
            ))}
          </div>
        </div>

        {/* Enhanced Nutrition */}
        <div className="animate-slideInLeft stagger-4">
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: 8 }}>
            💪 Enhanced Nutrition with Protein Tracking
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12 }}>
            Detailed nutrition information including protein, carbs, fats, fiber, and calories.
          </p>
          <NutritionInfo nutrition={sampleNutrition} animated={true} />
        </div>

        <div className="animate-fadeIn stagger-5" style={{ 
          marginTop: 24, 
          padding: '16px', 
          background: 'rgba(16,185,129,0.05)', 
          borderRadius: 12, 
          border: '1px solid rgba(16,185,129,0.1)' 
        }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
            🎉 All features are now active in your ChefAI application!
          </p>
        </div>
      </div>
    </div>
  );
}