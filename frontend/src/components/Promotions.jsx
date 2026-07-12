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
    ButtonIcon: FiShoppingBag,
  },
  {
    cardClass: 'orange-promo-card',
    btnClass: 'btn-orange',
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

/** Prefer admin highlighted title (subtitle); fall back to splitting long titles. */
const resolveTitleParts = (announcement) => {
  const title = String(announcement?.title || '').trim();
  const highlighted = String(
    announcement?.highlightedTitle || announcement?.subtitle || ''
  ).trim();

  if (highlighted) {
    return { lead: title, highlight: highlighted };
  }

  const parts = title.split(/\s+/).filter(Boolean);
  if (parts.length <= 2) {
    return { lead: title, highlight: '' };
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
  const { lead, highlight } = resolveTitleParts(announcement);
  const ButtonIcon = theme.ButtonIcon;

  return (
    <article className={`modern-promo-card ${theme.cardClass}`}>
      <div className="modern-promo-content">
        <div className="modern-promo-content-inner">
          {badgeText ? (
            <div className="modern-pill-badge">
              <span>{badgeText}</span>
            </div>
          ) : null}

          {(lead || highlight) ? (
            <h2 className="modern-promo-title">
              {lead ? <span className="modern-promo-title-lead">{lead}</span> : null}
              {highlight ? (
                <>
                  {lead ? <br /> : null}
                  <span className="highlight-text">{highlight}</span>
                </>
              ) : null}
            </h2>
          ) : null}

          {announcement.description ? (
            <p className="modern-promo-desc">{announcement.description}</p>
          ) : null}

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
          />
        </div>
      ) : (
        <div className="modern-promo-image-wrapper modern-promo-image-wrapper--empty" aria-hidden="true" />
      )}
    </article>
  );
};

const Promotions = () => {
  const [announcements, setAnnouncements] = useState([]);

  const loadAnnouncements = async () => {
    try {
      const list = await announcementService.getActiveAnnouncements();
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
