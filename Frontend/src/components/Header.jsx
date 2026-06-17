import { useState } from 'react';
import { FiSearch, FiX, FiMenu } from 'react-icons/fi';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCMS } from '../context/CMSContext';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../services/api';
import './Header.css';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  
  const { cmsData } = useCMS();
  const { user } = useAuth();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Hide public header on all admin console routes
  if (path.startsWith('/admin')) return null;

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

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
              <li><Link to="/about" onClick={closeMobileMenu} className={`nav-link ${path === '/about' ? 'active' : ''}`}>About Us</Link></li>
              <li><Link to="/faq" onClick={closeMobileMenu} className={`nav-link ${path === '/faq' ? 'active' : ''}`}>FAQ</Link></li>
              <li><Link to="/contact" onClick={closeMobileMenu} className={`nav-link ${path === '/contact' ? 'active' : ''}`}>Contact Us</Link></li>
              <li className="mobile-only-link"><a href={cmsData.socials?.whatsapp || 'https://wa.me/31612345678'} target="_blank" rel="noreferrer" onClick={closeMobileMenu} className="nav-link">Enquiry</a></li>
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
              {user ? (
                <Link to="/admin/dashboard" className="auth-nav-btn" style={{ background: 'var(--dark-blue)', color: 'white', marginRight: '8px' }}>Dashboard</Link>
              ) : null}
              <a href={cmsData.socials?.whatsapp || 'https://wa.me/31612345678'} target="_blank" rel="noreferrer" className="auth-nav-btn">Enquiry</a>
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
