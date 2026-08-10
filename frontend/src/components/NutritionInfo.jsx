import { useLanguage } from '../context/LanguageContext';

export default function NutritionInfo({ nutrition, compact = false, animated = false, index = 0 }) {
  const { t } = useLanguage();
  
  if (!nutrition || (!nutrition.calories && !nutrition.protein && !nutrition.carbohydrates && !nutrition.fat)) {
    return null;
  }

  const nutritionItems = [
    {
      key: 'calories',
      value: nutrition.calories,
      label: t('calories'),
      icon: '🔥',
      color: '#10b981',
      unit: '',
      show: nutrition.calories > 0
    },
    {
      key: 'protein',
      value: nutrition.protein,
      label: t('protein'),
      icon: '💪',
      color: '#3b82f6',
      unit: 'g',
      show: nutrition.protein > 0
    },
    {
      key: 'carbs',
      value: nutrition.carbohydrates,
      label: t('carbs'),
      icon: '🌾',
      color: '#f59e0b',
      unit: 'g',
      show: nutrition.carbohydrates > 0
    },
    {
      key: 'fat',
      value: nutrition.fat,
      label: t('fat'),
      icon: '🥑',
      color: '#ef4444',
      unit: 'g',
      show: nutrition.fat > 0
    },
    {
      key: 'fiber',
      value: nutrition.fiber,
      label: t('fiber'),
      icon: '🌿',
      color: '#8b5cf6',
      unit: 'g',
      show: nutrition.fiber > 0
    }
  ].filter(item => item.show);

  if (nutritionItems.length === 0) return null;

  if (compact) {
    return (
      <div className={animated ? `animate-slideInRight stagger-${index + 1}` : ''} style={{ 
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap'
      }}>
        {nutritionItems.map(item => (
          <span key={item.key} className="hover-scale" style={{ 
            fontSize: 11, 
            color: item.color, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 3,
            cursor: 'default'
          }}>
            {item.icon} {Math.round(item.value)}{item.unit} {item.label}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className={`nutrition-grid ${animated ? `animate-slideInRight stagger-${index + 1}` : ''}`}>
      {nutritionItems.map((item, i) => (
        <div 
          key={item.key} 
          className={`nutrition-item hover-scale ${animated ? `animate-bounceIn stagger-${i + 1}` : ''}`}
          style={{ animationDelay: animated ? `${(index * 0.1) + (i * 0.05)}s` : '0s' }}
        >
          <div className="nutrition-icon">{item.icon}</div>
          <div className="nutrition-value" style={{ color: item.color }}>
            {Math.round(item.value)}{item.unit}
          </div>
          <div className="nutrition-label" style={{ color: 'var(--text-muted)' }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}