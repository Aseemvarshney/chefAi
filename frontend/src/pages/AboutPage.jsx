import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';

function StatCard({ icon, number, label, description }) {
  return (
    <div className="glass hover-lift animate-fadeIn" style={{ 
      padding: '28px 24px', 
      textAlign: 'center',
      borderRadius: 16 
    }}>
      <div className="animate-float" style={{ fontSize: 40, marginBottom: 16 }}>
        {icon}
      </div>
      <div className="animate-slideInUp" style={{ 
        fontSize: '2.2rem', 
        fontWeight: 700, 
        color: '#10b981',
        marginBottom: 8 
      }}>
        {number}
      </div>
      <div className="animate-slideInUp" style={{ 
        fontSize: 16, 
        fontWeight: 600, 
        color: 'var(--text-primary)',
        marginBottom: 8
      }}>
        {label}
      </div>
      <div className="animate-slideInUp" style={{ 
        fontSize: 13, 
        color: 'var(--text-muted)' 
      }}>
        {description}
      </div>
    </div>
  );
}

function TeamMember({ name, role, avatar, description }) {
  return (
    <div className="glass hover-lift animate-fadeIn" style={{ 
      padding: '32px 24px', 
      textAlign: 'center',
      borderRadius: 16 
    }}>
      <div className="animate-bounceIn" style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #10b981, #059669)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2rem',
        color: 'white',
        fontWeight: 700,
        margin: '0 auto 20px'
      }}>
        {avatar}
      </div>
      <h3 className="animate-slideInLeft" style={{ 
        fontSize: '1.2rem', 
        fontWeight: 700, 
        color: 'var(--text-primary)', 
        marginBottom: 8 
      }}>
        {name}
      </h3>
      <div className="animate-slideInRight" style={{ 
        color: '#10b981', 
        fontSize: 14, 
        fontWeight: 600,
        marginBottom: 12 
      }}>
        {role}
      </div>
      <p className="animate-fadeIn" style={{ 
        color: 'var(--text-muted)', 
        fontSize: 14,
        lineHeight: 1.6 
      }}>
        {description}
      </p>
    </div>
  );
}

