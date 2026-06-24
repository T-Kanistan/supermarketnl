import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FaRegClock,
  FaUtensils,
  FaLeaf,
  FaHeart,
  FaCalendarAlt,
  FaBell,
  FaSearch,
} from 'react-icons/fa';
import { GiCook } from 'react-icons/gi';
import foodCornerService from '../services/foodCornerService';
import { getImageUrl } from '../services/api';
import { useEnquiry } from '../context/EnquiryContext';
import { useCMS } from '../context/CMSContext';
import usePageBanner from '../hooks/usePageBanner';
import { getBannerOverlayStyle } from '../utils/bannerOverlay';
import './FoodCorner.css';

const formatPrice = (price) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(Number(price) || 0);

const SORT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'price-low-high', label: 'Price: Low to High' },
  { value: 'price-high-low', label: 'Price: High to Low' },
  { value: 'name-az', label: 'Name: A-Z' },
  { value: 'name-za', label: 'Name: Z-A' },
  { value: 'newest-first', label: 'Newest First' },
  { value: 'oldest-first', label: 'Oldest First' },
];

const getItemTimestamp = (item) => {
  const value = item.createdAt || item.updatedAt;
  return value ? new Date(value).getTime() : 0;
};

const FoodItemCard = ({ item, onEnquiry }) => {
  const available = item.isAvailable !== false && (item.stock ?? 0) > 0;

  return (
    <article className="fc-card">
      <div className="fc-card-image-wrap">
        <img
          src={getImageUrl(item.image)}
          alt={item.name}
          className="fc-card-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600';
          }}
        />
        {item.badge && <span className="fc-card-badge">{item.badge}</span>}
      </div>
      <div className="fc-card-body">
        <h3 className="fc-card-title">{item.name}</h3>
        {item.description && <p className="fc-card-desc">{item.description}</p>}
        <p className="fc-card-time">
          <FaRegClock aria-hidden="true" />
          Available: {item.displayTime || 'All Day'}
        </p>
        <div className="fc-card-footer">
          <div className="fc-card-meta">
            <span className="fc-card-price">{formatPrice(item.price)}</span>
            <span className={`fc-card-status ${available ? 'available' : 'unavailable'}`}>
              {available ? 'Available' : 'Unavailable'}
            </span>
          </div>
          <button
            type="button"
            className="fc-enquiry-btn"
            onClick={() => onEnquiry(item)}
            disabled={!available}
          >
            Enquiry Now
          </button>
        </div>
      </div>
    </article>
  );
};

