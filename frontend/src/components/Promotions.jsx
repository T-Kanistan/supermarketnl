import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronRight, FiShoppingBag } from 'react-icons/fi';
import announcementService from '../services/announcementService';
import { getImageUrl } from '../services/api';
import { buildPromoAlt } from '../utils/seoImageAlt';
import './Promotions.css';

const CARD_THEMES = [
  {
    cardClass: 'green-promo-card',
    btnClass: 'btn-green',
    badgeIcon: '🛒',
    ButtonIcon: FiShoppingBag,
  },
  {
    cardClass: 'orange-promo-card',
    btnClass: 'btn-orange',
    badgeIcon: '👨‍🍳',
    ButtonIcon: FiChevronRight,
  },
];

const getAnnouncementBadge = (announcement) => {
  if (announcement?.badgeText?.trim()) return announcement.badgeText.trim();
  if (Number(announcement?.discountPercentage) > 0) {
    return `${announcement.discountPercentage}% OFF`;
  }
  return '';
};

const isInternalLink = (link) =>
  link && !/^https?:\/\//i.test(link) && !link.startsWith('mailto:') && !link.startsWith('tel:');

const PromoButton = ({ link, className, children }) => {
  const target = link || '/offers';
  if (isInternalLink(target)) {
    return (
      <Link to={target} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={target} className={className} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
};

const splitPromoTitle = (title) => {
  const parts = String(title || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 2) {
    return { lead: parts.join(' '), highlight: '' };
  }
  return {
    lead: parts.slice(0, 2).join(' '),
    highlight: parts.slice(2).join(' '),
  };
};

const PromoCard = ({ announcement, theme }) => {
  const badgeText = getAnnouncementBadge(announcement);
  const promoImage = announcement.bannerImage || announcement.image
    ? getImageUrl(announcement.bannerImage || announcement.image)
    : '';
  const { lead, highlight } = splitPromoTitle(announcement.title);
  const subtitle = announcement.subtitle?.trim() || '';
  const ButtonIcon = theme.ButtonIcon;

  return (
    <div className={`modern-promo-card ${theme.cardClass}`}>
      <div className="modern-promo-content">
        <div className="modern-promo-badge-slot">
          {badgeText ? (
            <div className="modern-pill-badge">
              <span className="badge-icon" aria-hidden="true">{theme.badgeIcon}</span>
              <span>{badgeText}</span>
            </div>
          ) : null}
        </div>
        <div className="modern-promo-copy">
          <div className="modern-promo-subtitle-slot">
            {subtitle ? <p className="modern-promo-subtitle">{subtitle}</p> : null}
          </div>
          <h2 className="modern-promo-title">
            {lead}
            {highlight ? (
              <>
                <br />
                <span className="highlight-text">{highlight}</span>
              </>
            ) : null}
          </h2>
          {announcement.description ? (
            <p className="modern-promo-desc">{announcement.description}</p>
          ) : null}
        </div>
        <div className="modern-promo-actions">
          {announcement.buttonText ? (
            <PromoButton
              link={announcement.buttonLink || '/offers'}
              className={`modern-promo-btn ${theme.btnClass}`}
            >
              <span>{announcement.buttonText}</span>
              <ButtonIcon className="btn-icon" aria-hidden="true" />
            </PromoButton>
          ) : null}
        </div>
      </div>
      {promoImage ? (
        <div className="modern-promo-image-wrapper">
          <img
            src={promoImage}
            alt={buildPromoAlt(announcement.title || 'Store announcement')}
            className="modern-promo-img"
            loading="lazy"
            decoding="async"
            width="360"
            height="240"
          />
        </div>
      ) : (
        <div className="modern-promo-image-wrapper modern-promo-image-wrapper--empty" aria-hidden="true" />
      )}
    </div>
  );
};

const Promotions = () => {
  const [announcements, setAnnouncements] = useState([]);

  const loadAnnouncements = async () => {
    try {
      const list = await announcementService.getStorefrontAnnouncements();
      setAnnouncements(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load store announcements', err);
      setAnnouncements([]);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') {
        loadAnnouncements();
      }
    };
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  }, []);

  if (!announcements.length) {
    return null;
  }

  const gridClass = announcements.length === 1
    ? 'promotions-grid promotions-grid--single'
    : 'promotions-grid';

  return (
    <section className="promotions" id="offers">
      <div className="container">
        <div className={gridClass}>
          {announcements.map((announcement, index) => (
            <PromoCard
              key={announcement.id || `${announcement.title}-${index}`}
              announcement={announcement}
              theme={CARD_THEMES[index % CARD_THEMES.length]}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Promotions;
