import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShoppingBasket, FaUtensils, FaArrowRight } from 'react-icons/fa';
import { mergePageBanner } from '../constants/pageBannerDefaults';
import { getBannerOverlayStyle } from '../utils/bannerOverlay';
import bannerService from '../services/bannerService';
import { getImageUrl } from '../services/api';
import './Hero.css';

const DEFAULT_BANNER = {
  headingLine1: 'FRESH',
  headingLine2: 'PRODUCTS',
  headingLine3: 'BETTER LIVING',
  subtitle: 'Your one-stop supermarket for quality products and great offers.',
  primaryButtonLabel: 'EXPLORE PRODUCTS',
  primaryButtonLink: '/products',
  secondaryButtonLabel: 'EXPLORE FOOD CORNER',
  secondaryButtonLink: '/food-corner',
  backgroundImage: '/images/home-banner-produce.jpg',
  showOpenTimeCard: true,
  cardTitle: 'Open Time',
  supermarketLabel: 'Supermarket',
  supermarketHours: '8:00 AM - 10:00 PM',
  foodCornerLabel: 'Food Corner',
  foodCornerHours: '11:00 AM - 11:00 PM',
};

const Hero = () => {
  const navigate = useNavigate();
  const [banner, setBanner] = useState(null);
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

  const rawBackground = bannerData.image || bannerData.backgroundImage;
  const bgImage = rawBackground
    ? getImageUrl(rawBackground)
    : getImageUrl(DEFAULT_BANNER.backgroundImage);
  const headingLine1 = bannerData.mainHeading || bannerData.headingLine1 || DEFAULT_BANNER.headingLine1;
  const headingLine2 =
    bannerData.highlightText || bannerData.headingLine2 || DEFAULT_BANNER.headingLine2;
  const headingLine3 =
    bannerData.badgeText || bannerData.headingLine3 || DEFAULT_BANNER.headingLine3;
  const primaryLabel =
    bannerData.button1Text || bannerData.primaryButtonLabel || DEFAULT_BANNER.primaryButtonLabel;
  const primaryLink =
    bannerData.button1Url || bannerData.primaryButtonLink || DEFAULT_BANNER.primaryButtonLink;
  const secondaryLabel =
    bannerData.button2Text ||
    bannerData.secondaryButtonLabel ||
    DEFAULT_BANNER.secondaryButtonLabel;
  const secondaryLink =
    bannerData.button2Url ||
    bannerData.secondaryButtonLink ||
    DEFAULT_BANNER.secondaryButtonLink;
  const showOpenTimeCard = true;

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
            <p className="hero-subtitle">
              {bannerData.description || bannerData.subtitle || DEFAULT_BANNER.subtitle}
            </p>
            <div className="hero-buttons">
              <button
                type="button"
                className="btn-primary btn-large hero-btn"
                onClick={() => navigate(primaryLink || '/products')}
              >
                <span>{primaryLabel}</span>
                <FaArrowRight aria-hidden="true" />
              </button>
              <button
                type="button"
                className="btn-secondary btn-large hero-btn"
                onClick={() => navigate(secondaryLink || '/food-corner')}
              >
                <span>{secondaryLabel}</span>
                <FaArrowRight aria-hidden="true" />
              </button>
            </div>
          </div>

          {showOpenTimeCard !== false ? (
            <div className="hero-timings-card right-time-card">
              <h3 className="hero-timings-title">
                {bannerData.cardTitle || bannerData.openTimeTitle || DEFAULT_BANNER.cardTitle}
              </h3>
              <div className="timing-item">
                <div className="timing-icon-wrap supermarket">
                  <FaShoppingBasket />
                </div>
                <div>
                  <span className="timing-label">
                    {bannerData.supermarketLabel || DEFAULT_BANNER.supermarketLabel}
                  </span>
                  <span className="timing-value">
                    {bannerData.supermarketHours ||
                      bannerData.supermarketTimings ||
                      DEFAULT_BANNER.supermarketHours}
                  </span>
                </div>
              </div>
              <div className="timing-divider" />
              <div className="timing-item">
                <div className="timing-icon-wrap food-corner">
                  <FaUtensils />
                </div>
                <div>
                  <span className="timing-label">
                    {bannerData.foodCornerLabel || DEFAULT_BANNER.foodCornerLabel}
                  </span>
                  <span className="timing-value">
                    {bannerData.foodCornerHours ||
                      bannerData.foodCornerTimings ||
                      DEFAULT_BANNER.foodCornerHours}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
      </div>
    </section>
  );
};

export default Hero;
