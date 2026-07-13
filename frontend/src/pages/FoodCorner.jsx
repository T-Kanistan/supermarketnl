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
import { buildFoodAlt } from '../utils/seoImageAlt';
import { formatCategoryName } from '../utils/formatCategoryName';
import Fuse from 'fuse.js';
import { useEnquiry } from '../context/EnquiryContext';
import { useCMS } from '../context/CMSContext';
import usePageBanner from '../hooks/usePageBanner';
import FoodCornerCategoryIcon from '../components/FoodCornerCategoryIcon';
import BusinessHoursDisplay from '../components/BusinessHoursDisplay';
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

/** Lowercase and strip spaces, hyphens, and special characters. */
const normalizeSearchText = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const levenshteinDistance = (a, b, maxDistance = Infinity) => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const lengthDiff = Math.abs(a.length - b.length);
  if (lengthDiff > maxDistance) return maxDistance + 1;
  let prev = new Array(b.length + 1);
  let curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) prev[j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      rowMin = Math.min(rowMin, curr[j]);
    }
    if (rowMin > maxDistance) return maxDistance + 1;
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
};

const getHighlightEditLimit = (term) => {
  const len = term.length;
  if (len <= 2) return 0;
  if (len <= 5) return 1;
  return 2;
};

const highlightLevenshtein = (a, b, maxDistance = Infinity) =>
  levenshteinDistance(a, b, maxDistance);

