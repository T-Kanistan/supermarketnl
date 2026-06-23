import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShoppingBasket, FaUtensils, FaArrowRight } from 'react-icons/fa';
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
        if (data && typeof data === 'object') {
          setBanner(data);
        } else {
          setBanner(DEFAULT_BANNER);
        }
      } catch (err) {
        console.error('Failed to fetch home banner', err);
        setBanner(DEFAULT_BANNER);
      } finally {
        setLoading(false);
      }
    };
    fetchBanner();
  }, []);

  if (loading) {
    return <section className="hero hero-loading" aria-hidden="true" />;
  }

  const bannerData = banner || DEFAULT_BANNER;

  const rawBackground = bannerData.backgroundImage || bannerData.image;
  const bgImage = rawBackground
    ? getImageUrl(rawBackground)
    : getImageUrl(DEFAULT_BANNER.backgroundImage);
  const headingLine1 = bannerData.headingLine1 || bannerData.title || DEFAULT_BANNER.headingLine1;
  const headingLine2 =
    bannerData.headingLine2 || bannerData.highlightText || DEFAULT_BANNER.headingLine2;
  const headingLine3 =
    bannerData.headingLine3 || bannerData.titleLine2 || DEFAULT_BANNER.headingLine3;
  const primaryLabel =
    bannerData.primaryButtonLabel || bannerData.buttonText || DEFAULT_BANNER.primaryButtonLabel;
  const primaryLink =
    bannerData.primaryButtonLink || bannerData.buttonLink || DEFAULT_BANNER.primaryButtonLink;
  const secondaryLabel =
    bannerData.secondaryButtonLabel ||
    bannerData.buttonText2 ||
    DEFAULT_BANNER.secondaryButtonLabel;
  const secondaryLink =
    bannerData.secondaryButtonLink ||
    bannerData.buttonLink2 ||
    DEFAULT_BANNER.secondaryButtonLink;
  const showOpenTimeCard = true;

  return (
    <section
      className="hero"
      id="home"
      style={bgImage ? { '--hero-photo': `url('${bgImage}')` } : undefined}
    >
      <div className="hero-overlay" />
      <div className="hero-content container">
        <div className="hero-layout">
          <div className="hero-text">
            <h1 className="hero-title">
              <span className="hero-title-fresh">{headingLine1}</span>
              <span className="hero-highlight">{headingLine2}</span>
              <span className="hero-title-line">{headingLine3}</span>
              <span className="hero-title-accent" aria-hidden="true" />
            </h1>
            <p className="hero-subtitle">
              {bannerData.subtitle || DEFAULT_BANNER.subtitle}
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
            <div className="hero-timings-card">
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
      </div>
    </section>
  );
};

export default Hero;
