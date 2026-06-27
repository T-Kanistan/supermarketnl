import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  FaChartBar, FaGlobe, FaImages, FaTags, FaBoxOpen, FaQuestionCircle,
  FaCommentDots, FaBullhorn, FaEnvelopeOpenText, FaUsers, FaUser,
  FaSignOutAlt, FaBars, FaTimes, FaExternalLinkAlt, FaHome, FaUtensils,
  FaKey, FaBriefcase, FaFileContract,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import AccessDenied from '../../components/AccessDenied';
import { canManagerAccessRoute, getDashboardBase, getDashboardRouteSegment } from '../../constants/managerPermissions';
import { useCMS } from '../../context/CMSContext';
import { useToast } from '../../context/ToastContext';
import { getImageUrl } from '../../services/api';
import './AdminDashboardLayout.css';

export const AdminDashboardLayout = () => {
  const { user, logout, isManager, displayName } = useAuth();
  const { cmsData } = useCMS();
  const storeLogo = cmsData?.logo ? getImageUrl(cmsData.logo) : '/logo.png';
  const storeName = cmsData?.storeName || 'Supermarket';
  const { addToast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const contentBodyRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dashboardBase = getDashboardBase(location.pathname);
  const dashboardPath = (suffix = '') => `${dashboardBase}${suffix}`;

  const isRouteActive = (suffix = '') => {
    const path = location.pathname.replace(/\/$/, '');
    const base = dashboardBase.replace(/\/$/, '');
    if (!suffix) return path === base;
    const normalizedSuffix = suffix.startsWith('/') ? suffix : `/${suffix}`;
    return path === `${base}${normalizedSuffix}`;
  };

  const sidebarClass = (suffix = '') =>
    `sidebar-link${isRouteActive(suffix) ? ' active' : ''}`;

  const scrollDashboardToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    contentBodyRef.current?.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  useEffect(() => {
    scrollDashboardToTop();
  }, [location.pathname, location.search]);

  const handleLogout = async () => {
    try {
      await logout();
      addToast('Logged out successfully', 'success');
      navigate('/login');
    } catch (e) {
      console.error('Logout failed', e);
      addToast('Logout failed', 'error');
    }
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const DESKTOP_BREAKPOINT = 992;
    const handleResize = () => {
      if (window.innerWidth > DESKTOP_BREAKPOINT) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    document.body.classList.toggle('admin-drawer-open', mobileMenuOpen);
    return () => document.body.classList.remove('admin-drawer-open');
  }, [mobileMenuOpen]);

  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (location.pathname.endsWith('/products') && params.get('type') === 'food-corner') {
      navigate(`${dashboardBase}/food-corner`, { replace: true });
      return;
    }
    if (location.pathname.includes('/food-corner-items')) {
      navigate(`${dashboardBase}/food-corner`, { replace: true });
    }
  }, [location.pathname, location.search, navigate, dashboardBase]);

  const getHeaderTitle = () => {
    const path = location.pathname;
    if (path.endsWith('/dashboard')) return isManager ? 'Manager Dashboard' : 'Overview Dashboard';
    if (path.includes('/about-us')) return 'About Us Management';
    if (path.includes('/site-settings')) return 'CMS Settings';
    if (path.includes('/homepage-about')) return 'Homepage About Section';
    if (path.includes('/legal-pages')) return 'Legal Pages';
    if (path.includes('/banners')) return 'Banner Management';
    if (path.includes('/food-corner-categories')) return 'Food Corner Categories';
    if (path.endsWith('/food-corner')) return 'Food Corner';
    if (path.includes('/categories')) return 'Catalog Categories';
    if (path.includes('/products')) return 'Catalog Products';
    if (path.includes('/faqs')) return 'FAQs Board';
    if (path.includes('/testimonials')) return 'Testimonials Board';
    if (path.includes('/announcements')) return 'Offers Management';
    if (path.includes('/messages')) return 'Customer Enquiries';
    if (path.includes('/vacancies')) return 'Vacancy Management';
    if (path.includes('/job-applications')) return 'Job Applications';
    if (path.includes('/managers')) return 'Manager User Accounts';
    if (path.includes('/profile')) return 'My Account Settings';
    return isManager ? 'Manager Panel' : 'Admin Panel';
  };

  const renderAdminSidebar = () => (
    <>
      <div className="menu-section-title">CMS Management</div>
      <NavLink to={dashboardPath('/about-us')} className={() => sidebarClass('/about-us')} onClick={closeMobileMenu}>
        <FaGlobe className="sidebar-link-icon" />
        <span>About Us Management</span>
      </NavLink>
      <NavLink to={dashboardPath('/site-settings')} className={() => sidebarClass('/site-settings')} onClick={closeMobileMenu}>
        <FaGlobe className="sidebar-link-icon" />
        <span>Site Settings</span>
      </NavLink>
      <NavLink to={dashboardPath('/homepage-about')} className={() => sidebarClass('/homepage-about')} onClick={closeMobileMenu}>
        <FaHome className="sidebar-link-icon" />
        <span>Homepage About Section</span>
      </NavLink>
      <NavLink to={dashboardPath('/legal-pages')} className={() => sidebarClass('/legal-pages')} onClick={closeMobileMenu}>
        <FaFileContract className="sidebar-link-icon" />
        <span>Legal Pages</span>
      </NavLink>

      <div className="menu-section-title">Content Management</div>
      <NavLink to={dashboardPath('/banners')} className={() => sidebarClass('/banners')} onClick={closeMobileMenu}>
        <FaImages className="sidebar-link-icon" />
        <span>Banner Management</span>
      </NavLink>

      <div className="menu-section-title">Catalog</div>
      <NavLink to={dashboardPath('/categories')} className={() => sidebarClass('/categories')} onClick={closeMobileMenu}>
        <FaTags className="sidebar-link-icon" />
        <span>Categories</span>
      </NavLink>
      <NavLink to={dashboardPath('/products')} className={() => sidebarClass('/products')} onClick={closeMobileMenu}>
        <FaBoxOpen className="sidebar-link-icon" />
        <span>Products</span>
      </NavLink>

      <div className="menu-section-title">Food Corner</div>
      <NavLink to={dashboardPath('/food-corner-categories')} className={() => sidebarClass('/food-corner-categories')} onClick={closeMobileMenu}>
        <FaUtensils className="sidebar-link-icon" />
        <span>Food Corner Categories</span>
      </NavLink>
      <NavLink to={dashboardPath('/food-corner')} className={() => sidebarClass('/food-corner')} onClick={closeMobileMenu}>
        <FaUtensils className="sidebar-link-icon" />
        <span>Food Corner Items</span>
      </NavLink>

      <div className="menu-section-title">Content</div>
      <NavLink to={dashboardPath('/faqs')} className={() => sidebarClass('/faqs')} onClick={closeMobileMenu}>
        <FaQuestionCircle className="sidebar-link-icon" />
        <span>FAQ</span>
      </NavLink>
      <NavLink to={dashboardPath('/testimonials')} className={() => sidebarClass('/testimonials')} onClick={closeMobileMenu}>
        <FaCommentDots className="sidebar-link-icon" />
        <span>Testimonials</span>
      </NavLink>
      <NavLink to={dashboardPath('/announcements')} className={() => sidebarClass('/announcements')} onClick={closeMobileMenu}>
        <FaBullhorn className="sidebar-link-icon" />
        <span>Announcements</span>
      </NavLink>

      <div className="menu-section-title">Messages</div>
      <NavLink to={dashboardPath('/messages')} className={() => sidebarClass('/messages')} onClick={closeMobileMenu}>
        <FaEnvelopeOpenText className="sidebar-link-icon" />
        <span>Contact Messages</span>
      </NavLink>
      <NavLink to={dashboardPath('/vacancies')} className={() => sidebarClass('/vacancies')} onClick={closeMobileMenu}>
        <FaBriefcase className="sidebar-link-icon" />
        <span>Vacancy Management</span>
      </NavLink>
      <NavLink to={dashboardPath('/job-applications')} className={() => sidebarClass('/job-applications')} onClick={closeMobileMenu}>
        <FaBriefcase className="sidebar-link-icon" />
        <span>Job Applications</span>
      </NavLink>

      <div className="menu-section-title">User Management</div>
      <NavLink to={dashboardPath('/managers')} className={() => sidebarClass('/managers')} onClick={closeMobileMenu}>
        <FaUsers className="sidebar-link-icon" />
        <span>Managers</span>
      </NavLink>
    </>
  );

  const renderManagerSidebar = () => (
    <>
      <div className="menu-section-title">Catalog</div>
      <NavLink to={dashboardPath('/products')} className={() => sidebarClass('/products')} onClick={closeMobileMenu}>
        <FaBoxOpen className="sidebar-link-icon" />
        <span>Products</span>
      </NavLink>

      <div className="menu-section-title">Food Corner</div>
      <NavLink to={dashboardPath('/food-corner')} className={() => sidebarClass('/food-corner')} onClick={closeMobileMenu}>
        <FaUtensils className="sidebar-link-icon" />
        <span>Food Corner Items</span>
      </NavLink>

      <div className="menu-section-title">Offers</div>
      <NavLink to={dashboardPath('/announcements')} className={() => sidebarClass('/announcements')} onClick={closeMobileMenu}>
        <FaBullhorn className="sidebar-link-icon" />
        <span>Offers Management</span>
      </NavLink>

      <div className="menu-section-title">Messages</div>
      <NavLink to={dashboardPath('/messages')} className={() => sidebarClass('/messages')} onClick={closeMobileMenu}>
        <FaEnvelopeOpenText className="sidebar-link-icon" />
        <span>Customer Enquiries</span>
      </NavLink>
      <NavLink to={dashboardPath('/vacancies')} className={() => sidebarClass('/vacancies')} onClick={closeMobileMenu}>
        <FaBriefcase className="sidebar-link-icon" />
        <span>Vacancy Management</span>
      </NavLink>
      <NavLink to={dashboardPath('/job-applications')} className={() => sidebarClass('/job-applications')} onClick={closeMobileMenu}>
        <FaBriefcase className="sidebar-link-icon" />
        <span>Job Applications</span>
      </NavLink>

      <div className="menu-section-title">Content Management</div>
      <NavLink to={dashboardPath('/banners')} className={() => sidebarClass('/banners')} onClick={closeMobileMenu}>
        <FaImages className="sidebar-link-icon" />
        <span>Banner Management</span>
      </NavLink>
      <NavLink to={dashboardPath('/homepage-about')} className={() => sidebarClass('/homepage-about')} onClick={closeMobileMenu}>
        <FaHome className="sidebar-link-icon" />
        <span>Homepage About Section</span>
      </NavLink>
      <NavLink to={dashboardPath('/faqs')} className={() => sidebarClass('/faqs')} onClick={closeMobileMenu}>
        <FaQuestionCircle className="sidebar-link-icon" />
        <span>FAQ</span>
      </NavLink>
      <NavLink to={dashboardPath('/testimonials')} className={() => sidebarClass('/testimonials')} onClick={closeMobileMenu}>
        <FaCommentDots className="sidebar-link-icon" />
        <span>Testimonials</span>
      </NavLink>
    </>
  );

  return (
    <div className="admin-layout">
      {mobileMenuOpen && (
        <button
          type="button"
          className="admin-sidebar-backdrop"
          aria-label="Close navigation menu"
          onClick={closeMobileMenu}
        />
      )}
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img src={storeLogo} alt="Store Logo" className="sidebar-logo" onError={(e) => { e.target.src = '/logo.png'; }} />
          <span className="sidebar-brand-name">{storeName}</span>
        </div>

        <nav className="sidebar-menu">
          <NavLink to={dashboardBase} className={() => sidebarClass()} onClick={closeMobileMenu}>
            <FaChartBar className="sidebar-link-icon" />
            <span>Dashboard</span>
          </NavLink>

          {isManager ? renderManagerSidebar() : renderAdminSidebar()}

          <div className="menu-section-title">Account</div>
          <NavLink to={dashboardPath('/profile')} className={() => sidebarClass('/profile')} onClick={closeMobileMenu}>
            <FaUser className="sidebar-link-icon" />
            <span>My Profile</span>
          </NavLink>
          <NavLink to={dashboardPath('/change-password')} className={() => sidebarClass('/change-password')} onClick={closeMobileMenu}>
            <FaKey className="sidebar-link-icon" />
            <span>Change Password</span>
          </NavLink>
          <button type="button" className="sidebar-link" onClick={handleLogout} style={{ border: 'none', background: 'transparent', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
            <FaSignOutAlt className="sidebar-link-icon" />
            <span>Logout</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="user-avatar-placeholder">
              {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-info">
              <span className="user-name">{displayName || 'User Account'}</span>
              <span className="user-role">{user?.displayRole || user?.role || 'Staff'}</span>
            </div>
            <button type="button" className="logout-btn-sidebar" onClick={handleLogout} title="Sign Out">
              <FaSignOutAlt />
            </button>
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div className="header-title-area">
            <button
              type="button"
              className="menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Drawer"
            >
              {mobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
            <h1 className="admin-header-title">{getHeaderTitle()}</h1>
          </div>

          <div className="admin-header-right">
            <a href="/" target="_blank" rel="noreferrer" className="store-live-btn" title="View Storefront">
              <span className="store-live-btn-label">View Storefront</span>
              <FaExternalLinkAlt style={{ fontSize: '0.75rem' }} />
            </a>
          </div>
        </header>

        <div className="admin-content-body" ref={contentBodyRef}>
          {isManager && !canManagerAccessRoute(getDashboardRouteSegment(location.pathname)) ? (
            <AccessDenied />
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardLayout;
