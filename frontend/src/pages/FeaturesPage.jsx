import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';

function FeatureCard({ feature, index }) {
  const { t } = useLanguage();
  
  return (
    <Link 
      to={feature.link}
      className={`glass hover-lift hover-glow animate-fadeIn stagger-${index + 1}`}
      style={{ 
        textDecoration: 'none',
        padding: '32px 24px', 
        textAlign: 'center',
        borderRadius: 16,
        transition: 'all 0.3s ease',
        display: 'block',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)';
        e.currentTarget.style.transform = 'translateY(-8px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.transform = 'translateY(0px)';
      }}
    >
      <div className="animate-float" style={{ 
        fontSize: 48, 
        marginBottom: 20,
        animationDelay: `${index * 0.2}s`
      }}>
        {feature.icon}
      </div>
      <h3 className="animate-slideInLeft" style={{ 
        fontSize: '1.3rem', 
        fontWeight: 700, 
        color: 'var(--text-primary)', 
        marginBottom: 12 
      }}>
        {feature.title}
      </h3>
      <p className="animate-slideInRight" style={{ 
        color: 'var(--text-muted)', 
        lineHeight: 1.6, 
        fontSize: '0.95rem',
        marginBottom: 20
      }}>
        {feature.description}
      </p>
      <div className="animate-bounceIn" style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 20px',
        background: 'rgba(16,185,129,0.1)',
        borderRadius: 25,
        color: '#10b981',
        fontSize: 14,
        fontWeight: 600,
        border: '1px solid rgba(16,185,129,0.3)'
      }}>
        {feature.buttonText} →
      </div>
    </Link>
  );
}

export default function FeaturesPage() {
  const { t } = useLanguage();
  
  const features = [
    {
      icon: '🤖',
      title: 'AI Recipe Generator',
      description: 'Get personalized recipes based on your preferences, dietary restrictions, and available ingredients.',
      buttonText: 'Try AI Recipes',
      link: '/'
    },
    {
      icon: '❤️',
      title: t('favorites'),
      description: 'Save and organize your favorite recipes. Create custom collections and easily access them anytime.',
      buttonText: `View ${t('favorites')}`,
      link: '/favorites'
    },
    {
      icon: '🧊',
      title: t('fridgeMode'),
      description: 'Tell us what\'s in your fridge, and we\'ll suggest delicious recipes you can make right now.',
      buttonText: `Open ${t('fridgeMode')}`,
      link: '/fridge-mode'
    },
    {
      icon: '📅',
      title: t('mealPlan'),
      description: 'Plan your meals for the week. Get nutrition insights and automatically generate grocery lists.',
      buttonText: `Plan ${t('mealPlan')}`,
      link: '/meal-planner'
    },
    {
      icon: '🛒',
      title: t('grocery'),
      description: 'Smart grocery lists based on your meal plans. Never forget an ingredient again.',
      buttonText: `View ${t('grocery')}`,
      link: '/grocery'
    },
    {
      icon: '💬',
      title: t('reviews'),
      description: 'Share your cooking experiences and read feedback from other food enthusiasts.',
      buttonText: `Read ${t('reviews')}`,
      link: '/reviews'
    },
    {
      icon: '👤',
      title: t('profile'),
      description: 'Customize your dietary preferences, manage allergies, and track your cooking journey.',
      buttonText: `Edit ${t('profile')}`,
      link: '/profile'
    },
    {
      icon: '🌍',
      title: 'Multi-Language',
      description: 'Available in multiple languages including English, Hindi, Spanish, and French.',
      buttonText: 'Change Language',
      link: '#'
    }
  ];

  return (
    <div className="page-container">
      {/* Hero Section */}
      <div className="animate-fadeUp" style={{ textAlign: 'center', marginBottom: 50 }}>
        <h1 className="gradient-text animate-bounceIn" style={{ 
          fontFamily: 'Playfair Display', 
          fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', 
          fontWeight: 700, 
          marginBottom: 16 
        }}>
          🚀 ChefAI Features
        </h1>
        <p className="animate-slideInUp" style={{ 
          color: 'var(--text-muted)', 
          fontSize: '1.2rem', 
          maxWidth: 600, 
          margin: '0 auto',
          lineHeight: 1.6
        }}>
          Discover all the powerful features that make ChefAI your perfect cooking companion
        </p>
      </div>

      {/* Features Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: 24,
        marginBottom: 40
      }}>
        {features.map((feature, index) => (
          <FeatureCard key={feature.title} feature={feature} index={index} />
        ))}
      </div>

      {/* Call to Action */}
      <div className="glass animate-pulse-glow" style={{ 
        textAlign: 'center', 
        padding: '40px 32px',
        background: 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(5,150,105,0.05))',
        border: '1px solid rgba(16,185,129,0.2)'
      }}>
        <h2 className="animate-fadeIn" style={{ 
          fontSize: '1.8rem', 
          fontWeight: 700, 
          color: 'var(--text-primary)', 
          marginBottom: 16 
        }}>
          Ready to Start Cooking? 👨‍🍳
        </h2>
        <p className="animate-slideInUp" style={{ 
          color: 'var(--text-muted)', 
          fontSize: '1.1rem', 
          marginBottom: 24,
          maxWidth: 500,
          margin: '0 auto 24px'
        }}>
          Join thousands of home cooks who are already using ChefAI to create amazing meals
        </p>
        <Link 
          to="/"
          className="btn-primary hover-lift animate-bounceIn"
          style={{ 
            padding: '16px 32px', 
            fontSize: 16,
            textDecoration: 'none',
            display: 'inline-block'
          }}
        >
          🍳 Start Cooking Now!
        </Link>
      </div>
    </div>
  );
}