import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaRegClock } from 'react-icons/fa';
import { useCMS } from '../context/CMSContext';
import bannerService from '../services/bannerService';
import { getImageUrl } from '../services/api';
import './Hero.css';

const Hero = () => {
  const navigate = useNavigate();
  const { cmsData } = useCMS();
  const [activeBanner, setActiveBanner] = useState(null);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const banners = await bannerService.getBanners();
        const active = banners.find(b => b.status === 'active');
        if (active) {
          setActiveBanner(active);
        }
      } catch (err) {
        console.error('Failed to fetch Hero banner, using static fallback', err);
      }
    };
    fetchBanner();
  }, []);

  const bannerTitle = activeBanner?.title || 'FRESH PRODUCTS';
  const highlightText = activeBanner?.highlightText || 'BETTER LIVING';
  const subtitle = activeBanner?.subtitle || 'Your one-stop supermarket for quality products and great offers.';
  const bgImage = getImageUrl(activeBanner?.image) || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200';
  const buttonText = activeBanner?.buttonText || 'EXPLORE PRODUCTS';
  const buttonLink = activeBanner?.buttonLink || '/products';
  const buttonText2 = activeBanner?.buttonText2 || 'EXPLORE FOOD CORNER';
  const buttonLink2 = activeBanner?.buttonLink2 || '/food-corner';

  return (
    <section 
      className="hero" 
      id="home"
      style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.4)), url('${bgImage}')` }}
    >
      <div className="hero-overlay"></div>
      <div className="hero-content container">
        <div className="hero-text">
          <h1 className="hero-title">
            {bannerTitle} <br />
            <span>{highlightText}</span>
          </h1>
          <p className="hero-subtitle">
            {subtitle}
          </p>
          <div className="hero-buttons">
            <button className="btn-primary btn-large" onClick={() => navigate(buttonLink)}>{buttonText}</button>
            <button className="btn-secondary btn-large" onClick={() => navigate(buttonLink2)}>{buttonText2}</button>
          </div>
          <div className="hero-timings">
            <div className="timing-item">
              <FaRegClock className="timing-icon" />
              <div>
                <span className="timing-label">Supermarket</span>
                <span className="timing-value">{cmsData?.supermarketTimings || '8:00 AM - 10:00 PM'}</span>
              </div>
            </div>
            <div className="timing-divider"></div>
            <div className="timing-item">
              <FaRegClock className="timing-icon" />
              <div>
                <span className="timing-label">Food Corner</span>
                <span className="timing-value">{cmsData?.foodCornerTimings || '11:00 AM - 11:00 PM'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