export default function AboutPage() {
  const { t } = useLanguage();
  
  const stats = [
    {
      icon: '👨‍🍳',
      number: '10K+',
      label: 'Active Users',
      description: 'Home cooks worldwide'
    },
    {
      icon: '🍽️',
      number: '50K+',
      label: 'Recipes Generated',
      description: 'AI-powered creations'
    },
    {
      icon: '🌍',
      number: '4',
      label: 'Languages',
      description: 'Global accessibility'
    },
    {
      icon: '⭐',
      number: '4.8',
      label: 'User Rating',
      description: 'App store average'
    }
  ];

  const team = [
    {
      name: 'Alex Chen',
      role: 'Lead Developer',
      avatar: '👨‍💻',
      description: 'Full-stack developer with passion for AI and culinary arts. Created the core recipe generation engine.'
    },
    {
      name: 'Priya Sharma',
      role: 'AI Specialist',
      avatar: '🧠',
      description: 'Machine learning expert who developed the intelligent recommendation system and dietary preference algorithms.'
    },
    {
      name: 'Marco Rodriguez',
      role: 'UX Designer',
      avatar: '🎨',
      description: 'User experience designer focused on making cooking accessible and enjoyable for everyone.'
    },
    {
      name: 'Sarah Johnson',
      role: 'Nutritionist',
      avatar: '🥗',
      description: 'Certified nutritionist ensuring all recipe suggestions meet health and dietary requirements.'
    }
  ];

  return (
    <div className="page-container">
      {/* Hero Section */}
      <div className="animate-fadeUp" style={{ textAlign: 'center', marginBottom: 60 }}>
        <h1 className="gradient-text animate-bounceIn" style={{ 
          fontFamily: 'Playfair Display', 
          fontSize: 'clamp(2.5rem, 5vw, 4rem)', 
          fontWeight: 700, 
          marginBottom: 20 
        }}>
          About ChefAI 🍳
        </h1>
        <p className="animate-slideInUp" style={{ 
          color: 'var(--text-muted)', 
          fontSize: '1.2rem', 
          maxWidth: 700, 
          margin: '0 auto',
          lineHeight: 1.7
        }}>
          We're on a mission to make cooking accessible, enjoyable, and personalized for everyone. 
          ChefAI combines artificial intelligence with culinary expertise to help you discover, 
          create, and enjoy amazing meals.
        </p>
      </div>

      {/* Mission Section */}
      <div className="glass animate-scaleIn" style={{ 
        padding: '40px 32px', 
        marginBottom: 50,
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(5,150,105,0.05))',
        border: '1px solid rgba(16,185,129,0.2)'
      }}>
        <h2 className="animate-fadeIn" style={{ 
          fontSize: '2rem', 
          fontWeight: 700, 
          color: 'var(--text-primary)', 
          marginBottom: 20 
        }}>
          Our Mission 🎯
        </h2>
        <p className="animate-slideInUp" style={{ 
          color: 'var(--text-muted)', 
          fontSize: '1.1rem',
          lineHeight: 1.7,
          maxWidth: 800,
          margin: '0 auto'
        }}>
          To democratize cooking by providing intelligent, personalized culinary assistance. 
          We believe everyone deserves access to delicious, healthy meals, regardless of their 
          cooking experience or dietary restrictions. Our AI learns your preferences and helps 
          you create meals you'll love.
        </p>
      </div>

      {/* Stats Section */}
      <div style={{ marginBottom: 60 }}>
        <h2 className="section-title animate-fadeIn" style={{ textAlign: 'center', marginBottom: 40 }}>
          ChefAI by Numbers 📊
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 20 
        }}>
          {stats.map((stat, index) => (
            <div key={stat.label} className={`animate-slideInUp stagger-${index + 1}`}>
              <StatCard {...stat} />
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div style={{ marginBottom: 60 }}>
        <h2 className="section-title animate-fadeIn" style={{ textAlign: 'center', marginBottom: 40 }}>
          What Makes Us Special ✨
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: 24 
        }}>
          {[
            {
              icon: '🤖',
              title: 'AI-Powered',
              description: 'Advanced machine learning algorithms that understand your taste preferences and dietary needs.'
            },
            {
              icon: '🌍',
              title: 'Global Cuisine',
              description: 'Recipes from around the world, with authentic flavors and modern twists.'
            },
            {
              icon: '📱',
              title: 'Mobile First',
              description: 'Designed for modern devices with intuitive touch interfaces and offline capabilities.'
            },
            {
              icon: '🥗',
              title: 'Health Focused',
              description: 'Nutritional information, dietary filters, and health-conscious recipe suggestions.'
            },
            {
              icon: '👥',
              title: 'Community Driven',
              description: 'User reviews, ratings, and contributions that make our platform better every day.'
            },
            {
              icon: '🔒',
              title: 'Privacy First',
              description: 'Your data is encrypted and secure. We never share personal information with third parties.'
            }
          ].map((feature, index) => (
            <div key={feature.title} className={`glass hover-lift animate-fadeIn stagger-${index + 1}`} style={{ 
              padding: '28px 24px',
              borderRadius: 16
            }}>
              <div className="animate-float" style={{ 
                fontSize: 40, 
                textAlign: 'center', 
                marginBottom: 16 
              }}>
                {feature.icon}
              </div>
              <h3 className="animate-slideInLeft" style={{ 
                fontSize: '1.1rem', 
                fontWeight: 700, 
                color: 'var(--text-primary)', 
                marginBottom: 12,
                textAlign: 'center'
              }}>
                {feature.title}
              </h3>
              <p className="animate-slideInRight" style={{ 
                color: 'var(--text-muted)', 
                fontSize: 14,
                lineHeight: 1.6,
                textAlign: 'center'
              }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Team Section */}
      <div style={{ marginBottom: 60 }}>
        <h2 className="section-title animate-fadeIn" style={{ textAlign: 'center', marginBottom: 40 }}>
          Meet Our Team 👥
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: 24 
        }}>
          {team.map((member, index) => (
            <div key={member.name} className={`animate-slideInUp stagger-${index + 1}`}>
              <TeamMember {...member} />
            </div>
          ))}
        </div>
      </div>

      {/* Contact Section */}
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
          Get in Touch 📧
        </h2>
        <p className="animate-slideInUp" style={{ 
          color: 'var(--text-muted)', 
          fontSize: '1.1rem', 
          marginBottom: 24,
          maxWidth: 500,
          margin: '0 auto 24px'
        }}>
          Have questions, suggestions, or just want to say hi? We'd love to hear from you!
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link 
            to="/reviews"
            className="btn-primary hover-lift animate-bounceIn"
            style={{ 
              padding: '14px 24px', 
              fontSize: 15,
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            💬 Share Feedback
          </Link>
          <button
            className="hover-scale"
            onClick={() => window.open('mailto:hello@chefai.com')}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '14px 24px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 15
            }}
          >
            📧 Email Us
          </button>
        </div>
      </div>
    </div>
  );
}