const getSearchWords = (text) =>
  String(text || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map(normalizeSearchText);

/** Allowed edits: 1 for short queries, 2 for longer (typos like briyani ↔ biryani). */
const getMaxEditDistance = (queryLength) => (queryLength <= 2 ? 1 : 2);

const hasExactPartialMatch = (candidate, normalizedQuery) =>
  Boolean(candidate) &&
  (candidate.includes(normalizedQuery) || candidate.startsWith(normalizedQuery));

/** Edit-distance match; requires the same first character to avoid weak hits. */
const hasFuzzyNameMatch = (candidate, normalizedQuery, maxDist) => {
  if (!candidate || candidate[0] !== normalizedQuery[0]) return false;

  if (
    Math.abs(candidate.length - normalizedQuery.length) <= maxDist &&
    levenshteinDistance(candidate, normalizedQuery, maxDist) <= maxDist
  ) {
    return true;
  }

  if (candidate.length >= normalizedQuery.length - maxDist) {
    const prefixLen = Math.min(
      candidate.length,
      normalizedQuery.length + (normalizedQuery.length <= 2 ? 0 : 1)
    );
    const prefix = candidate.slice(0, prefixLen);
    if (
      prefix.length > 0 &&
      levenshteinDistance(prefix, normalizedQuery, maxDist) <= maxDist
    ) {
      return true;
    }
  }

  return false;
};

/**
 * True only when the query is a real partial/typo match.
 * - All fields: exact substring / prefix (normalized)
 * - Name only: Levenshtein ≤ 2 (rejects weak Fuse hits like Rolls for "briyani")
 */
const isRelevantMatch = (item, normalizedQuery) => {
  if (!normalizedQuery) return true;

  const maxDist = getMaxEditDistance(normalizedQuery.length);
  const nameCandidates = [
    ...new Set([
      normalizeSearchText(item.name),
      ...getSearchWords(item.name),
    ]),
  ].filter(Boolean);

  const otherCandidates = [
    ...new Set([
      normalizeSearchText(item.categoryName || item.category),
      normalizeSearchText(item.description),
      ...getSearchWords(item.categoryName || item.category),
      ...getSearchWords(item.description),
    ]),
  ].filter(Boolean);

  if (
    [...nameCandidates, ...otherCandidates].some((candidate) =>
      hasExactPartialMatch(candidate, normalizedQuery)
    )
  ) {
    return true;
  }

  return nameCandidates.some((candidate) =>
    hasFuzzyNameMatch(candidate, normalizedQuery, maxDist)
  );
};


const HighlightText = ({ text, search }) => {
  if (!search || !text) return <span>{text}</span>;

  const searchTokens = search.toLowerCase().split(' ').filter(Boolean);
  if (searchTokens.length === 0) return <span>{text}</span>;

  const intervals = [];
  const lowerText = text.toLowerCase();

  // Find word boundaries and check for exact/prefix/fuzzy match
  const wordRegex = /[a-z0-9]+/g;
  let match;
  while ((match = wordRegex.exec(lowerText)) !== null) {
    const word = match[0];
    const start = match.index;
    const end = start + word.length;

    const matchesToken = searchTokens.some((token) => {
      if (word.startsWith(token) || token.startsWith(word)) return true;
      const limit = getHighlightEditLimit(token);
      if (limit > 0 && highlightLevenshtein(token, word, limit) <= limit) return true;
      return false;
    });

    if (matchesToken) {
      intervals.push({ start, end });
    }
  }

  // Fallback to exact index matching for substrings
  for (const token of searchTokens) {
    let idx = lowerText.indexOf(token);
    while (idx !== -1) {
      intervals.push({ start: idx, end: idx + token.length });
      idx = lowerText.indexOf(token, idx + 1);
    }
  }

  if (intervals.length === 0) return <span>{text}</span>;

  intervals.sort((a, b) => a.start - b.start);
  const merged = [];
  let current = intervals[0];

  for (let i = 1; i < intervals.length; i++) {
    const next = intervals[i];
    if (next.start <= current.end) {
      current.end = Math.max(current.end, next.end);
    } else {
      merged.push(current);
      current = next;
    }
  }
  merged.push(current);

  const result = [];
  let lastIdx = 0;

  merged.forEach((interval, index) => {
    if (interval.start > lastIdx) {
      result.push(text.slice(lastIdx, interval.start));
    }
    result.push(
      <mark key={index} className="fc-search-highlight">
        {text.slice(interval.start, interval.end)}
      </mark>
    );
    lastIdx = interval.end;
  });

  if (lastIdx < text.length) {
    result.push(text.slice(lastIdx));
  }

  return <span>{result}</span>;
};

const FoodItemCard = ({ item, onEnquiry, searchTerm }) => {
  const available = item.isAvailable !== false && (item.stock ?? 0) > 0;

  return (
    <article className="fc-card">
      <div className="fc-card-image-wrap">
        <img
          src={getImageUrl(item.image)}
          alt={buildFoodAlt(item.name)}
          className="fc-card-image"
          loading="lazy"
          decoding="async"
          width="400"
          height="300"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600';
          }}
        />
        {item.badge && <span className="fc-card-badge">{item.badge}</span>}
      </div>
      <div className="fc-card-body">
        <h3 className="fc-card-title">
          <HighlightText text={item.name} search={searchTerm} />
        </h3>
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
  const [sortOption, setSortOption] = useState('default');
  const { openEnquiry } = useEnquiry();
  const { cmsData, loading: cmsLoading } = useCMS();
  const {
    banner: pageBanner,
    heroImageUrl,
    ready: bannerReady,
  } = usePageBanner('food-corner');
  const foodCornerHours = cmsData?.foodCornerTimings || '';

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
      category: formatCategoryName(item.categoryName || item.categoryId),
      sku: item.id,
      id: item.id,
      enquirySource: 'food-corner',
      initialMessage: `I would like to enquire about:\n${item.name}`,
    });
  };

  // Fuse indexes normalized name/category/description; original item kept for display.
  const foodItems = useMemo(
    () =>
      items.map((item) => ({
        original: item,
        name: normalizeSearchText(item.name),
        category: normalizeSearchText(item.categoryName || item.category || ''),
        description: normalizeSearchText(item.description || ''),
      })),
    [items]
  );

  const fuse = useMemo(
    () =>
      new Fuse(foodItems, {
        keys: ['name', 'category', 'description'],
        threshold: 0.5,
        ignoreLocation: true,
        includeScore: true,
        findAllMatches: true,
        minMatchCharLength: 1,
      }),
    [foodItems]
  );

  const filteredItems = useMemo(() => {
    const query = searchTerm;
    const normalizedQuery = normalizeSearchText(query);

    console.log('Search:', query);
    console.log('Normalized:', normalizedQuery);

    if (!normalizedQuery) {
      console.log('Fuse Results:', []);
      return items;
    }

    const results = fuse.search(normalizedQuery);
    console.log('Fuse Results:', results);

    // Keep Fuse ranking, but drop weak/irrelevant hits (e.g. Rolls for "briyani")
    const fuseMatches = results
      .map((result) => result.item.original)
      .filter((item) => isRelevantMatch(item, normalizedQuery));

    if (fuseMatches.length > 0) {
      return fuseMatches;
    }

    // Second pass: Levenshtein / partial match across all items
    return items.filter((item) => isRelevantMatch(item, normalizedQuery));
  }, [items, fuse, searchTerm]);

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
      <section className={`fc-hero${bannerReady ? '' : ' fc-hero--loading'}`}>
        {bannerReady ? (
          <>
            <div
              className="fc-hero-bg"
              style={{ backgroundImage: `url('${heroImageUrl}')` }}
              aria-hidden="true"
            />
            <div className="fc-hero-overlay" style={getBannerOverlayStyle(pageBanner)} />
            <div className="container fc-hero-grid">
              <div className="fc-hero-copy">
                <span className="fc-hero-badge">
                  <FaUtensils aria-hidden="true" />
                  {pageBanner.badgeText}
                </span>
                <h1 className="fc-hero-title">
                  {pageBanner.title || pageBanner.mainHeading}
                  {pageBanner.highlightedTitle || pageBanner.highlightText ? (
                    <>
                      <br />
                      <span className="fc-hero-highlight">
                        {pageBanner.highlightedTitle || pageBanner.highlightText}
                      </span>
                    </>
                  ) : null}
                </h1>
                <p className="fc-hero-subtitle">{pageBanner.description}</p>
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
                    <BusinessHoursDisplay
                      value={foodCornerHours}
                      loading={cmsLoading}
                      className="fc-hours-time"
                    />
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
          </>
        ) : (
          <div className="fc-hero-skeleton" aria-hidden="true">
            <div className="fc-hero-skeleton-shimmer" />
          </div>
        )}
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
                {cat.icon ? (
                  <FoodCornerCategoryIcon
                    icon={cat.icon}
                    className="fc-tab-icon"
                    imgClassName="fc-tab-icon-img"
                    alt=""
                  />
                ) : null}
                {formatCategoryName(cat.categoryName || cat.name)}
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
              <p className="fc-empty">No food items found.</p>
              <p className="fc-empty-sub">Try searching with a different keyword.</p>
            </div>
          ) : (
            <div className="fc-grid">
              {sortedItems.map((item) => (
                <FoodItemCard key={item.id} item={item} onEnquiry={handleEnquiry} searchTerm={searchTerm} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default FoodCorner;
