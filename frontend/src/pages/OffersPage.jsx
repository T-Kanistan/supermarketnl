import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FaWhatsapp, FaTags, FaArrowRight, FaRegClock, FaExclamationTriangle, FaRedo, FaSearch,
  FaUtensils, FaShoppingCart, FaFacebookF,
} from 'react-icons/fa';
import offerService from '../services/offerService';
import { getImageUrl } from '../services/api';
import { useEnquiry } from '../context/EnquiryContext';
import OfferSeoHead from '../components/OfferSeoHead';
import { shareOffer } from '../utils/offerShareMeta';
import './OffersPage.css';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&q=80&w=1200';

const DEPARTMENT_OPTIONS = [
  { value: 'all', label: 'All Offers' },
  { value: 'Supermarket', label: 'Supermarket' },
  { value: 'Food Corner', label: 'Food Corner' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'discount-high', label: 'Highest Discount' },
  { value: 'discount-low', label: 'Lowest Discount' },
  { value: 'ending-soon', label: 'Ending Soon' },
  { value: 'az', label: 'A-Z' },
  { value: 'za', label: 'Z-A' },
];

const SEARCH_DEBOUNCE_MS = 300;

const getOfferTimestamp = (offer) => {
  const date = new Date(offer.createdAt || offer.updatedAt || 0);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const getEndTimestamp = (offer) => {
  if (!offer.endDate) return Number.POSITIVE_INFINITY;
  const date = new Date(offer.endDate);
  return Number.isNaN(date.getTime()) ? Number.POSITIVE_INFINITY : date.getTime();
};

const getDiscountValue = (offer) => {
  const value = Number(offer.discountValue);
  return Number.isNaN(value) ? 0 : value;
};

const sortOffers = (list, sortOption) => {
  const items = [...list];
  switch (sortOption) {
    case 'oldest':
      return items.sort((a, b) => getOfferTimestamp(a) - getOfferTimestamp(b));
    case 'discount-high':
      return items.sort((a, b) => getDiscountValue(b) - getDiscountValue(a));
    case 'discount-low':
      return items.sort((a, b) => getDiscountValue(a) - getDiscountValue(b));
    case 'ending-soon':
      return items.sort((a, b) => getEndTimestamp(a) - getEndTimestamp(b));
    case 'az':
      return items.sort((a, b) => (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' }));
    case 'za':
      return items.sort((a, b) => (b.title || '').localeCompare(a.title || '', undefined, { sensitivity: 'base' }));
    case 'newest':
    default:
      return items.sort((a, b) => getOfferTimestamp(b) - getOfferTimestamp(a));
  }
};

const formatValidTill = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleDateString('en-GB', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const getDiscountLabel = (offer) => {
  if (offer.offerBadge?.trim()) return offer.offerBadge.trim();

  const type = offer.discountType || 'percentage';
  const value = offer.discountValue;

  if (type === 'bogo') return 'Buy 1 Get 1';
  if (type === 'combo') return 'Combo Deal';

  if (value == null || value === '') return null;

  const num = Number(value);
  if (Number.isNaN(num)) return null;

  switch (type) {
    case 'percentage':
      return `${num % 1 === 0 ? num : num.toFixed(2)}% OFF`;
    case 'flat':
      return `€${num.toFixed(2)} OFF`;
    default:
      return null;
  }
};

const hasPrice = (value) => value != null && value !== '' && !Number.isNaN(Number(value));

const isInternalLink = (link) => link && !/^https?:\/\//i.test(link) && !link.startsWith('mailto:') && !link.startsWith('tel:');

const SmartButton = ({ link, className, children }) => {
  const target = link || '#offers';
  if (target.startsWith('#')) {
    return <a href={target} className={className}>{children}</a>;
  }
  if (isInternalLink(target)) {
    return <Link to={target} className={className}>{children}</Link>;
  }
  return <a href={target} className={className} target="_blank" rel="noreferrer">{children}</a>;
};

const OffersHeroSlide = ({ banner }) => {
  const heroImage = banner.bannerImage || banner.backgroundImage || banner.heroImage
    ? getImageUrl(banner.bannerImage || banner.backgroundImage || banner.heroImage)
    : '';
  const title = banner.title || banner.heroTitle || '';
  const subtitle = banner.highlightedTitle || banner.subtitle || banner.heroSubtitle || '';
  const description = banner.description || banner.heroDescription || '';
  const overlayColor = banner.overlayColor || banner.heroOverlayColor || '#0f172a';
  const overlayOpacity = banner.overlayOpacity ?? banner.heroOverlayOpacity ?? 0.55;

  return (
    <>
      {heroImage ? (
        <div
          className="offers-hero-bg"
          style={{ backgroundImage: `url(${heroImage})` }}
          aria-hidden="true"
        />
      ) : null}
      <div
        className="offers-hero-overlay"
        style={{ backgroundColor: overlayColor, opacity: overlayOpacity }}
        aria-hidden="true"
      />
      <div className="offers-hero-inner">
        {subtitle ? <span className="offers-hero-eyebrow">{subtitle}</span> : null}
        {title ? <h1 className="offers-hero-title"><span>{title}</span></h1> : null}
        {description ? <p className="offers-hero-desc">{description}</p> : null}
        <div className="offers-hero-actions">
          <SmartButton link="#offers" className="offers-hero-btn offers-hero-btn--primary">
            Shop Offers <FaArrowRight aria-hidden="true" />
          </SmartButton>
          <SmartButton link="/products" className="offers-hero-btn offers-hero-btn--secondary">
            View Products
          </SmartButton>
        </div>
      </div>
    </>
  );
};

const OffersHeroBanner = ({ banner }) => {
  if (!banner) return null;
  const hasContent = Boolean(
    banner.bannerImage
      || banner.heroImage
      || banner.title
      || banner.heroTitle
      || banner.description
      || banner.heroDescription
  );
  if (!hasContent) return null;

  return (
    <section className="offers-hero" aria-label="Offers hero banner">
      <div className="offers-hero-slide">
        <OffersHeroSlide banner={banner} />
      </div>
    </section>
  );
};

const OfferCard = ({ offer, onEnquiry, onShare, isHighlighted = false }) => {
  const validTill = formatValidTill(offer.endDate);
  const department = offer.offerDepartment || offer.offerType || 'Supermarket';
  const isFoodCorner = department === 'Food Corner';
  const discountLabel = getDiscountLabel(offer);
  const showOfferPrice = hasPrice(offer.offerPrice);
  const showOriginalPrice = hasPrice(offer.originalPrice);
  const actionLabel = offer.buttonText?.trim() || 'Enquiry';
  const actionLink = offer.buttonLink?.trim();
  const useEnquiryAction = !actionLink || actionLink === '#enquiry' || actionLink === 'enquiry';

  return (
    <article
      id={`offer-${offer.id}`}
      className={`offer-card ${isHighlighted ? 'offer-card--highlighted' : ''}`}
    >
      <div className="offer-card-image-wrap">
        <img
          src={getImageUrl(offer.image || offer.imageUrl)}
          alt={offer.title}
          className="offer-card-image"
          loading="lazy"
          decoding="async"
          width="320"
          height="235"
          onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }}
        />
        {offer.category && (
          <span className="offer-card-category-badge">{offer.category}</span>
        )}
        {discountLabel && (
          <span className="offer-card-discount-badge">{discountLabel}</span>
        )}
      </div>

      <div className="offer-card-body">
        <div className="offer-card-details">
          <h3 className="offer-card-title" title={offer.title}>{offer.title}</h3>
          {offer.subtitle?.trim() ? (
            <p className="offer-card-subtitle">{offer.subtitle}</p>
          ) : null}
          {offer.description?.trim() ? (
            <p className="offer-card-description">{offer.description}</p>
          ) : null}

          {(showOfferPrice || showOriginalPrice) && (
            <div className="offer-card-price-row">
              {showOfferPrice && (
                <span className="offer-card-price">€{Number(offer.offerPrice).toFixed(2)}</span>
              )}
              {showOriginalPrice && (
                <span className="offer-card-old-price">€{Number(offer.originalPrice).toFixed(2)}</span>
              )}
            </div>
          )}

          <span className={`offer-card-type-badge ${isFoodCorner ? 'offer-card-type-badge--food' : 'offer-card-type-badge--supermarket'}`}>
            {isFoodCorner ? (
              <>
                <FaUtensils aria-hidden="true" />
                <span>Food Corner</span>
              </>
            ) : (
              <>
                <FaShoppingCart aria-hidden="true" />
                <span>Supermarket</span>
              </>
            )}
          </span>

          {validTill && (
            <p className="offer-card-validity">
              <FaRegClock aria-hidden="true" />
              <span>Valid Till: {validTill}</span>
            </p>
          )}
        </div>

        <div className="offer-card-actions">
          {useEnquiryAction ? (
            <button
              type="button"
              className="offer-card-enquiry-btn"
              onClick={() => onEnquiry(offer)}
              aria-label={`${actionLabel} for ${offer.title}`}
            >
              <FaWhatsapp aria-hidden="true" />
              {actionLabel}
            </button>
          ) : (
            <SmartButton link={actionLink} className="offer-card-enquiry-btn">
              {actionLabel}
            </SmartButton>
          )}
          <button
            type="button"
            className="offer-card-share-btn"
            onClick={() => onShare(offer)}
            aria-label={`Share ${offer.title} on Facebook`}
            title="Share on Facebook"
          >
            <FaFacebookF aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
};

const OfferCardSkeleton = () => (
  <div className="offer-card offer-card--skeleton" aria-hidden="true">
    <div className="offer-skeleton-media" />
    <div className="offer-card-body">
      <div className="offer-skeleton-line short" />
      <div className="offer-skeleton-line medium" />
      <div className="offer-skeleton-line" />
      <div className="offer-skeleton-btn" />
    </div>
  </div>
);

const OffersPage = () => {
  const { openEnquiry } = useEnquiry();
  const { offerId: routeOfferId } = useParams();

  const [heroBanner, setHeroBanner] = useState(null);
  const [categories, setCategories] = useState([]);
  const [offers, setOffers] = useState([]);
  const [activeDepartment, setActiveDepartment] = useState('all');
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [routeOffer, setRouteOffer] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadHeroBanner = useCallback(async () => {
    try {
      const data = await offerService.getBanner();
      if (!data || data.heroStatus === 'inactive') {
        setHeroBanner(null);
        return;
      }
      setHeroBanner({
        heroImage: data.heroImage || '',
        heroTitle: data.heroTitle || '',
        heroSubtitle: data.heroSubtitle || '',
        heroDescription: data.heroDescription || '',
        heroButtonText: data.heroButtonText || '',
        heroButtonLink: data.heroButtonLink || '',
        heroOverlayColor: data.heroOverlayColor || '#0f172a',
        heroOverlayOpacity: data.heroOverlayOpacity ?? 0.55,
      });
    } catch (err) {
      console.error('Failed to load offers hero banner', err);
      setHeroBanner(null);
    }
  }, []);

  useEffect(() => {
    loadHeroBanner();
  }, [loadHeroBanner]);

  const loadCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const data = await offerService.getOfferCategories();
      setCategories(Array.isArray(data) ? data.filter(Boolean) : []);
    } catch (err) {
      console.error('Failed to load offer categories', err);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const fetchOffers = useCallback(async (department, category, search) => {
    setLoadingOffers(true);
    setError('');
    try {
      const params = {};
      if (department && department !== 'all') params.offerDepartment = department;
      if (category) params.category = category;
      if (search) params.search = search;

      const data = await offerService.getOffers(params);
      setOffers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load offers', err);
      setError('We could not load offers right now. Please try again in a moment.');
      setOffers([]);
    } finally {
      setLoadingOffers(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers(activeDepartment, activeCategory, debouncedSearch);
  }, [activeDepartment, activeCategory, debouncedSearch, fetchOffers]);

  useEffect(() => {
    const refreshLiveData = () => {
      if (document.visibilityState !== 'visible') return;
      loadHeroBanner();
      fetchOffers(activeDepartment, activeCategory, debouncedSearch);
    };
    document.addEventListener('visibilitychange', refreshLiveData);
    return () => document.removeEventListener('visibilitychange', refreshLiveData);
  }, [loadHeroBanner, fetchOffers, activeDepartment, activeCategory, debouncedSearch]);

  useEffect(() => {
    if (!routeOfferId) {
      setRouteOffer(null);
      return undefined;
    }

    let active = true;
    (async () => {
      try {
        const data = await offerService.getOfferById(routeOfferId);
        if (active) setRouteOffer(data || null);
      } catch (err) {
        console.error('Failed to load offer for share preview', err);
        if (active) setRouteOffer(null);
      }
    })();

    return () => { active = false; };
  }, [routeOfferId]);

  const showFeatured = activeDepartment === 'all' && !activeCategory && !debouncedSearch;

  const sortedOffers = useMemo(
    () => sortOffers(offers, sortOption),
    [offers, sortOption],
  );

  const featuredOffers = useMemo(
    () => (showFeatured ? sortOffers(offers.filter((o) => o.featured), sortOption) : []),
    [offers, showFeatured, sortOption],
  );

  const sharedOffer = useMemo(
    () => (routeOfferId ? routeOffer || offers.find((offer) => offer.id === routeOfferId) || null : null),
    [routeOfferId, routeOffer, offers]
  );

  useEffect(() => {
    if (!routeOfferId || !sharedOffer) return undefined;
    const timer = setTimeout(() => {
      const node = document.getElementById(`offer-${sharedOffer.id}`);
      if (node) node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 250);
    return () => clearTimeout(timer);
  }, [routeOfferId, sharedOffer]);

  const handleEnquiry = (offer) => {
    openEnquiry({
      name: offer.title,
      initialMessage: `Hi, I'm interested in the offer "${offer.title}"${offer.category ? ` (${offer.category})` : ''}. Please share more details.`,
    });
  };

  const handleShareFacebook = (offer) => {
    void shareOffer(offer);
  };

  const handleDepartmentChange = (departmentId) => {
    setActiveDepartment(departmentId);
  };

  const handleCategorySelect = (categoryName) => {
    setActiveCategory(categoryName);
  };

  const handleRetry = () => {
    loadHeroBanner();
    loadCategories();
    fetchOffers(activeDepartment, activeCategory, debouncedSearch);
  };

  const sectionTitle = DEPARTMENT_OPTIONS.find((opt) => opt.value === activeDepartment)?.label || 'All Offers';
  const hasActiveFilters = activeDepartment !== 'all' || activeCategory || debouncedSearch;

  return (
    <div className="offers-page">
      <OfferSeoHead offer={sharedOffer} />
      <OffersHeroBanner banner={heroBanner} />

      <div className="offers-container" id="offers">
        {(loadingCategories || categories.length > 0) && (
          <div className="offers-category-chips" aria-label="Offer category filters">
            {loadingCategories ? (
              Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="offers-filter-chip offers-filter-chip--skeleton" aria-hidden="true" />
              ))
            ) : (
              <>
                <button
                  type="button"
                  className={`offers-filter-chip ${!activeCategory ? 'active' : ''}`}
                  onClick={() => handleCategorySelect(null)}
                >
                  All Offers
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`offers-filter-chip ${activeCategory === cat ? 'active' : ''}`}
                    onClick={() => handleCategorySelect(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </>
            )}
          </div>
        )}

        <div className="offers-toolbar" aria-label="Filter offers">
          <label className="offers-search-wrap">
            <FaSearch className="offers-search-icon" aria-hidden="true" />
            <input
              type="search"
              className="offers-search-input"
              placeholder="Search offers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search offers by title, subtitle, category, or department"
            />
          </label>

          <label className="offers-type-wrap">
            <span className="offers-type-label">Offer Type</span>
            <select
              className="offers-type-select"
              value={activeDepartment}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              aria-label="Filter by offer type"
            >
              {DEPARTMENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>

          <label className="offers-sort-wrap">
            <span className="offers-sort-label">Sort By</span>
            <select
              className="offers-sort-select"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              aria-label="Sort offers"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
        </div>

        {error ? (
          <div className="offers-error-state">
            <FaExclamationTriangle className="offers-error-icon" aria-hidden="true" />
            <h2>Something went wrong</h2>
            <p>{error}</p>
            <button type="button" className="offers-retry-btn" onClick={handleRetry}>
              <FaRedo aria-hidden="true" /> Try Again
            </button>
          </div>
        ) : (
          <>
            {!loadingOffers && showFeatured && featuredOffers.length > 0 && (
              <section className="offers-section">
                <div className="offers-section-head offers-section-head--stacked">
                  <h2 className="offers-section-title">Featured Offers</h2>
                  <p className="offers-section-sub">Handpicked deals you don&apos;t want to miss</p>
                </div>
                <div className="offers-grid">
                  {featuredOffers.map((offer) => (
                    <OfferCard
                      key={`featured-${offer.id}`}
                      offer={offer}
                      onEnquiry={handleEnquiry}
                      onShare={handleShareFacebook}
                      isHighlighted={routeOfferId === offer.id}
                    />
                  ))}
                </div>
              </section>
            )}

            <section className="offers-section">
              <div className="offers-section-head">
                <h2 className="offers-section-title">
                  {activeCategory || sectionTitle}
                </h2>
                {!loadingOffers && (
                  <p className="offers-section-sub">
                    {sortedOffers.length} {sortedOffers.length === 1 ? 'offer' : 'offers'} available
                    {hasActiveFilters && debouncedSearch ? ` for "${debouncedSearch}"` : ''}
                  </p>
                )}
              </div>

              {loadingOffers ? (
                <div className="offers-grid">
                  {Array.from({ length: 8 }).map((_, i) => <OfferCardSkeleton key={i} />)}
                </div>
              ) : sortedOffers.length > 0 ? (
                <div className="offers-grid">
                  {sortedOffers.map((offer) => (
                    <OfferCard
                      key={offer.id}
                      offer={offer}
                      onEnquiry={handleEnquiry}
                      onShare={handleShareFacebook}
                      isHighlighted={routeOfferId === offer.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="offers-empty-state">
                  <FaTags className="offers-empty-icon" aria-hidden="true" />
                  <h3>
                    No offers found
                    {activeCategory ? ` in ${activeCategory}` : ''}
                    {activeDepartment !== 'all' && !activeCategory ? ` for ${sectionTitle}` : ''}
                  </h3>
                  <p>Try adjusting your search or filters, or check back soon for new deals.</p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default OffersPage;
