import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { FiMapPin, FiPhone, FiMail, FiClock } from 'react-icons/fi';
import { FaFacebook, FaInstagram, FaWhatsapp, FaTiktok, FaYoutube } from 'react-icons/fa';
import { useCMS } from '../context/CMSContext';
import categoryService from '../services/categoryService';
import { getImageUrl } from '../services/api';
import { buildStoreLogoAlt } from '../utils/seoImageAlt';
import { mapProductCategoriesToFooterLinks } from '../utils/footerCategories';
import BusinessHoursDisplay from './BusinessHoursDisplay';
import AppzDevelopedPopup from './AppzDevelopedPopup';
import './Footer.css';

const isExternalLink = (value = '') => /^https?:\/\//i.test(String(value).trim());

const FooterNavLink = ({ path, children, className = '' }) => {
  const cleanedPath = String(path || '').trim();
  if (!cleanedPath) return <span className={className}>{children}</span>;
  if (isExternalLink(cleanedPath)) {
    return (
      <a href={cleanedPath} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link to={cleanedPath} className={className}>
      {children}
    </Link>
  );
};

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
        setCatalogCategories(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Failed to load footer categories', err);
      }
    };

    loadCategories();
    return () => {
      mounted = false;
    };
  }, []);

  if (
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/manager') ||
    location.pathname === '/login' ||
    location.pathname === '/forgot-password' ||
    location.pathname === '/reset-password'
  ) {
    return null;
  }
  if (loading) return null;
  if (!cmsData) {
    return (
      <footer className="footer-main">
        <div className="container" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
          {error || 'Footer content unavailable.'}
        </div>
      </footer>
    );
  }

  const footer = cmsData.footerPage || {};

  const address = cmsData.address || '';
  const phone = cmsData.contactPhone || '';
  const email = cmsData.contactEmail || '';
  const phoneHref = `tel:${phone.replace(/[^\d+]/g, '')}`;
  const emailHref = `mailto:${email}`;
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  const quickLinks = (Array.isArray(footer.quickLinks) ? footer.quickLinks : [])
    .filter((link) => link.enabled && link.label);
  const footerCategoryLinks = mapProductCategoriesToFooterLinks(catalogCategories);
  const legalLinks = (Array.isArray(footer.legalLinks) ? footer.legalLinks : [])
    .filter((link) => link.enabled && link.label);
  const copyrightName = footer.copyrightText || cmsData.storeName || '';

  return (
    <footer className="footer-main" id="footer">
      <div className="container" style={{ maxWidth: '1400px' }}>
        <div className="footer-main-grid">
          <div className="footer-main-col brand-col">
            <img
              src={getImageUrl(cmsData.footerLogo || cmsData.logo) || '/logo.png'}
              alt={buildStoreLogoAlt()}
              className="footer-main-logo"
              width="160"
              height="54"
              loading="lazy"
              decoding="async"
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
            <h4 className="footer-main-title">{footer.quickLinksTitle || ''}</h4>
            <div className="footer-main-links">
              {quickLinks.map((link) => (
                <FooterNavLink key={link.id} path={link.path}>
                  {link.label}
                </FooterNavLink>
              ))}
            </div>
          </div>

          <div className="footer-main-col">
            <h4 className="footer-main-title">{footer.categoriesTitle || ''}</h4>
            <div className="footer-main-links">
              {footerCategoryLinks.map((link) => (
                <Link
                  key={link.id}
                  to={{ pathname: '/products', search: `?category=${encodeURIComponent(link.id)}` }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="footer-main-col">
            <h4 className="footer-main-title">{footer.businessHoursTitle || ''}</h4>
            <div className="footer-contact-list">
              <p><FiClock /> {footer.supermarketLabel || ''}</p>
              <BusinessHoursDisplay
                value={cmsData.supermarketTimings || ''}
                loading={loading}
                className="footer-hours-sub"
              />
              <p><FiClock /> {footer.foodCornerLabel || ''}</p>
              <BusinessHoursDisplay
                value={cmsData.foodCornerTimings || ''}
                loading={loading}
                className="footer-hours-sub"
              />
              {footer.sundayHours && (
                <p className="footer-hours-sub">{footer.sundayHours}</p>
              )}
            </div>
          </div>

          <div className="footer-main-col footer-contact-col">
            <h4 className="footer-main-title">{footer.contactTitle || ''}</h4>
            <div className="footer-contact-list">
              {address && (
                <a href={mapsHref} target="_blank" rel="noreferrer" className="footer-contact-link">
                  <FiMapPin /> {address}
                </a>
              )}
              {phone && (
                <a href={phoneHref} className="footer-contact-link">
                  <FiPhone /> {phone}
                </a>
              )}
              {email && (
                <a href={emailHref} className="footer-contact-link">
                  <FiMail /> {email}
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="footer-main-bottom">
          {legalLinks.length > 0 && (
            <div className="footer-legal-links">
              {legalLinks.map((link) => (
                <FooterNavLink key={link.id} path={link.path} className="footer-legal-pill">
                  {link.label}
                </FooterNavLink>
              ))}
            </div>
          )}
          <p className="footer-copyright">
            <span>&copy; {new Date().getFullYear()} {copyrightName}. All Rights Reserved.</span>
            <span className="footer-developed-by">
              <span className="footer-developed-label">Developed By</span>
              {' '}
              <span className="footer-appz">
                <AppzDevelopedPopup
                  triggerClassName="footer-developed-name"
                  triggerLabel="AppZ Makers"
                />
              </span>
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
