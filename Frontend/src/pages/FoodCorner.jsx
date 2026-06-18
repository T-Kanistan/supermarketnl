import { useState, useEffect } from 'react';
import { FaRegClock, FaRegCalendarAlt, FaWhatsapp, FaStar, FaSearch, FaFireAlt } from 'react-icons/fa';
import productService from '../services/productService';
import { getImageUrl } from '../services/api';
import { useEnquiry } from '../context/EnquiryContext';
import './FoodCorner.css';

const categories = ["All", "Breakfast", "Lunch", "Dinner", "Snacks", "Beverages", "Desserts"];

const FoodCorner = () => {
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const { openEnquiry } = useEnquiry();

  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);

    const fetchFoodItems = async () => {
      setLoading(true);
      try {
        const list = await productService.getFoodCornerItems();
        setFoodItems(list.filter(item => item.status === 'active'));
      } catch (err) {
        console.error('Failed to load menu items', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFoodItems();
    return () => clearInterval(timer);
  }, []);

  const isAvailable = (startTime, endTime) => {
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

  const filteredItems = foodItems.filter(item => {
    const matchCat = activeCat === "All" || item.categoryId === activeCat;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleEnquiry = (item) => {
    openEnquiry({
      name: item.name,
      category: item.categoryId || 'Food Corner',
      sku: item.id,
      id: item.id,
    });
  };

  return (
    <div className="restaurant-page">
      {/* Premium Hero Banner */}
      <div className="restaurant-hero">
        <div className="restaurant-hero-overlay"></div>
        <div className="container restaurant-hero-content">
          <div className="hero-text-content">
            <div className="premium-badge">
              <FaFireAlt className="fire-icon" /> Premium Dining
            </div>
            <h1>Freshly Prepared Meals,<br/><span>Snacks & Beverages</span></h1>
            <p>Experience restaurant-quality food delivered straight from our kitchen to your table. Explore our delicious categories.</p>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">50+</span>
                <span className="stat-label">Dishes</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">100%</span>
                <span className="stat-label">Fresh</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">4.8</span>
                <span className="stat-label">Rating</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container restaurant-main-content">
        
        {/* Search and Filters */}
        <div className="restaurant-controls">
          <div className="search-wrapper">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search for delicious food..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="category-filters">
            {categories.map(cat => (
              <button 
                key={cat}
                className={`category-pill ${activeCat === cat ? 'active' : ''}`}
                onClick={() => setActiveCat(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="restaurant-menu-grid">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="menu-card skeleton-card" style={{ height: '380px', background: 'white', borderRadius: '16px', overflow: 'hidden', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ height: '200px', background: '#f1f5f9', borderRadius: '12px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                <div style={{ height: '22px', width: '80%', background: '#f1f5f9', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                <div style={{ height: '16px', width: '40%', background: '#f1f5f9', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                <div style={{ height: '44px', background: '#f1f5f9', borderRadius: '8px', animation: 'pulse 1.5s infinite ease-in-out', marginTop: 'auto' }}></div>
              </div>
            ))
          ) : filteredItems.length > 0 ? (
            filteredItems.map(item => {
              const available = isAvailable(item.startTime, item.endTime);
              return (
                <div className="menu-card" key={item.id}>
                  <div className="menu-card-image">
                    <img 
                      src={getImageUrl(item.image)} 
                      alt={item.name} 
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600'; }}
                    />
                    {item.badge && <span className="item-badge">{item.badge}</span>}
                    <div className="overlay-gradient"></div>
                  </div>
                  
                  <div className="menu-card-body">
                    <div className="menu-header">
                      <h3>{item.name}</h3>
                    </div>
                    
                    <div className="menu-meta">
                      <div className="rating">
                        <FaStar className="star-icon" />
                        <span>{(item.rating || 4.5).toFixed(1)}</span>
                        <span className="reviews">({item.reviews || 0} reviews)</span>
                      </div>
                      <div className="category-tag">{item.categoryId}</div>
                    </div>

                    <div className={`availability-status ${available ? 'is-available' : 'is-unavailable'}`}>
                      {available ? (
                        <>
                          <span className="status-dot green"></span>
                          <strong>Available Now</strong> | {item.displayTime}
                        </>
                      ) : (
                        <>
                          <span className="status-dot red"></span>
                          <strong>Currently Unavailable</strong> | Opens at {item.startTime}
                        </>
                      )}
                    </div>

                    <button 
                      className={`order-btn ${!available ? 'disabled' : ''}`} 
                      disabled={!available}
                      onClick={() => handleEnquiry(item)}
                    >
                      <FaWhatsapp className="btn-icon" /> 
                      {available ? 'Order Now' : 'Currently Unavailable'}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-results">
              <h3>No food items found matching your search.</h3>
              <p>Try searching for something else or browse our categories.</p>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="restaurant-info-section">
          <div className="info-card">
            <FaRegClock className="info-icon" />
            <h3>Operating Hours</h3>
            <p>Mon-Fri: 8:00 AM - 10:00 PM</p>
            <p>Sat-Sun: 9:00 AM - 11:00 PM</p>
          </div>
          <div className="info-card">
            <FaRegCalendarAlt className="info-icon" />
            <h3>Events & Catering</h3>
            <p>We provide food for all kinds of special events and parties.</p>
          </div>
          <div className="info-card">
            <FaWhatsapp className="info-icon" />
            <h3>Quick Delivery</h3>
            <p>Order directly via WhatsApp for lightning-fast delivery.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FoodCorner;
