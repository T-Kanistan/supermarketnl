import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { FiMapPin, FiPhone, FiMail, FiClock } from 'react-icons/fi';
import { FaFacebook, FaInstagram, FaWhatsapp, FaTiktok, FaYoutube } from 'react-icons/fa';
import { useCMS } from '../context/CMSContext';
import categoryService from '../services/categoryService';
import { getImageUrl } from '../services/api';
import { mergeFooterPage } from '../constants/footerPageDefaults';
import './Footer.css';

const Footer = () => {
  const location = useLocation();
  const { cmsData, loading, error } = useCMS();
  const [catalogCategories, setCatalogCategories] = useState([]);

  useEffect(() => {
    let mounted = true;

    const loadCategories = async () => {
      try {
        const list = await categoryService.getCategories();
        if (!mounted) return;
        const active = (Array.isArray(list) ? list : []).filter((c) => c.status === 'active');
        setCatalogCategories(active);
      } catch (err) {
        console.error('Failed to load footer categories', err);
      }
    };

    loadCategories();
    return () => {
      mounted = false;
    };
  }, []);

  if (location.pathname.startsWith('/admin')) return null;
  if (loading) return null;
  if (error || !cmsData) {
    return (
      <footer className="footer-main">
        <div className="container" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
          {error || 'Footer content unavailable.'}
        </div>
      </footer>
    );
  }

  const footer = cmsData.footerPage || mergeFooterPage();

  const address = cmsData.address || 'Hilversum, Netherlands';
  const phone = cmsData.contactPhone || '+31659046526';
  const email = cmsData.contactEmail || 'info@winswereldwinkel.nl';
  const phoneHref = `tel:${phone.replace(/[^\d+]/g, '')}`;
  const emailHref = `mailto:${email}`;
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  const quickLinks = footer.quickLinks.filter((link) => link.enabled && link.label);
  const cmsCategoryLinks = footer.categoryLinks.filter((link) => link.enabled && link.label);
  const footerCategoryLinks = catalogCategories.length
    ? catalogCategories.map((cat) => ({
        id: cat.id,
        label: cat.name,
        path: `/products?category=${encodeURIComponent(cat.id)}`,
      }))
    : cmsCategoryLinks;
  const legalLinks = footer.legalLinks.filter((link) => link.enabled && link.label);
  const copyrightName = footer.copyrightText || cmsData.storeName || 'Wins Wereld Winkel';

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
            <h4 className="footer-main-title">{footer.quickLinksTitle}</h4>
            <div className="footer-main-links">
              {quickLinks.map((link) => (
                <Link key={link.id} to={link.path}>{link.label}</Link>
              ))}
            </div>
          </div>

          <div className="footer-main-col">
            <h4 className="footer-main-title">{footer.categoriesTitle}</h4>
            <div className="footer-main-links">
              {footerCategoryLinks.map((link) => (
                <Link
                  key={link.id}
                  to={
                    catalogCategories.length
                      ? { pathname: '/products', search: `?category=${encodeURIComponent(link.id)}` }
                      : (link.path || '/products')
                  }
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="footer-main-col">
            <h4 className="footer-main-title">{footer.businessHoursTitle}</h4>
            <div className="footer-contact-list">
              <p><FiClock /> {footer.supermarketLabel}</p>
              <p className="footer-hours-sub">{cmsData.supermarketTimings || '8:00 AM - 10:00 PM'}</p>
              <p><FiClock /> {footer.foodCornerLabel}</p>
              <p className="footer-hours-sub">{cmsData.foodCornerTimings || '11:00 AM - 11:00 PM'}</p>
              {footer.sundayHours && (
                <p className="footer-hours-sub">{footer.sundayHours}</p>
              )}
            </div>
          </div>

          <div className="footer-main-col footer-contact-col">
            <h4 className="footer-main-title">{footer.contactTitle}</h4>
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
            {legalLinks.map((link) => (
              <Link key={link.id} to={link.path}>{link.label}</Link>
            ))}
          </div>
          <p>&copy; {new Date().getFullYear()} {copyrightName}. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
