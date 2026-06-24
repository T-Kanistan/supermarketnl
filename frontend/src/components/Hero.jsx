import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShoppingBasket, FaUtensils, FaArrowRight } from 'react-icons/fa';
import { mergePageBanner } from '../constants/pageBannerDefaults';
import { getBannerOverlayStyle } from '../utils/bannerOverlay';
import { useCMS } from '../context/CMSContext';
import bannerService from '../services/bannerService';
import { getImageUrl } from '../services/api';
import './Hero.css';

const Hero = () => {
  const navigate = useNavigate();
  const { cmsData } = useCMS();
  const [banner, setBanner] = useState(() => mergePageBanner('home', null));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const data = await bannerService.getStorefrontBanner();
        setBanner(mergePageBanner('home', data));
      } catch (err) {
        console.error('Failed to fetch home banner', err);
        setBanner(mergePageBanner('home', null));
      } finally {
        setLoading(false);
      }
    };
    fetchBanner();
  }, []);

  if (loading) {
    return <section className="hero hero-loading" aria-hidden="true" />;
  }

  const bannerData = banner || mergePageBanner('home', null);
  const bgImage = getImageUrl(bannerData.backgroundImage || bannerData.image);
  const headingLine1 = bannerData.title || bannerData.mainHeading;
  const headingLine2 = bannerData.highlightedTitle || bannerData.highlightText;
  const headingLine3 = bannerData.badgeText;
  const primaryLabel = bannerData.buttonText || bannerData.button1Text;
  const primaryLink = bannerData.buttonUrl || bannerData.button1Url;
  const secondaryLabel = bannerData.button2Text;
  const secondaryLink = bannerData.button2Url;
  const supermarketHours = cmsData?.supermarketTimings || '';
  const foodCornerHours = cmsData?.foodCornerTimings || '';

  return (
    <section
      className="hero"
      id="home"
      style={bgImage ? { '--hero-photo': `url('${bgImage}')` } : undefined}
    >
      <div className="hero-overlay" style={getBannerOverlayStyle(bannerData)} />
      <div className="hero-content">
        <div className="hero-text left-hero-card">
            <h1 className="hero-title">
              <span className="hero-title-fresh">{headingLine1}</span>
              <span className="hero-highlight">{headingLine2}</span>
              <span className="hero-title-line">{headingLine3}</span>
              <span className="hero-title-accent" aria-hidden="true" />
            </h1>
            <p className="hero-subtitle">{bannerData.description}</p>
            <div className="hero-buttons">
              {primaryLabel ? (
                <button
                  type="button"
                  className="btn-primary btn-large hero-btn"
                  onClick={() => navigate(primaryLink || '/products')}
                >
                  <span>{primaryLabel}</span>
                  <FaArrowRight aria-hidden="true" />
                </button>
              ) : null}
              {secondaryLabel ? (
                <button
                  type="button"
                  className="btn-secondary btn-large hero-btn"
                  onClick={() => navigate(secondaryLink || '/food-corner')}
                >
                  <span>{secondaryLabel}</span>
                  <FaArrowRight aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="hero-timings-card right-time-card">
            <h3 className="hero-timings-title">
              {bannerData.sideCardTitle || bannerData.cardTitle || 'Open Time'}
            </h3>
            {bannerData.sideCardDescription ? (
              <p className="hero-timings-desc">{bannerData.sideCardDescription}</p>
            ) : null}
            <div className="timing-item">
              <div className="timing-icon-wrap supermarket">
                <FaShoppingBasket />
              </div>
              <div>
                <span className="timing-label">Supermarket</span>
                <span className="timing-value">{supermarketHours}</span>
              </div>
            </div>
            <div className="timing-divider" />
            <div className="timing-item">
              <div className="timing-icon-wrap food-corner">
                <FaUtensils />
              </div>
              <div>
                <span className="timing-label">Food Corner</span>
                <span className="timing-value">{foodCornerHours}</span>
              </div>
            </div>
          </div>
      </div>
    </section>
  );
};

export default Hero;
