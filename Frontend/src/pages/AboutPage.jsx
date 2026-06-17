import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiTarget, FiEye, FiHeart, FiTag, FiArrowRight, FiSmile } from 'react-icons/fi';
import { FaLeaf, FaTruck, FaRegHandshake } from 'react-icons/fa';
import { useCMS } from '../context/CMSContext';
import './AboutPage.css';

const AboutPage = () => {
  const { cmsData } = useCMS();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="about-page">
      
      {/* HERO SECTION */}
      <section className="about-hero container">
        <div className="about-hero-content">
          <div className="breadcrumb-badge">
            <FiHome /> Home <span className="arrow">&gt;</span> About Us
          </div>
          <div className="premium-label">ABOUT {cmsData.storeName?.toUpperCase() || 'OUR STORE'}</div>
          <h1 className="about-title">
            YOUR TRUSTED<br />
            <span className="text-gradient">SUPERMARKET PARTNER</span>
          </h1>
          <p className="about-desc">
            {cmsData.aboutUs}
          </p>
          <div className="about-actions">
            <Link to="/products" className="btn-primary">Explore Products <FiArrowRight /></Link>
            <Link to="/contact" className="btn-secondary" style={{ border: '2px solid var(--dark-blue)', color: 'var(--dark-blue)' }}>Contact Us</Link>
          </div>
        </div>

        <div className="about-hero-image-wrapper">
          <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200" alt="Supermarket Interior" className="about-main-img" />
          <div className="floating-badge top-badge">
            <span className="star-icon">⭐</span> Trusted Storefront
          </div>
          <div className="floating-card bottom-card">
            <div className="icon-wrap"><FiSmile /></div>
            <div className="text-wrap">
              <strong>100%</strong>
              <span>Fresh Goods</span>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION, VISION, PROMISE SECTION */}
      <section className="mvp-section container">
        <div className="glass-card">
          <div className="card-icon mission-icon"><FiTarget /></div>
          <h3>Our Mission</h3>
          <p>To provide quality products at affordable prices.</p>
        </div>
        <div className="glass-card">
          <div className="card-icon vision-icon"><FiEye /></div>
          <h3>Our Vision</h3>
          <p>To become the most trusted supermarket.</p>
        </div>
        <div className="glass-card">
          <div className="card-icon promise-icon"><FiHeart /></div>
          <h3>Our Promise</h3>
          <p>Fresh products and excellent customer service.</p>
        </div>
      </section>

      {/* STATISTICS SECTION */}
      <section className="stats-section">
        <div className="container stats-grid">
          <div className="stat-box">
            <h2>10K+</h2>
            <p>Happy Customers</p>
          </div>
          <div className="stat-box">
            <h2>500+</h2>
            <p>Products</p>
          </div>
          <div className="stat-box">
            <h2>50+</h2>
            <p>Categories</p>
          </div>
          <div className="stat-box">
            <h2>99%</h2>
            <p>Customer Satisfaction</p>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US SECTION */}
      <section className="features-section container">
        <div className="section-header">
          <span className="subtitle">WHY CHOOSE US</span>
          <h2>Experience the Best Quality</h2>
        </div>
        
        <div className="features-grid">
          <div className="feature-block">
            <div className="icon-container"><FaLeaf /></div>
            <h3>Fresh Products</h3>
            <p>We source the freshest produce and groceries daily to ensure highest quality.</p>
          </div>
          <div className="feature-block">
            <div className="icon-container"><FiTag /></div>
            <h3>Best Prices</h3>
            <p>Competitive pricing and regular offers to give you the best value for money.</p>
          </div>
          <div className="feature-block">
            <div className="icon-container"><FaTruck /></div>
            <h3>Fast Service</h3>
            <p>Quick checkout and fast delivery options tailored to your convenience.</p>
          </div>
          <div className="feature-block">
            <div className="icon-container"><FaRegHandshake /></div>
            <h3>Customer Support</h3>
            <p>Dedicated staff ready to assist you with a friendly smile at all times.</p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default AboutPage;
