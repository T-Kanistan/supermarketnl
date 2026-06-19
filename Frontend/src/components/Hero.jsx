import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShoppingBasket, FaUtensils } from 'react-icons/fa';
import bannerService from '../services/bannerService';
import { getImageUrl } from '../services/api';
import './Hero.css';

const Hero = () => {
  const navigate = useNavigate();
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const banners = await bannerService.getBanners();
        const active = banners.find((b) => b.status === 'active') || banners[0];
        setBanner(active || null);
      } catch (err) {
        console.error('Failed to fetch home banner', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBanner();
  }, []);

  if (loading) {
    return <section className="hero hero-loading" aria-hidden="true" />;
  }

  if (!banner) {
    return null;
  }

  const bgImage = getImageUrl(banner.image);

  return (
    <section
      className="hero"
      id="home"
      style={bgImage ? { backgroundImage: `url('${bgImage}')` } : undefined}
    >
      <div className="hero-overlay" />
      <div className="hero-content container">
        <div className="hero-layout">
          <div className="hero-text">
            <h1 className="hero-title">
              {banner.title}
              <br />
              <span className="hero-highlight">{banner.highlightText}</span>
              {banner.titleLine2 ? (
                <>
                  <br />
                  <span>{banner.titleLine2}</span>
                </>
              ) : null}
            </h1>
            {banner.subtitle ? <p className="hero-subtitle">{banner.subtitle}</p> : null}
            <div className="hero-buttons">
              {banner.buttonText ? (
                <button
                  type="button"
                  className="btn-primary btn-large"
                  onClick={() => navigate(banner.buttonLink || '/products')}
                >
                  {banner.buttonText}
                </button>
              ) : null}
              {banner.buttonText2 ? (
                <button
                  type="button"
                  className="btn-secondary btn-large"
                  onClick={() => navigate(banner.buttonLink2 || '/food-corner')}
                >
                  {banner.buttonText2}
                </button>
              ) : null}
            </div>
          </div>

          {banner.showOpenTime !== false ? (
            <div className="hero-timings-card">
              <h3 className="hero-timings-title">{banner.openTimeTitle || 'Open Time'}</h3>
              <div className="timing-item">
                <div className="timing-icon-wrap supermarket">
                  <FaShoppingBasket />
                </div>
                <div>
                  <span className="timing-label">{banner.supermarketLabel || 'Supermarket'}</span>
                  <span className="timing-value">{banner.supermarketTimings || '8:00 AM - 10:00 PM'}</span>
                </div>
              </div>
              <div className="timing-divider" />
              <div className="timing-item">
                <div className="timing-icon-wrap food-corner">
                  <FaUtensils />
                </div>
                <div>
                  <span className="timing-label">{banner.foodCornerLabel || 'Food Corner'}</span>
                  <span className="timing-value">{banner.foodCornerTimings || '11:00 AM - 11:00 PM'}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default Hero;
