import { useState, useEffect } from 'react';
import { FiX, FiUser, FiPhone, FiMail, FiPackage, FiTag, FiMessageSquare, FiSend } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import cmsService from '../services/cmsService';
import { useToast } from '../context/ToastContext';
import {
  ENQUIRY_TYPES,
  CONTACT_METHODS,
  buildSubmissionMessage,
  openWhatsAppEnquiry,
} from '../utils/enquiryUtils';
import './EnquiryModal.css';

const emptyForm = {
  fullName: '',
  phone: '',
  email: '',
  productName: '',
  quantity: '',
  contactMethod: 'WhatsApp',
  enquiryType: 'Product Details',
  message: '',
};

const EnquiryModal = ({ isOpen, onClose, product }) => {
  const { addToast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setShowSuccess(false);
    setErrors({});
    setForm({
      ...emptyForm,
      productName: product?.name || '',
      message: product?.initialMessage || '',
    });
  }, [isOpen, product]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const next = {};

    if (!form.fullName.trim()) next.fullName = 'Full name is required';
    if (!form.phone.trim()) next.phone = 'Phone number is required';
    else if (!/^[\d\s+()-]{8,}$/.test(form.phone.trim())) next.phone = 'Enter a valid phone number';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Enter a valid email address';
    }
    if (!form.productName.trim()) next.productName = 'Product name is required';
    if (!form.message.trim()) next.message = 'Message is required';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await cmsService.submitContactMessage({
        name: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || '',
        subject: `Product Enquiry: ${form.productName.trim()}`,
        message: buildSubmissionMessage(form),
      });
      setShowSuccess(true);
      addToast('Your enquiry has been submitted successfully!', 'success');
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2200);
    } catch (err) {
      console.error('Enquiry submission failed', err);
      addToast('Failed to submit enquiry. Please try again or use WhatsApp.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsApp = () => {
    if (!validate()) return;
    openWhatsAppEnquiry(form);
  };

  return (
    <div className="enquiry-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="enquiry-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="enquiry-modal-title"
      >
        <button type="button" className="enquiry-modal-close" onClick={onClose} aria-label="Close">
          <FiX />
        </button>

        <div className="enquiry-modal-header">
          <div className="enquiry-modal-icon">
            <FiPackage />
          </div>
          <div>
            <h2 id="enquiry-modal-title">Product Enquiry</h2>
            <p>Ask about details, availability, pricing, bulk orders, or delivery.</p>
          </div>
        </div>

        {showSuccess ? (
          <div className="enquiry-success">
            <div className="enquiry-success-icon">✓</div>
            <h3>Enquiry Submitted!</h3>
            <p>Thank you. We will contact you shortly.</p>
          </div>
        ) : (
          <form className="enquiry-form" onSubmit={handleSubmit} noValidate>
            <section className="enquiry-section">
              <h3>Customer Information</h3>
              <div className="enquiry-grid">
                <div className={`enquiry-field ${errors.fullName ? 'has-error' : ''}`}>
                  <label htmlFor="enquiry-fullName">Full Name *</label>
                  <div className="enquiry-input-wrap">
                    <FiUser />
                    <input
                      id="enquiry-fullName"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      placeholder="Your full name"
                    />
                  </div>
                  {errors.fullName && <span className="enquiry-error">{errors.fullName}</span>}
                </div>

                <div className={`enquiry-field ${errors.phone ? 'has-error' : ''}`}>
                  <label htmlFor="enquiry-phone">Phone Number *</label>
                  <div className="enquiry-input-wrap">
                    <FiPhone />
                    <input
                      id="enquiry-phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+31659046526"
                    />
                  </div>
                  {errors.phone && <span className="enquiry-error">{errors.phone}</span>}
                </div>

                <div className={`enquiry-field full-width ${errors.email ? 'has-error' : ''}`}>
                  <label htmlFor="enquiry-email">Email Address</label>
                  <div className="enquiry-input-wrap">
                    <FiMail />
                    <input
                      id="enquiry-email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                    />
                  </div>
                  {errors.email && <span className="enquiry-error">{errors.email}</span>}
                </div>
              </div>
            </section>

            <section className="enquiry-section">
              <h3>Product Enquiry</h3>
              <div className="enquiry-grid">
                <div className={`enquiry-field ${errors.productName ? 'has-error' : ''}`}>
                  <label htmlFor="enquiry-productName">Product Name *</label>
                  <div className="enquiry-input-wrap">
                    <FiPackage />
                    <input
                      id="enquiry-productName"
                      name="productName"
                      value={form.productName}
                      onChange={handleChange}
                      placeholder="Product name"
                    />
                  </div>
                  {errors.productName && <span className="enquiry-error">{errors.productName}</span>}
                </div>

                <div className="enquiry-field">
                  <label htmlFor="enquiry-quantity">Quantity Required</label>
                  <div className="enquiry-input-wrap">
                    <FiTag />
                    <input
                      id="enquiry-quantity"
                      name="quantity"
                      value={form.quantity}
                      onChange={handleChange}
                      placeholder="e.g. 2 kg, 5 units"
                    />
                  </div>
                </div>

                <div className="enquiry-field full-width">
                  <label htmlFor="enquiry-contactMethod">Preferred Contact Method</label>
                  <div className="enquiry-input-wrap">
                    <FiPhone />
                    <select
                      id="enquiry-contactMethod"
                      name="contactMethod"
                      value={form.contactMethod}
                      onChange={handleChange}
                    >
                      {CONTACT_METHODS.map((method) => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </section>

            <section className="enquiry-section">
              <h3>Message</h3>
              <div className={`enquiry-field ${errors.enquiryType ? 'has-error' : ''}`}>
                <label htmlFor="enquiry-enquiryType">Enquiry Type</label>
                <div className="enquiry-input-wrap">
                  <FiTag />
                  <select
                    id="enquiry-enquiryType"
                    name="enquiryType"
                    value={form.enquiryType}
                    onChange={handleChange}
                  >
                    {ENQUIRY_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={`enquiry-field ${errors.message ? 'has-error' : ''}`}>
                <label htmlFor="enquiry-message">Message *</label>
                <div className="enquiry-textarea-wrap">
                  <FiMessageSquare />
                  <textarea
                    id="enquiry-message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Tell us what you need to know about this product..."
                  />
                </div>
                {errors.message && <span className="enquiry-error">{errors.message}</span>}
              </div>
            </section>

            <div className="enquiry-actions">
              <button type="submit" className="enquiry-btn enquiry-btn-submit" disabled={isSubmitting}>
                <FiSend /> {isSubmitting ? 'Submitting...' : 'Submit Enquiry'}
              </button>
              <button type="button" className="enquiry-btn enquiry-btn-whatsapp" onClick={handleWhatsApp}>
                <FaWhatsapp /> WhatsApp Enquiry
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EnquiryModal;
