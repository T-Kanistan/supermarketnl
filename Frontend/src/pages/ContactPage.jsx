import { useState } from 'react';
import { FiPhone, FiMail, FiMapPin, FiClock, FiUser, FiTag, FiSend, FiLock, FiHeadphones, FiCheckCircle } from 'react-icons/fi';
import { FaFacebook, FaInstagram, FaWhatsapp, FaTiktok, FaYoutube } from 'react-icons/fa';
import { useCMS } from '../context/CMSContext';
import { useToast } from '../context/ToastContext';
import cmsService from '../services/cmsService';
import './ContactPage.css';

const ContactPage = () => {
  const { cmsData } = useCMS();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await cmsService.submitContactMessage(formData);
      addToast('Thank you! Your message has been sent successfully.', 'success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (err) {
      console.error('Submit contact message failed', err);
      addToast('Failed to send message. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      {/* Hero Section */}
      <div className="contact-hero">
        <div className="container">
          <div className="contact-hero-content">
            <div className="hero-pill-badge">
              <FiPhone /> GET IN TOUCH
            </div>
            <h1>CONTACT US</h1>
            <p className="hero-subtitle">We're here to help. Reach out to us anytime.</p>
            <div className="hero-features">
              <span><FiCheckCircle className="feature-icon"/> Quick Support</span>
              <span className="dot">•</span>
              <span><FiCheckCircle className="feature-icon"/> Fast Response</span>
              <span className="dot">•</span>
              <span><FiCheckCircle className="feature-icon"/> We Care</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container overlap-container">
        <div className="contact-grid">
          
          {/* Left: Form Card */}
          <div className="contact-card form-card">
            <div className="card-header">
              <div className="header-icon-wrapper">
                <FiMail />
              </div>
              <div className="header-text">
                <h2>SEND US A MESSAGE</h2>
                <p>Fill in the form below and we will get back to you.</p>
              </div>
            </div>

            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name <span className="required">*</span></label>
                <div className="input-wrapper">
                  <FiUser className="input-icon" />
                  <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter your full name" required />
                </div>
              </div>

              <div className="form-group">
                <label>Email Address <span className="required">*</span></label>
                <div className="input-wrapper">
                  <FiMail className="input-icon" />
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter your email address" required />
                </div>
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <div className="input-wrapper">
                  <FiPhone className="input-icon" />
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Enter your phone number" />
                </div>
              </div>

              <div className="form-group">
                <label>Subject <span className="required">*</span></label>
                <div className="input-wrapper">
                  <FiTag className="input-icon" />
                  <input type="text" name="subject" value={formData.subject} onChange={handleChange} placeholder="Enter the subject" required />
                </div>
              </div>

              <div className="form-group">
                <label>Message <span className="required">*</span></label>
                <textarea name="message" value={formData.message} onChange={handleChange} placeholder="Write your message here..." rows="5" required></textarea>
              </div>

              <button type="submit" className="send-btn" disabled={isSubmitting}>
                <FiSend /> {isSubmitting ? 'SENDING...' : 'SEND MESSAGE'}
              </button>
              <div className="form-footer-note">
                <FiLock /> Your information is safe with us. We never share your details.
              </div>
            </form>
          </div>

          {/* Right: Info Card */}
          <div className="contact-card info-card">
            <div className="card-header">
              <div className="header-icon-wrapper">
                <FiUser />
              </div>
              <div className="header-text">
                <h2>CONTACT INFORMATION</h2>
              </div>
            </div>

            <div className="info-list">
              <div className="info-item">
                <div className="info-icon-circle"><FiPhone /></div>
                <div className="info-content">
                  <label>Phone Number</label>
                  <p>{cmsData.contactPhone}</p>
                  <span className="info-subtext">Mon - Sat: 08:00 AM - 10:00 PM</span>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon-circle"><FiMail /></div>
                <div className="info-content">
                  <label>Email Address</label>
                  <p>{cmsData.contactEmail}</p>
                  <span className="info-subtext">We reply within 24 hours</span>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon-circle"><FiMapPin /></div>
                <div className="info-content">
                  <label>Store Location</label>
                  <p>{cmsData.storeName}<br/>{cmsData.address}</p>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon-circle"><FiClock /></div>
                <div className="info-content">
                  <label>Opening Hours</label>
                  <p>Mon - Sat: 08:00 AM - 10:00 PM<br/>Sunday: 09:00 AM - 08:00 PM</p>
                </div>
              </div>
            </div>

            <div className="social-section">
              <h4>FOLLOW US</h4>
              <div className="social-icons">
                {cmsData.socials?.facebook && (
                  <a href={cmsData.socials.facebook} target="_blank" rel="noreferrer" className="social-icon facebook"><FaFacebook /></a>
                )}
                {cmsData.socials?.instagram && (
                  <a href={cmsData.socials.instagram} target="_blank" rel="noreferrer" className="social-icon instagram"><FaInstagram /></a>
                )}
                {cmsData.socials?.whatsapp && (
                  <a href={cmsData.socials.whatsapp} target="_blank" rel="noreferrer" className="social-icon whatsapp"><FaWhatsapp /></a>
                )}
                {cmsData.socials?.tiktok && (
                  <a href={cmsData.socials.tiktok} target="_blank" rel="noreferrer" className="social-icon tiktok"><FaTiktok /></a>
                )}
                {cmsData.socials?.youtube && (
                  <a href={cmsData.socials.youtube} target="_blank" rel="noreferrer" className="social-icon youtube"><FaYoutube /></a>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Map Section */}
        <div className="location-section">
          <div className="map-container">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2436.4673891781285!2d4.8951679!3d52.3702157!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c609c0c20c4333%3A0x8bb8f01c23f2f0!2sAmsterdam%2C%20Netherlands!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus" 
              width="100%" 
              height="100%" 
              style={{border:0}} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Location Map"
            ></iframe>
          </div>
          
          <div className="timings-card">
            <div className="timings-header">
              <FiClock className="timings-icon" />
              <h3>BUSINESS HOURS</h3>
            </div>
            <ul className="timings-list">
              <li><span>Monday - Saturday</span><span>08:00 AM - 10:00 PM</span></li>
              <li><span>Sunday</span><span>09:00 AM - 08:00 PM</span></li>
              <li><span>Holiday</span><span>Opens as Announced</span></li>
            </ul>
            <div className="help-box">
              <FiHeadphones className="help-icon" />
              <div className="help-text">
                <p>Need help?</p>
                <span>Call us anytime</span>
                <strong>{cmsData.contactPhone}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
