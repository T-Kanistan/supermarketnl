import { useLocation, Link } from 'react-router-dom';
import { FiMapPin, FiPhone, FiMail, FiClock } from 'react-icons/fi';
import { FaFacebook, FaInstagram, FaWhatsapp, FaTiktok, FaYoutube } from 'react-icons/fa';
import { useCMS } from '../context/CMSContext';
import { getImageUrl } from '../services/api';
import './Footer.css';

const Footer = () => {
  const location = useLocation();
  const { cmsData } = useCMS();

  if (location.pathname.startsWith('/admin')) return null;

  const address = cmsData.address || 'Hilversum, Netherlands';
  const phone = cmsData.contactPhone || '+31659046526';
  const email = cmsData.contactEmail || 'info@winswereldwinkel.nl';
  const phoneHref = `tel:${phone.replace(/[^\d+]/g, '')}`;
  const emailHref = `mailto:${email}`;
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <footer className="footer-main" id="footer">
      <div className="container" style={{ maxWidth: '1400px' }}>
        <div className="footer-main-grid">
          <div className="footer-main-col brand-col">
            <img
              src={getImageUrl(cmsData.logo) || '/logo.png'}
              alt={cmsData.storeName || 'Store Logo'}
              className="footer-main-logo"
              onError={(e) => { e.target.src = '/logo.png'; }}
            />
            <p className="footer-brand-desc">{cmsData.footerDescription}</p>
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

          <div className="footer-main-col">
            <h4 className="footer-main-title">QUICK LINKS</h4>
            <div className="footer-main-links">
              <Link to="/">Home</Link>
              <Link to="/about">About Us</Link>
              <Link to="/products">Products</Link>
              <Link to="/food-corner">Food Corner</Link>
              <Link to="/offers">Offers</Link>
              <Link to="/faq">FAQ</Link>
              <Link to="/contact">Contact Us</Link>
            </div>
          </div>

          <div className="footer-main-col">
            <h4 className="footer-main-title">CATEGORIES</h4>
            <div className="footer-main-links">
              <Link to="/products?category=grocery">Grocery Items</Link>
              <Link to="/products?category=masala">Masala Items</Link>
              <Link to="/products?category=vegetables">Vegetables &amp; Fruits</Link>
              <Link to="/products?category=sweets">Sweets</Link>
              <Link to="/products?category=frozen">Frozen Items</Link>
            </div>
          </div>

          <div className="footer-main-col">
            <h4 className="footer-main-title">BUSINESS HOURS</h4>
            <div className="footer-contact-list">
              <p><FiClock /> Supermarket</p>
              <p className="footer-hours-sub">{cmsData.supermarketTimings || 'Mon–Sat: 9:00 AM - 9:00 PM'}</p>
              <p><FiClock /> Food Corner</p>
              <p className="footer-hours-sub">{cmsData.foodCornerTimings || '11:00 AM - 11:00 PM'}</p>
              <p className="footer-hours-sub">Sunday: 12:00 PM - 7:00 PM</p>
            </div>
          </div>

          <div className="footer-main-col footer-contact-col">
            <h4 className="footer-main-title">CONTACT</h4>
            <div className="footer-contact-list">
              <a href={mapsHref} target="_blank" rel="noreferrer" className="footer-contact-link">
                <FiMapPin /> {address}
              </a>
              <a href={phoneHref} className="footer-contact-link">
                <FiPhone /> {phone}
              </a>
              <a href={emailHref} className="footer-contact-link">
                <FiMail /> {email}
              </a>
            </div>
          </div>
        </div>

        <div className="footer-main-bottom">
          <div className="footer-legal-links">
            <Link to="/terms">Terms &amp; Conditions</Link>
            <Link to="/privacy">Privacy Policy</Link>
          </div>
          <p>&copy; {new Date().getFullYear()} {cmsData.storeName || 'Wins Wereld Winkel'}. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