const FoodCorner = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'all';
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('default');
  const { openEnquiry } = useEnquiry();
  const { cmsData } = useCMS();
  const { banner: pageBanner, loading: bannerLoading } = usePageBanner('food-corner');
  const foodCornerHours = cmsData?.foodCornerTimings || '';

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let active = true;

    foodCornerService
      .getCategories()
      .then((list) => {
        if (active) setCategories(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.error('Failed to load Food Corner categories', err);
        if (active) setCategories([]);
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);

    foodCornerService
      .getItems(activeCategory)
      .then((list) => {
        if (active) setItems(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        if (active) {
          setLoadError(err.message || 'Failed to load Food Corner menu.');
          setItems([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [activeCategory]);

  const handleCategoryClick = (slug) => {
    if (slug === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category: slug });
    }
  };

  const handleEnquiry = (item) => {
    openEnquiry({
      name: item.name,
      category: item.categoryName || item.categoryId,
      sku: item.id,
      id: item.id,
      enquirySource: 'food-corner',
      initialMessage: `I would like to enquire about:\n${item.name}`,
    });
  };

  const filteredItems = useMemo(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) {
      return items;
    }

    const query = debouncedSearchTerm.toLowerCase();
    return items.filter((item) => {
      const name = (item.name || '').toLowerCase();
      const category = (item.categoryName || '').toLowerCase();
      const description = (item.description || '').toLowerCase();
      return (
        name.includes(query) ||
        category.includes(query) ||
        description.includes(query)
      );
    });
  }, [items, debouncedSearchTerm]);

  const sortedItems = useMemo(() => {
    const list = [...filteredItems];

    switch (sortOption) {
      case 'price-low-high':
        return list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
      case 'price-high-low':
        return list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
      case 'name-az':
        return list.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
      case 'name-za':
        return list.sort((a, b) => (b.name || '').localeCompare(a.name || '', undefined, { sensitivity: 'base' }));
      case 'newest-first':
        return list.sort((a, b) => getItemTimestamp(b) - getItemTimestamp(a));
      case 'oldest-first':
        return list.sort((a, b) => getItemTimestamp(a) - getItemTimestamp(b));
      default:
        return list;
    }
  }, [filteredItems, sortOption]);

  const hasNoSearchResults = !loading && !loadError && items.length > 0 && sortedItems.length === 0;

  return (
    <div className="food-corner-page">
      <section className={`fc-hero${bannerLoading ? ' fc-hero--loading' : ''}`}>
        <div
          className="fc-hero-bg"
          style={{ backgroundImage: `url('${getImageUrl(pageBanner.image)}')` }}
          aria-hidden="true"
        />
        <div className="fc-hero-overlay" style={getBannerOverlayStyle(pageBanner)} />
        <div className="container fc-hero-grid">
          <div className="fc-hero-copy">
            <span className="fc-hero-badge">
              <FaUtensils aria-hidden="true" />
              {pageBanner.badgeText || 'FOOD CORNER'}
            </span>
            <h1 className="fc-hero-title">
              {pageBanner.mainHeading || 'Enjoy Delicious'}
              <br />
              <span className="fc-hero-highlight">{pageBanner.highlightText || 'Food Corner'}</span>
            </h1>
            <p className="fc-hero-subtitle">
              {pageBanner.description ||
                'Freshly prepared meals, snacks and beverages made with quality ingredients, every day.'}
            </p>
            <ul className="fc-hero-features">
              <li>
                <span className="fc-feature-icon fc-feature-icon--green" aria-hidden="true">
                  <FaLeaf />
                </span>
                Fresh Ingredients
              </li>
              <li>
                <span className="fc-feature-icon fc-feature-icon--orange" aria-hidden="true">
                  <GiCook />
                </span>
                Hygienic Preparation
              </li>
              <li>
                <span className="fc-feature-icon fc-feature-icon--green" aria-hidden="true">
                  <FaHeart />
                </span>
                Great Taste
              </li>
            </ul>
          </div>

          <aside className="fc-hours-card" aria-label="Food Corner operating hours">
            <div className="fc-hours-panel fc-hours-panel--weekend">
              <div className="fc-hours-icon fc-hours-icon--green" aria-hidden="true">
                <FaCalendarAlt />
              </div>
              <div className="fc-hours-content">
                <span className="fc-hours-label fc-hours-label--green">Weekend Dining Hours</span>
                <strong className="fc-hours-time">{foodCornerHours}</strong>
                <span className="fc-hours-note">Saturday &amp; Sunday</span>
              </div>
            </div>

            <div className="fc-hours-divider" aria-hidden="true" />

            <div className="fc-hours-panel fc-hours-panel--weekday">
              <div className="fc-hours-icon fc-hours-icon--orange" aria-hidden="true">
                <FaBell />
              </div>
              <div className="fc-hours-content">
                <span className="fc-hours-label fc-hours-label--orange">Weekday Service</span>
                <strong className="fc-hours-time">Coming Soon</strong>
                <span className="fc-hours-note">We&apos;re preparing something special for you</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="fc-menu-section">
        <div className="container">
          <div className="fc-category-tabs" role="tablist" aria-label="Food categories">
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === 'all'}
              className={`fc-tab ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => handleCategoryClick('all')}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug || cat.id}
                type="button"
                role="tab"
                aria-selected={activeCategory === (cat.slug || cat.id)}
                className={`fc-tab ${activeCategory === (cat.slug || cat.id) ? 'active' : ''}`}
                onClick={() => handleCategoryClick(cat.slug || cat.id)}
              >
                {cat.icon && <span className="fc-tab-icon">{cat.icon}</span>}
                {cat.categoryName || cat.name}
              </button>
            ))}
          </div>

          <div className="fc-toolbar">
            <label className="fc-search-wrap">
              <FaSearch className="fc-search-icon" aria-hidden="true" />
              <input
                type="search"
                className="fc-search-input"
                placeholder="Search food items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search food items"
              />
            </label>
            <label className="fc-sort-wrap">
              <span className="fc-sort-label">Sort By</span>
              <select
                className="fc-sort-select"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                aria-label="Sort food items"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {loading ? (
            <div className="fc-grid fc-grid-loading">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="fc-card fc-card-skeleton" />
              ))}
            </div>
          ) : loadError ? (
            <p className="fc-empty">{loadError}</p>
          ) : items.length === 0 ? (
            <div className="fc-empty-wrap">
              <FaUtensils className="fc-empty-icon" aria-hidden="true" />
              <p className="fc-empty">No food items available at the moment.</p>
            </div>
          ) : hasNoSearchResults ? (
            <div className="fc-empty-wrap">
              <span className="fc-empty-emoji" aria-hidden="true">🔍</span>
              <p className="fc-empty">No food items found</p>
              <p className="fc-empty-sub">Try another search term or category.</p>
            </div>
          ) : (
            <div className="fc-grid">
              {sortedItems.map((item) => (
                <FoodItemCard key={item.id} item={item} onEnquiry={handleEnquiry} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default FoodCorner;
