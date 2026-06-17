import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import cmsService from '../services/cmsService';
import './OffersPage.css';

const OffersPage = () => {
  const [activeTab, setActiveTab] = useState('All Offers');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    // Update time every minute to keep food availability accurate
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);

    const fetchOffers = async () => {
      try {
        const list = await cmsService.getAnnouncements();
        // Format campaigns to match page specs
        const formatted = list.filter(a => a.status === 'active').map(a => {
          // Infer type: if it is weekend special or weekly deal, or category specs
          const isFood = a.title.toUpperCase().includes('BURGER') || 
                         a.title.toUpperCase().includes('PIZZA') || 
                         a.title.toUpperCase().includes('JUICE') || 
                         a.title.toUpperCase().includes('FOOD');
          
          return {
            id: a.id,
            title: a.title,
            discount: a.offerPercentage > 0 ? `${a.offerPercentage}% OFF` : '15% OFF',
            description: a.description,
            validTill: a.endDate ? new Date(a.endDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '31 May 2026',
            image: a.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400',
            categoryId: isFood ? 'burgers' : 'grocery',
            type: isFood ? 'food' : 'product',
            stock: 50,
            startTime: '11:00',
            endTime: '22:00',
            displayTime: '11:00 AM - 10:00 PM',
          };
        });
        setOffers(formatted);
      } catch (err) {
        console.error('Failed to load campaigns', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
    return () => clearInterval(timer);
  }, []);

  const isFoodAvailable = (startTime, endTime) => {
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    
    const [startH, startM] = startTime.split(':').map(Number);
    const startTotal = startH * 60 + startM;
    
    const [endH, endM] = endTime.split(':').map(Number);
    const endTotal = endH * 60 + endM;
    
    if (startTotal <= endTotal) {
      return currentTotalMinutes >= startTotal && currentTotalMinutes <= endTotal;
    } else {
      return currentTotalMinutes >= startTotal || currentTotalMinutes <= endTotal;
    }
  };

  const renderAvailability = (offer) => {
    if (offer.type === 'product') {
      const isAvailable = offer.stock > 0;
      return (
        <div className={`availability-badge ${isAvailable ? 'available' : 'unavailable'}`}>
          {isAvailable ? 'Available ✅' : 'Unavailable ❌'}
        </div>
      );
    } else if (offer.type === 'food') {
      const isAvailable = isFoodAvailable(offer.startTime, offer.endTime);
      return (
        <div className={`availability-badge ${isAvailable ? 'available' : 'unavailable'}`}>
          {isAvailable ? 'Available ✅' : 'Unavailable ❌'}
        </div>
      );
    }
    return null;
  };

  const filteredOffers = offers.filter(offer => {
    if (activeTab === 'All Offers') return true;
    if (activeTab === 'Product Offers') return offer.type === 'product';
    return offer.type === 'food';
  });

  return (
    <div className="offers-page">
      {/* Premium Hero Banner */}
      <div className="offers-hero-banner">
        <div className="offers-hero-overlay"></div>
        <div className="container offers-hero-content">
          <div className="hero-text-side">
            <div className="hero-small-badge">
              <span>🔥</span> LIMITED TIME OFFERS
            </div>
            <h1 className="hero-main-title">BEST DEALS FOR YOU</h1>
            <h2 className="hero-sub-title" style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Product Offers</h2>
            <p className="hero-desc" style={{ marginBottom: '20px' }}>
              Discover amazing discounts on groceries, fresh produce, dairy products, beverages, household essentials, and more.
            </p>
            <h2 className="hero-sub-title" style={{ fontSize: '1.5rem', marginBottom: '10px' }}>🍔 Food Corner Offers</h2>
            <p className="hero-desc">
              Enjoy special deals on ready-to-eat meals, snacks, bakery items, beverages, fast food, and seasonal food corner specials.
            </p>
            <div className="hero-action-buttons">
              <a href="#current-offers" className="hero-btn-primary">Shop Offers</a>
              <Link to="/products" className="hero-btn-secondary">Browse Products</Link>
            </div>
          </div>
          <div className="hero-badge-side">
            <div className="premium-glass-badge">
              <span className="glass-upto">UP TO</span>
              <span className="glass-percent">30%</span>
              <span className="glass-off">OFF</span>
            </div>
          </div>
        </div>
      </div>

      {/* Current Offers Section */}
      <div className="current-offers-section container" id="current-offers">
        <div className="section-header">
          <span className="line"></span>
          <h2>CURRENT OFFERS</h2>
          <span className="line"></span>
        </div>

        <div className="offers-tabs">
          {['All Offers', 'Product Offers', 'Food Corner Offers'].map(tab => (
            <button 
              key={tab} 
              className={`offer-tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="offer-card" style={{ height: '350px', background: '#e2e8f0', borderRadius: '12px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
            ))}
          </div>
        ) : filteredOffers.length > 0 ? (
          <div className="offers-grid">
            {filteredOffers.map((offer) => (
              <div className="offer-card" key={offer.id}>
                <div className="offer-badge">
                  {offer.discount}
                </div>
                <div className="offer-img-wrapper">
                  <img 
                    src={offer.image} 
                    alt={offer.title} 
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400'; }}
                  />
                </div>
                <div className="offer-details">
                  <h3>{offer.title}</h3>
                  <p dangerouslySetInnerHTML={{ __html: offer.description.replace(offer.discount, `<strong>${offer.discount}</strong>`) }}></p>
                  {renderAvailability(offer)}
                  <Link to={offer.type === 'food' ? `/food-corner` : `/products?category=${offer.categoryId}`} className="shop-now-btn">SHOP NOW</Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            No campaign offers listed under this category at the moment.
          </div>
        )}
      </div>

      {/* Weekend Special Banner */}
      <div className="container">
        <div className="weekend-banner">
          <div className="weekend-content">
            <h2>WEEKEND SPECIAL OFFER</h2>
            <p>Flat 30% OFF on Select Products</p>
            <Link to="/products" className="shop-now-btn-outline">SHOP NOW</Link>
          </div>
          <div className="weekend-badge">
            <span className="up-to">UP TO</span>
            <span className="percent">30%</span>
            <span className="off">OFF</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OffersPage;
