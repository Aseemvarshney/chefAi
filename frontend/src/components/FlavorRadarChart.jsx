import { useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

/**
 * Calculates a flavor profile radar based on ingredients and recipe metadata
 */
function evaluateFlavorProfile(recipe) {
  const ingredients = recipe?.ingredients || [];
  const text = `${recipe?.name || ''} ${recipe?.description || ''} ${recipe?.cuisine || ''} ${recipe?.tags || ''} ${ingredients.map(i => i.name).join(' ')}`.toLowerCase();

  // Scoring indicators
  let sweet = 15;
  let savory = 50;
  let spicy = 10;
  let tangy = 15;
  let rich = 30;
  let crisp = 25;

  // Sweet indicators
  if (text.match(/sugar|honey|maple|syrup|caramel|sweet|chocolate|vanilla|fruit|berry|apple|mango|banana/)) sweet += 45;
  if (text.match(/onion|carrot|corn|cinnamon/)) sweet += 15;

  // Savory / Umami indicators
  if (text.match(/soy sauce|parmesan|mushroom|beef|chicken|pork|tomato|garlic|miso|broth|cheese|anchov/)) savory += 40;
  if (text.match(/meat|egg|bacon|sausage|fish|seafood/)) savory += 20;

  // Spicy indicators
  if (text.match(/chili|jalapeno|habanero|sriracha|cayenne|hot sauce|curry|spicy|pepper|wasabi|kimchi|paprika/)) spicy += 55;
  if (text.match(/ginger|black pepper|mustard/)) spicy += 15;

  // Tangy / Acidic indicators
  if (text.match(/lemon|lime|vinegar|pickle|citrus|sour|tomato|yogurt|tamarind|wine/)) tangy += 50;
  if (text.match(/apple cider|mustard|caper/)) tangy += 15;

  // Richness / Fat indicators
  if (text.match(/butter|cream|oil|ghee|cheese|avocado|coconut milk|mayo|ribeye|lard/)) rich += 50;
  if (text.match(/nuts|cashew|peanut|egg yolk/)) rich += 20;

  // Crisp / Freshness indicators
  if (text.match(/lettuce|cucumber|celery|fresh|herb|cilantro|parsley|mint|radish|cabbage|raw|salad/)) crisp += 50;
  if (text.match(/crispy|fried|crunchy|tempura|crust/)) crisp += 25;

  // Clamp 10-95
  const clamp = v => Math.min(95, Math.max(15, Math.round(v)));

  return [
    { subject: 'Sweet', value: clamp(sweet), fullMark: 100 },
    { subject: 'Savory', value: clamp(savory), fullMark: 100 },
    { subject: 'Spicy', value: clamp(spicy), fullMark: 100 },
    { subject: 'Tangy', value: clamp(tangy), fullMark: 100 },
    { subject: 'Rich', value: clamp(rich), fullMark: 100 },
    { subject: 'Crisp', value: clamp(crisp), fullMark: 100 },
  ];
}

export default function FlavorRadarChart({ recipe }) {
  const data = useMemo(() => evaluateFlavorProfile(recipe), [recipe]);

  // Find dominant flavors
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const primary = sorted[0];
  const secondary = sorted[1];

  // Beverage pairing suggestion
  let beverage = 'Chilled Sparkling Water with Lemon';
  if (primary.subject === 'Spicy') beverage = 'Crisp Lager or Mango Lassi';
  else if (primary.subject === 'Savory' || primary.subject === 'Rich') beverage = 'Full-Bodied Red Wine or Iced Oolong Tea';
  else if (primary.subject === 'Sweet') beverage = 'Espresso or Cold Brew';
  else if (primary.subject === 'Tangy' || primary.subject === 'Crisp') beverage = 'Dry Sauvignon Blanc or Mint Lime Spritz';

  return (
    <div className="glass" style={{
      padding: '22px 24px',
      borderRadius: 18,
      border: '1px solid rgba(255,255,255,0.08)',
      background: 'linear-gradient(145deg, rgba(15,22,36,0.85) 0%, rgba(20,30,48,0.7) 100%)',
      boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background radial accent */}
      <div style={{
        position: 'absolute',
        top: -40,
        right: -40,
        width: 140,
        height: 140,
        background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🧬</span>
            <h3 style={{
              fontFamily: 'Playfair Display',
              fontSize: '1.15rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0
            }}>
              Flavor Fingerprint
            </h3>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            AI multi-dimensional taste profile & balance
          </p>
        </div>

        {/* Dominant badge */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(59,130,246,0.2) 100%)',
          border: '1px solid rgba(16,185,129,0.4)',
          borderRadius: 20,
          padding: '4px 12px',
          fontSize: 12,
          fontWeight: 600,
          color: '#34d399',
          display: 'flex',
          alignItems: 'center',
          gap: 5
        }}>
          <span>✨</span>
          <span>{primary.subject} & {secondary.subject} Forward</span>
        </div>
      </div>

      {/* Radar Chart */}
      <div style={{ width: '100%', height: 230, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#94a3b8', fontSize: 11.5, fontWeight: 500 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={false}
              axisLine={false}
            />
            <Radar
              name="Taste Score"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#radarGradient)"
              fillOpacity={0.55}
            />
            <defs>
              <linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3} />
              </linearGradient>
            </defs>
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Flavor breakdown metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
        marginTop: 6,
        paddingTop: 12,
        borderTop: '1px solid rgba(255,255,255,0.06)'
      }}>
        {data.map(item => (
          <div key={item.subject} style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 10,
            padding: '6px 10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: 11.5, color: '#94a3b8' }}>{item.subject}</span>
            <span style={{
              fontSize: 12,
              fontWeight: 700,
              color: item.value > 65 ? '#10b981' : item.value > 40 ? '#f59e0b' : '#64748b'
            }}>
              {item.value}%
            </span>
          </div>
        ))}
      </div>

      {/* Sommelier / Beverage Pairing Recommendation */}
      <div style={{
        marginTop: 12,
        background: 'rgba(245,158,11,0.08)',
        border: '1px solid rgba(245,158,11,0.2)',
        borderRadius: 12,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }}>
        <span style={{ fontSize: 18 }}>🍷</span>
        <div style={{ fontSize: 12.5, lineHeight: 1.4 }}>
          <strong style={{ color: '#fbbf24' }}>Sommelier Pairing: </strong>
          <span style={{ color: 'var(--text-primary)' }}>{beverage}</span>
        </div>
      </div>
    </div>
  );
}
