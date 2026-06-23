import { useState, useEffect } from 'react';
import {
  FiPhone,
  FiMail,
  FiMapPin,
  FiClock,
  FiUser,
  FiTag,
  FiSend,
  FiLock,
  FiHeadphones,
  FiExternalLink,
  FiMessageCircle,
} from 'react-icons/fi';
import { FaFacebook, FaInstagram, FaWhatsapp, FaTiktok, FaYoutube } from 'react-icons/fa';
import { useToast } from '../context/ToastContext';
import { mergeContactPage } from '../constants/contactPageDefaults';
import contactSettingsService from '../services/contactSettingsService';
import cmsService from '../services/cmsService';
import './ContactPage.css';

const ContactPage = () => {
  const { addToast } = useToast();
  const [contactData, setContactData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    let active = true;
    contactSettingsService
      .getContactSettings()
      .then((data) => {
        if (active) setContactData(data);
      })
      .catch((err) => {
        if (active) setLoadError(err.message || 'Failed to load contact page content.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="contact-page contact-page-loading">
        <p>Loading contact information...</p>
      </div>
    );
  }

  if (loadError || !contactData) {
    return (
      <div className="contact-page contact-page-error">
        <p>{loadError || 'Contact page content is unavailable.'}</p>
      </div>
    );
  }

  const contact = mergeContactPage(contactData.contactPage);
  const phone = contactData.contactPhone || '';
  const email = contactData.contactEmail || '';
  const address = contactData.address || '';
  const storeName = contactData.storeName || '';
  const supermarketHours = contactData.supermarketTimings || '';
  const foodCornerHours = contactData.foodCornerTimings || '';
  const socials = contactData.socials || {};

  const phoneHref = phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : '#';
  const emailHref = email ? `mailto:${email}` : '#';
  const mapsHref = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : '#';
  const whatsappHref = socials.whatsapp || '';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.phone?.trim()) {
      addToast('Phone number is required', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await cmsService.submitContactMessage(formData);
      addToast('Thank you! Your message has been sent successfully.', 'success');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      console.error('Submit contact message failed', err);
      addToast('Failed to send message. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      {/* ─── Hero ─── */}
      <section className="contact-hero">
        <div className="contact-hero-bg" aria-hidden="true" />
        <div className="contact-hero-overlay" />
        <div className="contact-page-shell contact-hero-inner">
          <div className="contact-hero-content">
            <span className="contact-hero-badge">{contact.heroBadge}</span>
            <h1>{contact.heroTitle}</h1>
            <p className="contact-hero-subtitle">{contact.heroSubtitle}</p>
            <ul className="contact-hero-quick">
              <li>
                <FiPhone aria-hidden="true" />
                <a href={phoneHref}>{phone}</a>
              </li>
              <li>
                <FiMail aria-hidden="true" />
                <a href={emailHref}>{email}</a>
              </li>
              <li>
                <FiMapPin aria-hidden="true" />
                <span>{address}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─── Main two-column cards ─── */}
      <div className="contact-main">
        <div className="contact-page-shell">
          <div className="contact-align-grid">
            {/* Left — Form */}
            <div className="contact-card form-card">
              <div className="card-header">
                <div className="header-icon-wrapper">
                  <FiMail />
                </div>
                <div className="header-text">
                  <h2>{contact.formTitle}</h2>
                  <p>{contact.formSubtitle}</p>
                </div>
              </div>

              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>
                    {contact.nameLabel} <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <FiUser className="input-icon" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder={contact.namePlaceholder}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    {contact.emailLabel} <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <FiMail className="input-icon" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={contact.emailPlaceholder}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    {contact.phoneLabel} <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <FiPhone className="input-icon" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder={contact.phonePlaceholder}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    {contact.subjectLabel} <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <FiTag className="input-icon" />
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder={contact.subjectPlaceholder}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    {contact.messageLabel} <span className="required">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder={contact.messagePlaceholder}
                    rows="5"
                    required
                  />
                </div>

                <button type="submit" className="send-btn" disabled={isSubmitting}>
                  <FiSend /> {isSubmitting ? 'Sending...' : contact.submitButtonText}
                </button>
                <div className="form-footer-note">
                  <FiLock /> {contact.privacyNote}
                </div>
              </form>
            </div>

            {/* Right — Info */}
            <div className="contact-card info-card">
              <div className="card-header">
                <div className="header-icon-wrapper">
                  <FiMessageCircle />
                </div>
                <div className="header-text">
                  <h2>{contact.infoCardTitle}</h2>
                  <p>{contact.infoCardSubtitle}</p>
                </div>
              </div>

              <div className="info-list">
                <div className="info-item">
                  <div className="info-icon-circle">
                    <FiPhone />
                  </div>
                  <div className="info-content">
                    <span className="info-label">Phone Number</span>
                    <p className="info-value">
                      <a href={phoneHref} className="contact-link">
                        {phone}
                      </a>
                    </p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon-circle">
                    <FiMail />
                  </div>
                  <div className="info-content">
                    <span className="info-label">Email Address</span>
                    <p className="info-value">
                      <a href={emailHref} className="contact-link">
                        {email}
                      </a>
                    </p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon-circle">
                    <FiMapPin />
                  </div>
                  <div className="info-content">
                    <span className="info-label">Store Address</span>
                    <p className="info-value">
                      {storeName && <>{storeName}<br /></>}
                      {address}
                    </p>
                  </div>
                </div>

                {whatsappHref && (
                  <div className="info-item">
                    <div className="info-icon-circle whatsapp">
                      <FaWhatsapp />
                    </div>
                    <div className="info-content">
                      <span className="info-label">WhatsApp</span>
                      <p className="info-value">
                        <a href={whatsappHref} target="_blank" rel="noreferrer" className="contact-link">
                          Chat with us on WhatsApp
                        </a>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="social-section">
                <h4>Follow Us</h4>
                <div className="social-icons">
                  {socials.facebook && (
                    <a href={socials.facebook} target="_blank" rel="noreferrer" className="social-icon facebook" aria-label="Facebook">
                      <FaFacebook />
                    </a>
                  )}
                  {socials.instagram && (
                    <a href={socials.instagram} target="_blank" rel="noreferrer" className="social-icon instagram" aria-label="Instagram">
                      <FaInstagram />
                    </a>
                  )}
                  {socials.whatsapp && (
                    <a href={socials.whatsapp} target="_blank" rel="noreferrer" className="social-icon whatsapp" aria-label="WhatsApp">
                      <FaWhatsapp />
                    </a>
                  )}
                  {socials.tiktok && (
                    <a href={socials.tiktok} target="_blank" rel="noreferrer" className="social-icon tiktok" aria-label="TikTok">
                      <FaTiktok />
                    </a>
                  )}
                  {socials.youtube && (
                    <a href={socials.youtube} target="_blank" rel="noreferrer" className="social-icon youtube" aria-label="YouTube">
                      <FaYoutube />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ─── Location / Map section ─── */}
          <section className="contact-location-section">
            <div className="contact-location-grid">
              <div className="contact-location-map-col">
                <div className="contact-map-header">
                  <div className="contact-map-title">
                    <FiMapPin />
                    <h2>Our Store Location</h2>
                  </div>
                  <a href={mapsHref} target="_blank" rel="noreferrer" className="contact-map-btn">
                    View on Google Maps <FiExternalLink />
                  </a>
                </div>
                <div className="map-container">
                  {contact.mapEmbedUrl ? (
                    <iframe
                      src={contact.mapEmbedUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Store location map"
                    />
                  ) : (
                    <div className="map-placeholder">
                      <FiMapPin />
                      <p>Map unavailable</p>
                      <a href={mapsHref} target="_blank" rel="noreferrer">
                        Open in Google Maps
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="contact-location-side-col">
                <div className="side-card timings-card">
                  <div className="side-card-header">
                    <FiClock className="side-card-icon" />
                    <h3>Business Hours</h3>
                  </div>
                  <ul className="timings-list">
                    <li>
                      <span>Supermarket</span>
                      <span>{supermarketHours}</span>
                    </li>
                    <li>
                      <span>Food Corner</span>
                      <span>{foodCornerHours}</span>
                    </li>
                    <li>
                      <span>Holiday</span>
                      <span>{contact.holidayHours}</span>
                    </li>
                  </ul>
                </div>

                <div className="side-card help-box">
                  <FiHeadphones className="help-icon" aria-hidden="true" />
                  <div className="help-text">
                    <p>{contact.helpBoxText}</p>
                    <span>{contact.helpBoxSubtext}</span>
                    <strong>
                      <a href={phoneHref} className="contact-link contact-link-strong">
                        {phone}
                      </a>
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
