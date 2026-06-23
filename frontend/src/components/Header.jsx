import { useState } from 'react';
import { FiSearch, FiX, FiMenu } from 'react-icons/fi';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCMS } from '../context/CMSContext';
import { useEnquiry } from '../context/EnquiryContext';
import { getImageUrl } from '../services/api';
import './Header.css';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  
  const { cmsData } = useCMS();
  const { openEnquiry } = useEnquiry();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (path.startsWith('/admin') || path.startsWith('/manager') || path === '/login') return null;
  if (!cmsData) return null;

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleEnquiryClick = (e) => {
    e.preventDefault();
    closeMobileMenu();
    openEnquiry({ enquirySource: 'general' });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  const handleDashboardClick = () => {
    closeMobileMenu();
    navigate('/login');
  };

  return (
    <header className="header">
      {/* Main Header */}
      <div className="main-header">
        <div className="main-header-content container">
          {/* Logo */}
          <div className="logo-container">
            <Link to="/">
              <img src={getImageUrl(cmsData.logo) || '/logo.png'} alt={cmsData.storeName || 'Ins Wereld Winkel'} className="logo" onError={(e) => { e.target.src = '/logo.png'; }} />
            </Link>
          </div>

          {/* Navigation */}
          <nav className={`navigation ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            <ul className="nav-list">
              <li><Link to="/" onClick={closeMobileMenu} className={`nav-link ${path === '/' ? 'active' : ''}`}>Home</Link></li>
              <li><Link to="/products" onClick={closeMobileMenu} className={`nav-link ${path === '/products' ? 'active' : ''}`}>Products</Link></li>
              <li><Link to="/food-corner" onClick={closeMobileMenu} className={`nav-link ${path === '/food-corner' ? 'active' : ''}`}>Food Corner</Link></li>
              <li><Link to="/offers" onClick={closeMobileMenu} className={`nav-link ${path === '/offers' ? 'active' : ''}`}>Offers</Link></li>
              <li><Link to="/vacancies" onClick={closeMobileMenu} className={`nav-link ${path === '/vacancies' ? 'active' : ''}`}>Vacancies</Link></li>
              <li><Link to="/about" onClick={closeMobileMenu} className={`nav-link ${path === '/about' ? 'active' : ''}`}>About Us</Link></li>
              <li><Link to="/faq" onClick={closeMobileMenu} className={`nav-link ${path === '/faq' ? 'active' : ''}`}>FAQ</Link></li>
              <li><Link to="/contact" onClick={closeMobileMenu} className={`nav-link ${path === '/contact' ? 'active' : ''}`}>Contact Us</Link></li>
              <li className="mobile-only-link">
                <button type="button" onClick={handleEnquiryClick} className="nav-link nav-link-btn">
                  Enquiry Now
                </button>
              </li>
              <li className="mobile-only-link">
                <button
                  type="button"
                  onClick={handleDashboardClick}
                  className="nav-link nav-link-dashboard nav-link-btn"
                >
                  Dashboard
                </button>
              </li>
            </ul>
          </nav>

          {/* Utilities */}
          <div className="header-utils">
            {isSearchOpen ? (
              <form className="search-form" onSubmit={handleSearchSubmit}>
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Search products..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                <button type="button" className="util-btn close-btn" onClick={toggleSearch} aria-label="Close Search">
                  <FiX />
                </button>
              </form>
            ) : (
              <button className="util-btn" aria-label="Search" onClick={toggleSearch}>
                <FiSearch />
              </button>
            )}
            <div className="auth-buttons">
              <button
                type="button"
                className="auth-nav-btn auth-nav-login auth-nav-dashboard"
                onClick={handleDashboardClick}
              >
                Dashboard
              </button>
              <button
                type="button"
                className="auth-nav-btn auth-nav-apply"
                onClick={handleEnquiryClick}
              >
                Enquiry Now
              </button>
            </div>
            
            <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle Menu">
              {isMobileMenuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
