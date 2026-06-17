import { useState, useEffect } from 'react';
import { FiStar } from 'react-icons/fi';
import feedbackService from '../services/feedbackService';
import { getImageUrl } from '../services/api';
import './Reviews.css';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await feedbackService.getTestimonials();
        setReviews(data.filter(r => r.status === 'active'));
      } catch (err) {
        console.error('Failed to load testimonials', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  if (loading) {
    return (
      <section className="reviews section-padding bg-light">
        <div className="container">
          <h2 className="section-title">Customer Reviews</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="review-card" style={{ height: '180px', background: 'white', borderRadius: '12px', padding: '24px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="reviews section-padding bg-light">
      <div className="container">
        <h2 className="section-title">Customer Reviews</h2>
        {reviews.length > 0 ? (
          <div className="reviews-grid">
            {reviews.map(review => (
              <div className="review-card" key={review.id}>
                <div className="review-header">
                  <img 
                    src={getImageUrl(review.image)} 
                    alt={review.customerName} 
                    className="reviewer-img" 
                    onError={(e) => { e.target.src = 'https://i.pravatar.cc/150?img=9'; }}
                  />
                  <div className="reviewer-info">
                    <h4 className="reviewer-name">{review.customerName}</h4>
                    <div className="review-rating">
                      {[...Array(5)].map((_, i) => (
                        <FiStar key={i} className={i < (review.rating || 5) ? "star-icon filled" : "star-icon"} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="review-text">"{review.review}"</p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
            No reviews published yet.
          </div>
        )}
      </div>
    </section>
  );
};

export default Reviews;
