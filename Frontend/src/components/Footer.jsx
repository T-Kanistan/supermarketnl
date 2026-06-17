import { useLocation, Link } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaWhatsapp, FaTiktok, FaYoutube } from 'react-icons/fa';
import { useCMS } from '../context/CMSContext';
import './Footer.css';

const Footer = () => {
  const location = useLocation();
  const { cmsData } = useCMS();

  // Hide footer on all admin portal pages
  if (location.pathname.startsWith('/admin')) return null;

  return (
    <footer className="footer-main" id="footer">
      <div className="container" style={{ maxWidth: '1400px' }}>
        <div className="footer-main-grid">
          {/* Column 1 - Brand */}
          <div className="footer-main-col brand-col">
            <img src={cmsData.logo || '/logo.png'} alt={cmsData.storeName || 'Store Logo'} className="footer-main-logo" onError={(e) => { e.target.src = '/logo.png'; }} />
            <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginTop: '12px', lineHeight: '1.5' }}>
              {cmsData.footerDescription}
            </p>
          </div>

          {/* Column 2 - Quick Links */}
          <div className="footer-main-col">
            <h4 className="footer-main-title">QUICK LINKS</h4>
            <div className="footer-main-links">
              <Link to="/">Home</Link>
              <Link to="/about">About Us</Link>
              <Link to="/products">Products</Link>
              <Link to="/food-corner">Food Corner</Link>
              <Link to="/offers">Offers</Link>
              <Link to="/terms">Terms & Conditions</Link>
            </div>
          </div>

          {/* Column 3 - Categories */}
          <div className="footer-main-col">
            <h4 className="footer-main-title">CATEGORIES</h4>
            <div className="footer-main-links">
              <Link to="/products?category=grocery">Grocery Items</Link>
              <Link to="/products?category=masala">Masala Items</Link>
              <Link to="/products?category=vegetables">Vegetables</Link>
              <Link to="/products?category=sweets">Sweets</Link>
              <Link to="/products?category=frozen">Frozen Items</Link>
            </div>
          </div>

          {/* Column 4 - Follow Us */}
          <div className="footer-main-col">
            <h4 className="footer-main-title">FOLLOW US</h4>
            <div className="social-row">
              {cmsData.socials?.facebook && (
                <a href={cmsData.socials.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="social-icon facebook"><FaFacebook /></a>
              )}
              {cmsData.socials?.instagram && (
                <a href={cmsData.socials.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="social-icon instagram"><FaInstagram /></a>
              )}
              {cmsData.socials?.whatsapp && (
                <a href={cmsData.socials.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="social-icon whatsapp"><FaWhatsapp /></a>
              )}
              {cmsData.socials?.tiktok && (
                <a href={cmsData.socials.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok" className="social-icon tiktok"><FaTiktok /></a>
              )}
              {cmsData.socials?.youtube && (
                <a href={cmsData.socials.youtube} target="_blank" rel="noreferrer" aria-label="YouTube" className="social-icon youtube"><FaYoutube /></a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="footer-main-bottom">
          <div className="footer-legal-links" style={{ marginBottom: '15px' }}>
            <Link to="/terms" style={{ color: '#cbd5e1', textDecoration: 'none', margin: '0 15px', fontSize: '0.9rem' }}>Terms & Conditions</Link>
          </div>
          &copy; {new Date().getFullYear()} {cmsData.storeName || 'Supermarket'}. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
