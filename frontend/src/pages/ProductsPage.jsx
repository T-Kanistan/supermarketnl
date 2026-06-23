import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaWhatsapp, FaThLarge, FaShoppingCart, FaPepperHot, 
  FaLeaf, FaAppleAlt, FaSnowflake, FaSearch, FaTag, FaAward
} from 'react-icons/fa';
import productService from '../services/productService';
import categoryService from '../services/categoryService';
import { getImageUrl } from '../services/api';
import { useEnquiry } from '../context/EnquiryContext';
import ProductCard from '../components/ProductCard';
import { PRODUCTS_PAGE_HERO_IMAGE } from '../constants/productsPageDefaults';
import usePageBanner from '../hooks/usePageBanner';
import { getBannerOverlayStyle } from '../utils/bannerOverlay';
import '../components/ProductCard.css';
import './ProductsPage.css';

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

// Reusable icon mapper for database categories
const categoryIcons = {
  all: <FaThLarge />,
  grocery: <FaShoppingCart />,
  masala: <FaPepperHot />,
  vegetables: <FaLeaf />,
  sweets: <FaAppleAlt />,
  frozen: <FaSnowflake />,
};

const ProductsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { openEnquiry } = useEnquiry();
  const searchParams = new URLSearchParams(location.search);
  const categoryParam = searchParams.get('category') || 'all';
  const urlSearchParam = searchParams.get('search') || '';

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState(urlSearchParam);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(urlSearchParam.trim());
  const [sortOption, setSortOption] = useState('default');
  const { banner: pageBanner, loading: bannerLoading } = usePageBanner('products');

  const activeCategoryId = categoryParam;

  useEffect(() => {
    setSearchTerm(urlSearchParam);
  }, [urlSearchParam]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load Categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const list = await categoryService.getCategories();
        const activeOnly = (Array.isArray(list) ? list : []).filter(c => c.status === 'active');
        setCategories([
          { id: 'all', name: 'All Items', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1600' },
          ...activeOnly
        ]);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCategories();
  }, []);

  // Load products by category (search and sort handled on the frontend)
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const list = await productService.getProducts({
          categoryId: activeCategoryId,
          status: 'active',
          type: 'grocery',
        });

        const safeList = Array.isArray(list) ? list : [];
        setProducts(safeList);
      } catch (err) {
        console.error('Failed to load products', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [activeCategoryId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryParam, debouncedSearchTerm, sortOption]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const activeCategory = categories.find((c) => c.id === activeCategoryId) || {
    id: 'all',
    name: 'All Items',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1600',
  };

  const buildProductsUrl = (categoryId) => {
    if (categoryId && categoryId !== 'all') {
      return `/products?category=${categoryId}`;
    }
    return '/products';
  };

  const handleCategoryClick = (id) => {
    setCurrentPage(1);
    navigate(buildProductsUrl(id));
  };

  const getProductCategoryName = (product) => {
    const category = categories.find((c) => c.id === product.categoryId);
    return category?.name || product.categoryName || '';
  };

  const filteredItems = useMemo(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) {
      return products;
    }

    const query = debouncedSearchTerm.toLowerCase();
    return products.filter((product) => {
      const name = (product.name || product.productName || '').toLowerCase();
      const category = getProductCategoryName(product).toLowerCase();
      const description = (product.description || product.shortDescription || '').toLowerCase();
      return (
        name.includes(query) ||
        category.includes(query) ||
        description.includes(query)
      );
    });
  }, [products, debouncedSearchTerm, categories]);

  const sortedItems = useMemo(() => {
    const list = [...filteredItems];

    switch (sortOption) {
      case 'price-low-high':
        return list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
      case 'price-high-low':
        return list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
      case 'name-az':
        return list.sort((a, b) =>
          (a.name || a.productName || '').localeCompare(b.name || b.productName || '', undefined, { sensitivity: 'base' })
        );
      case 'name-za':
        return list.sort((a, b) =>
          (b.name || b.productName || '').localeCompare(a.name || a.productName || '', undefined, { sensitivity: 'base' })
        );
      case 'newest-first':
        return list.sort((a, b) => getItemTimestamp(b) - getItemTimestamp(a));
      case 'oldest-first':
        return list.sort((a, b) => getItemTimestamp(a) - getItemTimestamp(b));
      default:
        return list;
    }
  }, [filteredItems, sortOption]);

  // Pagination Logic
  const itemsPerPage = 12;
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage) || 1;
  const paginatedItems = sortedItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const hasNoSearchResults = !loading && products.length > 0 && sortedItems.length === 0;

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleEnquiry = (product) => {
    const categoryObj = categories.find((c) => c.id === product.categoryId);
    openEnquiry({
      name: product.name,
      category: categoryObj?.name || product.categoryId || '',
      sku: product.id,
      id: product.id,
    });
  };

  const isAllItems = activeCategory.id === 'all';
  const heroImage = isAllItems
    ? getImageUrl(pageBanner.image) || PRODUCTS_PAGE_HERO_IMAGE
    : getImageUrl(activeCategory.image) || PRODUCTS_PAGE_HERO_IMAGE;
  const heroBadge = isAllItems ? pageBanner.badgeText || 'OUR STORE' : 'CATEGORY';
  const heroSubtitle = isAllItems
    ? pageBanner.description ||
      'Browse fresh groceries, beverages, spices, and daily essentials from our supermarket.'
    : `Explore our ${activeCategory.name.toLowerCase()} selection — quality products for your home.`;
  const heroOverlayStyle = isAllItems ? getBannerOverlayStyle(pageBanner) : undefined;

  return (
    <div className="products-page">
      <section className={`products-hero${bannerLoading && isAllItems ? ' products-hero--loading' : ''}`}>
        <div
          className="products-hero-bg"
          style={{ backgroundImage: `url('${heroImage}')` }}
          aria-hidden="true"
        />
        <div className="products-hero-overlay" style={heroOverlayStyle} />
        <div className="container products-hero-grid">
          <div className="products-hero-copy">
            <span className="products-hero-badge">
              <FaShoppingCart aria-hidden="true" />
              {heroBadge}
            </span>
            <h1 className="products-hero-title">
              {isAllItems ? (
                <>
                  {pageBanner.mainHeading || 'Our'}
                  <br />
                  <span className="products-hero-highlight">{pageBanner.highlightText || 'Products'}</span>
                </>
              ) : (
                <>
                  {activeCategory.name}
                </>
              )}
            </h1>
            <p className="products-hero-subtitle">{heroSubtitle}</p>
            {isAllItems && (
              <ul className="products-hero-features">
                <li>
                  <span className="products-feature-icon products-feature-icon--green" aria-hidden="true">
                    <FaLeaf />
                  </span>
                  Fresh Groceries
                </li>
                <li>
                  <span className="products-feature-icon products-feature-icon--blue" aria-hidden="true">
                    <FaAward />
                  </span>
                  Premium Quality
                </li>
                <li>
                  <span className="products-feature-icon products-feature-icon--green" aria-hidden="true">
                    <FaShoppingCart />
                  </span>
                  Daily Essentials
                </li>
                <li>
                  <span className="products-feature-icon products-feature-icon--blue" aria-hidden="true">
                    <FaTag />
                  </span>
                  Best Prices
                </li>
              </ul>
            )}
          </div>

          <aside className="products-info-card" aria-label="Store highlights">
            <div className="products-info-panel products-info-panel--primary">
              <div className="products-info-icon products-info-icon--green" aria-hidden="true">
                <FaShoppingCart />
              </div>
              <div className="products-info-content">
                <span className="products-info-label products-info-label--green">Fresh Products Daily</span>
                <strong className="products-info-value">
                  <span className="products-info-value-main">100+</span>
                  <span className="products-info-value-sub">Categories</span>
                </strong>
                <span className="products-info-note">Available Every Day</span>
              </div>
            </div>

            <div className="products-info-divider" aria-hidden="true" />

            <div className="products-info-panel products-info-panel--accent">
              <div className="products-info-icon products-info-icon--blue" aria-hidden="true">
                <FaTag />
              </div>
              <div className="products-info-content">
                <span className="products-info-label products-info-label--blue">Weekly Offers</span>
                <strong className="products-info-value">
                  <span className="products-info-value-main">Special</span>
                  <span className="products-info-value-sub">Discounts</span>
                </strong>
                <span className="products-info-note">Save More Every Week</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <div className="container products-breadcrumb-wrap">
        <nav className="products-hero-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="breadcrumb-separator" aria-hidden="true">&gt;</span>
          {isAllItems ? (
            <span>Products</span>
          ) : (
            <>
              <Link to="/products">Products</Link>
              <span className="breadcrumb-separator" aria-hidden="true">&gt;</span>
              <span>{activeCategory.name}</span>
            </>
          )}
        </nav>
      </div>

      <div className="container">
        <div className="products-layout">
          {/* Sidebar Filter System */}
          <aside className="sidebar">
            <div className="sidebar-box">
              <h3 className="sidebar-title">CATEGORIES</h3>
              <label className="category-mobile-dropdown">
                <span className="category-mobile-label">Category</span>
                <select
                  className="category-mobile-select"
                  value={activeCategoryId}
                  onChange={(e) => handleCategoryClick(e.target.value)}
                  aria-label="Filter products by category"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="category-list">
                {categories.map((cat) => (
                  <button 
                    key={cat.id} 
                    className={`category-item ${activeCategoryId === cat.id ? 'active' : ''}`}
                    onClick={() => handleCategoryClick(cat.id)}
                  >
                    <span className="cat-icon">{categoryIcons[cat.id] || categoryIcons.all}</span>
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="promo-box">
              <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200" alt="Basket" className="promo-img"/>
              <div className="promo-content">
                <strong>Best Quality</strong>
                <span className="promo-highlight">Fresh Products</span>
                <p>Delivered to your door step</p>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="main-content">
            <div className="products-toolbar">
              <label className="products-search-wrap">
                <FaSearch className="products-search-icon" aria-hidden="true" />
                <input
                  type="search"
                  className="products-search-input"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search products"
                />
              </label>
              <label className="products-sort-wrap">
                <span className="products-sort-label">Sort By</span>
                <select
                  className="products-sort-select"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  aria-label="Sort products"
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
              <div className="store-product-grid products-page-grid">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="store-product-skeleton" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="no-products-found">
                <span className="no-products-emoji" aria-hidden="true">🔍</span>
                <h3>No products found</h3>
                <p>Try another search term or category.</p>
                <button
                  type="button"
                  className="auth-nav-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '15px' }}
                  onClick={() => openEnquiry({
                    name: debouncedSearchTerm || '',
                    category: activeCategory.name !== 'All Items' ? activeCategory.name : '',
                    initialMessage: debouncedSearchTerm
                      ? `I searched for "${debouncedSearchTerm}" on your website but could not find it. Can you help me order it?`
                      : 'I am looking for a product that is not listed on your website. Can you help me?',
                  })}
                >
                  <FaWhatsapp /> Request Product
                </button>
              </div>
            ) : hasNoSearchResults ? (
              <div className="no-products-found">
                <span className="no-products-emoji" aria-hidden="true">🔍</span>
                <h3>No products found</h3>
                <p>Try another search term or category.</p>
              </div>
            ) : (
              <div className="store-product-grid products-page-grid">
                {paginatedItems.map((product) => (
                  <ProductCard key={product.id} product={product} onEnquiry={handleEnquiry} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && sortedItems.length > 0 && (
              <div className="pagination">
                <button 
                  className="page-btn" 
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  &lt;
                </button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <button 
                    key={i}
                    className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                    onClick={() => handlePageChange(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}

                <button 
                  className="page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  &gt;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
