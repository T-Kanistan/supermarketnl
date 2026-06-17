import { useState, useEffect } from 'react';
import { FiChevronRight, FiShoppingBag } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import cmsService from '../services/cmsService';
import { getImageUrl } from '../services/api';
import './Promotions.css';

const Promotions = () => {
  const [weeklyDeal, setWeeklyDeal] = useState(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const list = await cmsService.getAnnouncements();
        // Look for active weekly deals or first active announcement
        const active = list.find(a => a.status === 'active' && a.title.toUpperCase().includes('WEEKLY'));
        const fallback = list.find(a => a.status === 'active');
        setWeeklyDeal(active || fallback);
      } catch (err) {
        console.error('Failed to load campaigns', err);
      }
    };
    fetchAnnouncements();
  }, []);

  const promoTitle = weeklyDeal?.title || 'WEEKLY DEALS';
  const promoDesc = weeklyDeal?.description || 'Stock up on your daily essentials with our exclusive supermarket deals. Freshness guaranteed!';
  const promoImage = getImageUrl(weeklyDeal?.image) || 'https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=800&q=80';
  const promoDiscount = weeklyDeal?.offerPercentage ? `${weeklyDeal.offerPercentage}%` : '30%';

  return (
    <section className="promotions pt-10 pb-20" id="offers">
      <div className="container">
        <div className="promotions-grid">
          
          {/* LEFT CARD: Special Offers (Dynamic CMS Campaign) */}
          <div className="modern-promo-card green-promo-card">
            <div className="modern-promo-content">
              <div className="modern-pill-badge">
                <span className="badge-icon">🛒</span> WEEKLY DEALS
              </div>
              <h2 className="modern-promo-title">
                {promoTitle.split(' ').slice(0, 2).join(' ')}<br/>
                <span className="highlight-text">{promoTitle.split(' ').slice(2).join(' ') || 'THIS WEEK'}</span>
              </h2>
              <p className="modern-promo-desc">
                {promoDesc}
              </p>
              <Link to="/offers" className="modern-promo-btn btn-green">
                <FiShoppingBag className="btn-icon" /> Shop Offers
              </Link>
            </div>
            <div className="modern-promo-image-wrapper">
              {promoDiscount && (
                <div className="floating-discount-badge">
                  <strong>{promoDiscount}</strong>
                  <span>OFF</span>
                </div>
              )}
              <img 
                src={promoImage} 
                alt="Grocery Basket" 
                className="modern-promo-img"
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=800&q=80'; }}
              />
            </div>
          </div>

          {/* RIGHT CARD: Food Corner (Kitchen section link) */}
          <div className="modern-promo-card orange-promo-card">
            <div className="modern-promo-content">
              <div className="modern-pill-badge">
                <span className="badge-icon">👨‍🍳</span> RESTAURANT
              </div>
              <h2 className="modern-promo-title">
                DELICIOUS FOOD<br/><span className="highlight-text">MADE FRESH</span>
              </h2>
              <p className="modern-promo-desc">
                Tasty | Healthy | Affordable<br/>
                Experience premium biryani and authentic meals prepared by our expert chefs.
              </p>
              <Link to="/food-corner" className="modern-promo-btn btn-orange">
                Order Now <FiChevronRight className="btn-icon" />
              </Link>
            </div>
            <div className="modern-promo-image-wrapper">
              <img 
                src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80" 
                alt="Premium Biryani" 
                className="modern-promo-img"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Promotions;
