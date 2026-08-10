import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import NutritionInfo from './NutritionInfo';

export default function RecipeCard({ recipe, compact = false, index = 0 }) {
  const nav = useNavigate();
  const { t } = useLanguage();
  const totalTime = (recipe.preparation_time || 0) + (recipe.cooking_time || 0);
  const diff = recipe.difficulty || 'Medium';
  const diffColor = { Easy: '#10b981', Medium: '#f59e0b', Hard: '#ef4444' }[diff] || '#94a3b8';

  const difficultyMap = {
    'Easy': t('easy'),
    'Medium': t('medium'),
    'Hard': t('hard')
  };

  return (
    <div 
      className={`recipe-card hover-lift animate-fadeUp stagger-${(index % 5) + 1}`} 
      onClick={() => nav(`/recipe/${recipe.id}`)}
      style={{ 
        padding: compact ? 16 : 20,
        animationDelay: `${index * 0.1}s`
      }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <h3 className="animate-slideInLeft" style={{
            fontFamily: 'Playfair Display', fontSize: compact ? '1rem' : '1.1rem',
            fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
          }}>{recipe.name}</h3>
          {recipe.cuisine && <span className="animate-slideInLeft stagger-1" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{recipe.cuisine}</span>}
        </div>
        {recipe.is_ai_generated && (
          <span className="animate-bounceIn hover-wiggle" style={{ fontSize: 10, background: 'rgba(16,185,129,0.15)', color: '#10b981',
            border: '1px solid rgba(16,185,129,0.3)', borderRadius: 6, padding: '2px 7px', marginLeft: 8, whiteSpace: 'nowrap', cursor: 'pointer' }}>
            🤖 AI
          </span>
        )}
      </div>

      {/* Description */}
      {!compact && recipe.description && (
        <p className="animate-fadeIn stagger-2" style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {recipe.description}
        </p>
      )}

      {/* Enhanced Nutrition Info */}
      {recipe.nutrition && <NutritionInfo nutrition={recipe.nutrition} compact={compact} animated={true} index={index} />}

      {/* Stats */}
      <div className="animate-slideInLeft stagger-4" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {totalTime > 0 && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            ⏱️ {totalTime} min
          </span>
        )}
        {recipe.servings && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            🍽️ {recipe.servings} servings
          </span>
        )}
        <span className="hover-scale" style={{ fontSize: 12, color: diffColor, display: 'flex', alignItems: 'center', gap: 4, cursor: 'default' }}>
          ● {difficultyMap[diff] || diff}
        </span>
      </div>
    </div>
  );
}
