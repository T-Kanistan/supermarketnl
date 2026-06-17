import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  FaChartBar, FaGlobe, FaImages, FaTags, FaBoxOpen, FaQuestionCircle, 
  FaCommentDots, FaBullhorn, FaEnvelopeOpenText, FaUsers, FaUser, 
  FaSignOutAlt, FaBars, FaTimes, FaExternalLinkAlt
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useCMS } from '../../context/CMSContext';
import { useToast } from '../../context/ToastContext';
import { getImageUrl } from '../../services/api';
import './AdminDashboardLayout.css';

export const AdminDashboardLayout = () => {
  const { user, logout, isAdmin } = useAuth();
  const { cmsData } = useCMS();
  const { addToast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      addToast('Logged out successfully', 'success');
      navigate('/admin/login');
    } catch (e) {
      console.error('Logout failed', e);
      addToast('Logout failed', 'error');
    }
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Map route pathname to human readable title in header
  const getHeaderTitle = () => {
    const path = location.pathname;
    if (path.endsWith('/dashboard')) return 'Overview Dashboard';
    if (path.includes('/site-settings')) return 'CMS Settings';
    if (path.includes('/banners')) return 'Home Banners';
    if (path.includes('/categories')) return 'Catalog Categories';
    if (path.includes('/products')) return 'Catalog Products';
    if (path.includes('/faqs')) return 'FAQs Board';
    if (path.includes('/testimonials')) return 'Testimonials Board';
    if (path.includes('/announcements')) return 'Announcements & Campaigns';
    if (path.includes('/messages')) return 'Client Contact Enquiries';
    if (path.includes('/managers')) return 'Manager User Accounts';
    if (path.includes('/profile')) return 'My Account Settings';
    return 'Admin Panel';
  };

  return (
    <div className="admin-layout">
      {/* Sidebar Drawer */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img src={getImageUrl(cmsData.logo) || '/logo.png'} alt="Store Logo" className="sidebar-logo" onError={(e) => { e.target.src = '/logo.png'; }} />
          <span className="sidebar-brand-name">{cmsData.storeName || 'Supermarket'}</span>
        </div>

        <nav className="sidebar-menu">
          <NavLink to="/admin/dashboard" end className={({ active }) => `sidebar-link ${active ? 'active' : ''}`} onClick={closeMobileMenu}>
            <FaChartBar className="sidebar-link-icon" />
            <span>Dashboard</span>
          </NavLink>

          <div className="menu-section-title">CMS Management</div>
          <NavLink to="/admin/dashboard/site-settings" className={({ active }) => `sidebar-link ${active ? 'active' : ''}`} onClick={closeMobileMenu}>
            <FaGlobe className="sidebar-link-icon" />
            <span>Site Settings</span>
          </NavLink>
          <NavLink to="/admin/dashboard/banners" className={({ active }) => `sidebar-link ${active ? 'active' : ''}`} onClick={closeMobileMenu}>
            <FaImages className="sidebar-link-icon" />
            <span>Home Banner</span>
          </NavLink>

          <div className="menu-section-title">Catalog</div>
          <NavLink to="/admin/dashboard/categories" className={({ active }) => `sidebar-link ${active ? 'active' : ''}`} onClick={closeMobileMenu}>
            <FaTags className="sidebar-link-icon" />
            <span>Categories</span>
          </NavLink>
          <NavLink to="/admin/dashboard/products" className={({ active }) => `sidebar-link ${active ? 'active' : ''}`} onClick={closeMobileMenu}>
            <FaBoxOpen className="sidebar-link-icon" />
            <span>Products</span>
          </NavLink>

          <div className="menu-section-title">Content</div>
          <NavLink to="/admin/dashboard/faqs" className={({ active }) => `sidebar-link ${active ? 'active' : ''}`} onClick={closeMobileMenu}>
            <FaQuestionCircle className="sidebar-link-icon" />
            <span>FAQ</span>
          </NavLink>
          <NavLink to="/admin/dashboard/testimonials" className={({ active }) => `sidebar-link ${active ? 'active' : ''}`} onClick={closeMobileMenu}>
            <FaCommentDots className="sidebar-link-icon" />
            <span>Testimonials</span>
          </NavLink>
          <NavLink to="/admin/dashboard/announcements" className={({ active }) => `sidebar-link ${active ? 'active' : ''}`} onClick={closeMobileMenu}>
            <FaBullhorn className="sidebar-link-icon" />
            <span>Announcements</span>
          </NavLink>

          <div className="menu-section-title">Messages</div>
          <NavLink to="/admin/dashboard/messages" className={({ active }) => `sidebar-link ${active ? 'active' : ''}`} onClick={closeMobileMenu}>
            <FaEnvelopeOpenText className="sidebar-link-icon" />
            <span>Contact Messages</span>
          </NavLink>

          {isAdmin && (
            <>
              <div className="menu-section-title">User Management</div>
              <NavLink to="/admin/dashboard/managers" className={({ active }) => `sidebar-link ${active ? 'active' : ''}`} onClick={closeMobileMenu}>
                <FaUsers className="sidebar-link-icon" />
                <span>Managers</span>
              </NavLink>
            </>
          )}

          <div className="menu-section-title">Account</div>
          <NavLink to="/admin/dashboard/profile" className={({ active }) => `sidebar-link ${active ? 'active' : ''}`} onClick={closeMobileMenu}>
            <FaUser className="sidebar-link-icon" />
            <span>My Profile</span>
          </NavLink>
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="user-avatar-placeholder">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name || 'User Account'}</span>
              <span className="user-role">{user?.role || 'Staff'}</span>
            </div>
            <button className="logout-btn-sidebar" onClick={handleLogout} title="Sign Out">
              <FaSignOutAlt />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="header-title-area">
            <button 
              className="menu-toggle-btn" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              aria-label="Toggle Navigation Drawer"
            >
              {mobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
            <h1 className="admin-header-title">{getHeaderTitle()}</h1>
          </div>

          <div className="admin-header-right">
            <a href="/" target="_blank" rel="noreferrer" className="store-live-btn">
              <span>View Storefront</span>
              <FaExternalLinkAlt style={{ fontSize: '0.75rem' }} />
            </a>
          </div>
        </header>

        {/* Dynamic Nested Route Rendering */}
        <div className="admin-content-body">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardLayout;
