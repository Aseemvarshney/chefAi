import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import toast from 'react-hot-toast';

// ── Star Rating Component ────────────────────────────────────────────────────
function StarRating({ rating, onRate, readonly = false }) {
  const [hover, setHover] = useState(0);
  
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          onClick={() => !readonly && onRate(star)}
          style={{
            background: 'none',
            border: 'none',
            cursor: readonly ? 'default' : 'pointer',
            fontSize: 24,
            color: star <= (hover || rating) ? '#fbbf24' : 'rgba(255,255,255,0.2)',
            transition: 'color 0.2s',
          }}
        >
          ⭐
        </button>
      ))}
    </div>
  );
}

// ── Review Card ──────────────────────────────────────────────────────────────
function ReviewCard({ review, onDelete, currentUserId }) {
  const { t } = useLanguage();
  const canDelete = review.user_id === currentUserId;
  
  return (
    <div className="glass hover-glow animate-fadeIn" style={{ padding: 20, marginBottom: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ 
              width: 40, height: 40, borderRadius: '50%', 
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 600, fontSize: 16
            }}>
              {review.user_name ? review.user_name[0].toUpperCase() : '?'}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {review.user_name || 'Anonymous'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {new Date(review.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
          <StarRating rating={review.rating} readonly />
        </div>
        {canDelete && (
          <button 
            onClick={() => onDelete(review.id)}
            className="hover-scale"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8,
              padding: '6px 12px',
              color: '#ef4444',
              cursor: 'pointer',
              fontSize: 12
            }}
          >
            {t('delete')}
          </button>
        )}
      </div>
      
      {/* Content */}
      <div>
        {review.title && (
          <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, fontSize: 16 }}>
            {review.title}
          </h4>
        )}
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: 14 }}>
          {review.review_text}
        </p>
      </div>
    </div>
  );
}

// ── Main Reviews Page ────────────────────────────────────────────────────────
export default function ReviewsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [form, setForm] = useState({
    review_text: '',
    rating: 0
  });

  // Load reviews
  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const { data } = await api.get('/reviews');
      setReviews(data.reviews || []);
    } catch (err) {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  // Submit new review
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.review_text.trim() || form.rating === 0) {
      toast.error('Please fill all fields and select a rating');
      return;
    }
    
    setSubmitting(true);
    try {
      const { data } = await api.post('/reviews', form);
      setReviews([data, ...reviews]);
      setForm({ title: '', review_text: '', rating: 0 });
      setShowForm(false);
      toast.success('Review submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete review
  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    
    try {
      await api.delete(`/reviews/${reviewId}`);
      setReviews(reviews.filter(r => r.id !== reviewId));
      toast.success('Review deleted');
    } catch (err) {
      toast.error('Failed to delete review');
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="animate-spin" style={{ fontSize: 32 }}>🍳</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="animate-fadeUp" style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 className="gradient-text animate-bounceIn" style={{ 
          fontFamily: 'Playfair Display', 
          fontSize: 'clamp(2rem, 5vw, 3rem)', 
          fontWeight: 700, 
          marginBottom: 12 
        }}>
          💬 {t('userReviews')}
        </h1>
        <p className="animate-slideInUp" style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
          Share your experience and help us improve ChefAI
        </p>
      </div>

      {/* Write Review Button */}
      <div className="animate-scaleIn" style={{ textAlign: 'center', marginBottom: 32 }}>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn-primary hover-lift animate-pulse-glow"
          style={{ padding: '14px 28px', fontSize: 15 }}
        >
          ✍️ {t('writeReview')}
        </button>
      </div>

      {/* Review Form */}
      {showForm && (
        <div className="glass animate-slideInDown" style={{ padding: 28, marginBottom: 32, maxWidth: 600, margin: '0 auto 32px' }}>
          <h3 style={{ fontWeight: 600, marginBottom: 20, color: 'var(--text-primary)' }}>
            {t('writeReview')}
          </h3>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Rating */}
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>
                {t('rating')} *
              </label>
              <StarRating rating={form.rating} onRate={(rating) => setForm(prev => ({ ...prev, rating }))} />
            </div>

            {/* Title */}
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>
                {t('reviewTitle')} *
              </label>
              <input 
                className="input-field"
                type="text"
                placeholder="Great app for cooking!"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            {/* Review Text */}
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>
                {t('reviewText')} *
              </label>
              <textarea 
                className="input-field"
                rows={4}
                placeholder="Tell us about your experience with ChefAI..."
                value={form.review_text}
                onChange={(e) => setForm(prev => ({ ...prev, review_text: e.target.value }))}
                style={{ resize: 'vertical', minHeight: 80 }}
                required
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button 
                type="submit" 
                className="btn-primary hover-lift"
                disabled={submitting}
                style={{ flex: 1, padding: '12px' }}
              >
                {submitting ? t('loading') : t('submitReview')}
              </button>
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="hover-scale"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '12px 20px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h2 className="section-title animate-fadeIn" style={{ marginBottom: 24 }}>
          {t('allReviews')} ({reviews.length})
        </h2>
        
        {reviews.length > 0 ? (
          <div>
            {reviews.map((review, index) => (
              <div key={review.id} className={`animate-slideInLeft stagger-${index + 1}`}>
                <ReviewCard 
                  review={review} 
                  onDelete={handleDelete}
                  currentUserId={user?.id}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="animate-fadeIn" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div className="animate-bounceIn" style={{ fontSize: 64, marginBottom: 16 }}>💬</div>
            <h3 className="animate-slideInLeft" style={{ 
              fontSize: '1.2rem', 
              fontWeight: 600, 
              color: 'var(--text-muted)', 
              marginBottom: 8 
            }}>
              {t('noReviews')}
            </h3>
            <p className="animate-slideInRight" style={{ color: 'var(--text-muted)' }}>
              {t('beFirst')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}