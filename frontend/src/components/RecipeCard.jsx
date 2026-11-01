import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getRecipeImage } from '../utils/recipeImages';
import { sound } from '../utils/soundEffects';

export default function RecipeCard({ recipe, compact = false, index = 0 }) {
  const nav = useNavigate();
  const { t } = useLanguage();
  const totalTime = (recipe.preparation_time || 0) + (recipe.cooking_time || 0);
  const diff = recipe.difficulty || 'Medium';
  const diffColor = { Easy: '#10b981', Medium: '#f59e0b', Hard: '#ef4444' }[diff] || '#94a3b8';
  const imageUrl = getRecipeImage(recipe);

  const difficultyMap = {
    'Easy': t('easy') || 'Easy',
    'Medium': t('medium') || 'Medium',
    'Hard': t('hard') || 'Hard'
  };

  const handleClick = () => {
    sound.playClick();
    nav(`/recipe/${recipe.id}`);
  };

  return (
    <div 
      className={`recipe-card hover-lift animate-fadeUp stagger-${(index % 5) + 1}`} 
      onClick={handleClick}
      style={{ 
        padding: 0,
        borderRadius: 18,
        overflow: 'hidden',
        background: 'rgba(15,22,36,0.85)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s ease, border-color 0.3s ease',
        animationDelay: `${index * 0.08}s`
      }}>
      
      {/* Recipe Visual Header */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: compact ? 120 : 180,
        overflow: 'hidden',
        background: '#0d1522'
      }}>
        <img
          src={imageUrl}
          alt={recipe.name}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s ease',
            filter: 'brightness(0.85)'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        />

        {/* Gradient shadow for text readability */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(15,22,36,0.95) 100%)'
        }} />

        {/* Top Floating Badges */}
        <div style={{
          position: 'absolute',
          top: 12,
          left: 12,
          right: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 2
        }}>
          {recipe.cuisine ? (
            <span style={{
              background: 'rgba(15,22,36,0.75)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 20,
              padding: '3px 10px',
              fontSize: 11,
              fontWeight: 600,
              color: '#cbd5e1'
            }}>
              {recipe.cuisine}
            </span>
          ) : <span />}

          {recipe.is_ai_generated && (
            <span style={{
              background: 'rgba(16,185,129,0.25)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(16,185,129,0.5)',
              borderRadius: 20,
              padding: '3px 10px',
              fontSize: 11,
              fontWeight: 700,
              color: '#34d399'
            }}>
              🤖 AI Chef
            </span>
          )}
        </div>

        {/* Bottom Time / Difficulty Overlay on Image */}
        <div style={{
          position: 'absolute',
          bottom: 10,
          left: 12,
          right: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 2
        }}>
          {totalTime > 0 && (
            <span style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'rgba(0,0,0,0.6)',
              padding: '2px 8px',
              borderRadius: 12,
              backdropFilter: 'blur(4px)'
            }}>
              ⏱️ {totalTime} min
            </span>
          )}
          <span style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: diffColor,
            background: 'rgba(0,0,0,0.6)',
            padding: '2px 8px',
            borderRadius: 12,
            backdropFilter: 'blur(4px)'
          }}>
            ● {difficultyMap[diff] || diff}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ padding: compact ? '12px 14px' : '16px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{
          fontFamily: 'Playfair Display',
          fontSize: compact ? '1rem' : '1.15rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 6,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: 1.35
        }}>
          {recipe.name}
        </h3>

        {!compact && recipe.description && (
          <p style={{
            fontSize: 12.5,
            color: 'var(--text-muted)',
            marginBottom: 12,
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            flex: 1
          }}>
            {recipe.description}
          </p>
        )}

        {/* Quick Nutrition Snippet */}
        {recipe.nutrition && (
          <div style={{
            display: 'flex',
            gap: 12,
            paddingTop: 10,
            marginTop: 'auto',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            fontSize: 11.5
          }}>
            <span style={{ color: '#f87171', fontWeight: 600 }}>
              🔥 {Math.round(recipe.nutrition.calories)} kcal
            </span>
            <span style={{ color: '#10b981', fontWeight: 600 }}>
              💪 {Math.round(recipe.nutrition.protein)}g protein
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
