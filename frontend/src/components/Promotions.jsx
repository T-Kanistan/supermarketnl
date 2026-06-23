import { useState, useEffect } from 'react';
import { FiChevronRight, FiShoppingBag } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useCMS } from '../context/CMSContext';
import announcementService from '../services/announcementService';
import { getImageUrl } from '../services/api';
import './Promotions.css';

const Promotions = () => {
  const { cmsData } = useCMS();
  const [weeklyDeal, setWeeklyDeal] = useState(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const list = await announcementService.getStorefrontAnnouncements();
        const active = list.find((a) => a.title?.toUpperCase().includes('WEEKLY'));
        const fallback = list[0];
        setWeeklyDeal(active || fallback);
      } catch (err) {
        console.error('Failed to load campaigns', err);
      }
    };
    fetchAnnouncements();
  }, []);

  const promo = cmsData?.foodCornerPromo || {};
  const promoTitle = weeklyDeal?.title || 'WEEKLY DEALS';
  const promoDesc = weeklyDeal?.description || 'Stock up on your daily essentials with our exclusive supermarket deals. Freshness guaranteed!';
  const promoImage = getImageUrl(weeklyDeal?.bannerImage || weeklyDeal?.image) || 'https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=800&q=80';
  const titleParts = promoTitle.split(' ');

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
                {titleParts.slice(0, 2).join(' ')}<br/>
                <span className="highlight-text">{titleParts.slice(2).join(' ') || 'THIS WEEK'}</span>
              </h2>
              <p className="modern-promo-desc">
                {promoDesc}
              </p>
              <Link to="/offers" className="modern-promo-btn btn-green">
                <FiShoppingBag className="btn-icon" /> Shop Offers
              </Link>
            </div>
            <div className="modern-promo-image-wrapper">
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
                <span className="badge-icon">👨‍🍳</span> {promo.badge || 'RESTAURANT'}
              </div>
              <h2 className="modern-promo-title">
                {promo.title || 'DELICIOUS FOOD'}<br/>
                <span className="highlight-text">{promo.highlight || 'MADE FRESH'}</span>
              </h2>
              <p className="modern-promo-desc" style={{ whiteSpace: 'pre-line' }}>
                {promo.description || ''}
              </p>
              <Link to={promo.buttonLink || '/food-corner'} className="modern-promo-btn btn-orange">
                {promo.buttonText || 'Order Now'} <FiChevronRight className="btn-icon" />
              </Link>
            </div>
            <div className="modern-promo-image-wrapper">
              <img
                src={getImageUrl(promo.image)}
                alt="Food Corner"
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
