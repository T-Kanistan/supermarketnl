import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaWhatsapp, FaThLarge, FaShoppingCart, FaPepperHot, 
  FaLeaf, FaAppleAlt, FaSnowflake
} from 'react-icons/fa';
import productService from '../services/productService';
import categoryService from '../services/categoryService';
import { getImageUrl } from '../services/api';
import { useEnquiry } from '../context/EnquiryContext';
import './ProductsPage.css';

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
  const searchQuery = searchParams.get('search') || '';

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState(categoryParam);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortType, setSortType] = useState('default');

  // Load Categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const list = await categoryService.getCategories();
        const activeOnly = list.filter(c => c.status === 'active');
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

  // Load products based on query params
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const list = await productService.getProducts({
          categoryId: activeCategoryId,
          search: searchQuery,
          status: 'active',
          type: 'grocery' // only show supermarket items on this page
        });

        // Apply client sorting if needed
        let sorted = [...list];
        if (sortType === 'name-asc') {
          sorted.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortType === 'name-desc') {
          sorted.sort((a, b) => b.name.localeCompare(a.name));
        }
        setProducts(sorted);
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [activeCategoryId, searchQuery, sortType]);

  useEffect(() => {
    let isMounted = true;
    const updateCategory = async () => {
      await Promise.resolve();
      if (isMounted && categoryParam) {
        setActiveCategoryId(categoryParam);
        setCurrentPage(1);
      }
    };
    updateCategory();
    return () => { isMounted = false; };
  }, [categoryParam]);

  const activeCategory = categories.find(c => c.id === activeCategoryId) || {
    id: 'all',
    name: 'All Items',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1600'
  };

  const handleCategoryClick = (id) => {
    setActiveCategoryId(id);
    setCurrentPage(1);
    navigate(id === 'all' ? '/products' : `/products?category=${id}`);
  };

  // Pagination Logic
  const itemsPerPage = 12;
  const totalPages = Math.ceil(products.length / itemsPerPage) || 1;

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

  return (
    <div className="products-page">
      {/* Dynamic Banner */}
      <div 
        className="page-banner" 
        style={{ 
          backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.8), rgba(0,0,0,0.3)), url('${getImageUrl(activeCategory.bannerImage)}')` 
        }}
      >
        <div className="container">
          <div className="page-banner-content">
            <h1 className="page-banner-title">{activeCategory.name === 'All Items' ? 'OUR PRODUCTS' : activeCategory.name.toUpperCase()}</h1>
            <div className="breadcrumb">
              <Link to="/">Home</Link> <span className="breadcrumb-separator">&gt;</span> Products
              {activeCategory.id !== 'all' && (
                <> <span className="breadcrumb-separator">&gt;</span> {activeCategory.name}</>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="products-layout">
          {/* Sidebar Filter System */}
          <aside className="sidebar">
            <div className="sidebar-box">
              <h3 className="sidebar-title">CATEGORIES</h3>
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
            
            {/* Simple Toolbar */}
            <div className="products-toolbar-simple">
              <div className="results-count">
                Showing {products.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, products.length)} of {products.length} products
              </div>
              <div className="sort-control">
                <label htmlFor="sort">Sort by:</label>
                <select id="sort" value={sortType} onChange={(e) => setSortType(e.target.value)}>
                  <option value="default">Featured</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                </select>
              </div>
            </div>

            {/* Product Grid */}
            {loading ? (
              <div className="products-page-grid">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="product-card-simple skeleton-card" style={{ height: '300px', background: 'white', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ height: '150px', background: '#f1f5f9', borderRadius: '8px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                    <div style={{ height: '18px', width: '80%', background: '#f1f5f9', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                    <div style={{ height: '32px', background: '#f1f5f9', borderRadius: '8px', animation: 'pulse 1.5s infinite ease-in-out', marginTop: 'auto' }}></div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="products-page-grid">
                {products.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(product => (
                  <div className="product-card-simple" key={product.id}>
                    <div className="product-img-wrapper">
                      {product.weight && <div className="product-weight-badge">{product.weight}</div>}
                      <img 
                        src={getImageUrl(product.image)} 
                        alt={product.name} 
                        className="product-img-simple"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800'; }}
                      />
                    </div>
                    
                    <div className="product-details">
                      <h3 className="product-name-simple">{product.name}</h3>
                      <div className={`product-availability ${product.stock > 0 ? 'available' : 'unavailable'}`}>
                        <span className={`status-dot ${product.stock > 0 ? 'green' : 'red'}`}></span>
                        {product.stock > 0 ? 'Available' : 'Currently Unavailable'}
                      </div>
                      <button 
                        className={`enquiry-btn-simple ${product.stock === 0 ? 'disabled' : ''}`} 
                        aria-label="Enquire about product"
                        disabled={product.stock === 0}
                        title={product.stock === 0 ? "Enquiry is unavailable because this product is currently out of stock." : "Open product enquiry form"}
                        onClick={() => handleEnquiry(product)}
                      >
                        <FaWhatsapp className="whatsapp-icon" /> {product.stock > 0 ? 'Enquiry' : 'Currently Unavailable'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-products-found">
                <h3>No products found!</h3>
                <p>We couldn't find any products matching your search.</p>
                <button 
                  className="auth-nav-btn" 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '15px' }}
                  onClick={() => openEnquiry({
                    name: searchQuery || '',
                    category: '',
                    initialMessage: searchQuery
                      ? `I searched for "${searchQuery}" on your website but could not find it. Can you help me order it?`
                      : 'I am looking for a product that is not listed on your website. Can you help me?',
                  })}
                >
                  <FaWhatsapp /> Request Product
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
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
