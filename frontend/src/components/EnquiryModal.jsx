import { useState, useEffect } from 'react';
import { FiX, FiUser, FiPhone, FiMail, FiPackage, FiTag, FiMessageSquare, FiSend } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import enquiryService from '../services/enquiryService';
import { useToast } from '../context/ToastContext';
import {
  ENQUIRY_TYPES,
  GENERAL_ENQUIRY_TYPES,
  buildSubmissionMessage,
  openWhatsAppEnquiry,
} from '../utils/enquiryUtils';
import './EnquiryModal.css';

const productEmptyForm = {
  fullName: '',
  phone: '',
  email: '',
  productName: '',
  quantity: '',
  enquiryType: 'Product Details',
  message: '',
};

const generalEmptyForm = {
  fullName: '',
  phone: '',
  email: '',
  enquiryType: 'General Enquiry',
  message: '',
};

const EnquiryModal = ({ isOpen, onClose, product }) => {
  const { addToast } = useToast();
  const [form, setForm] = useState(generalEmptyForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const isFoodCorner = product?.enquirySource === 'food-corner';
  const isGeneral = product?.enquirySource === 'general' || (!product?.name && !isFoodCorner);

  useEffect(() => {
    if (!isOpen) return;

    setShowSuccess(false);
    setErrors({});

    if (isGeneral) {
      setForm({
        ...generalEmptyForm,
        message: product?.initialMessage || '',
      });
      return;
    }

    setForm({
      ...productEmptyForm,
      productName: product?.name || '',
      message: product?.initialMessage || '',
    });
  }, [isOpen, product, isGeneral, isFoodCorner]);

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

    if (!form.fullName.trim() || form.fullName.trim().length < 3) {
      next.fullName = 'Full name must be at least 3 characters';
    }
    if (!form.phone.trim()) next.phone = 'Phone number is required';
    else if (!/^[\d\s+()-]{8,}$/.test(form.phone.trim())) next.phone = 'Enter a valid phone number';
    if (!form.email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Enter a valid email address';
    }
    if (!isGeneral && !form.productName.trim()) next.productName = 'Product name is required';
    if (!form.message.trim()) next.message = 'Message is required';
    if (isGeneral && !form.enquiryType) next.enquiryType = 'Enquiry type is required';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (isGeneral) {
        await enquiryService.submitGeneralEnquiry({
          fullName: form.fullName.trim(),
          phoneNumber: form.phone.trim(),
          email: form.email.trim(),
          enquiryType: form.enquiryType,
          message: form.message.trim(),
        });
      } else {
        const payload = {
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          productName: form.productName.trim(),
          quantityRequired: isFoodCorner ? '' : form.quantity.trim(),
          message: buildSubmissionMessage(form, { isFoodCorner }),
        };

        if (isFoodCorner) {
          await enquiryService.submitFoodCornerEnquiry(payload);
        } else {
          await enquiryService.submitProductEnquiry(payload);
        }
      }

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
    if (!validate() || isGeneral) return;
    openWhatsAppEnquiry(form, { isFoodCorner });
  };

  const modalTitle = isGeneral
    ? 'Customer Enquiry'
    : isFoodCorner
      ? 'Food Corner Enquiry'
      : 'Product Enquiry';

  const modalSubtitle = isGeneral
    ? 'Send us your enquiry and our team will get back to you shortly.'
    : isFoodCorner
      ? 'Ask about food items, availability, pricing, or special requests.'
      : 'Ask about details, availability, pricing, bulk orders, or delivery.';

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
            <h2 id="enquiry-modal-title">{modalTitle}</h2>
            <p>{modalSubtitle}</p>
          </div>
        </div>

        {showSuccess ? (
          <div className="enquiry-success">
            <div className="enquiry-success-icon">✓</div>
            <h3>{isGeneral ? 'Enquiry Submitted Successfully' : 'Enquiry Submitted!'}</h3>
            <p>{isGeneral ? 'Our team will contact you shortly.' : 'Thank you. We will contact you shortly.'}</p>
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
                  <label htmlFor="enquiry-email">Email Address *</label>
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

            {isGeneral ? (
              <section className="enquiry-section">
                <h3>Enquiry Details</h3>
                <div className={`enquiry-field ${errors.enquiryType ? 'has-error' : ''}`}>
                  <label htmlFor="enquiry-enquiryType">Enquiry Type *</label>
                  <div className="enquiry-input-wrap">
                    <FiTag />
                    <select
                      id="enquiry-enquiryType"
                      name="enquiryType"
                      value={form.enquiryType}
                      onChange={handleChange}
                    >
                      {GENERAL_ENQUIRY_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  {errors.enquiryType && <span className="enquiry-error">{errors.enquiryType}</span>}
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
                      placeholder="Tell us how we can help you..."
                    />
                  </div>
                  {errors.message && <span className="enquiry-error">{errors.message}</span>}
                </div>
              </section>
            ) : (
              <>
            <section className="enquiry-section">
              <h3>{isFoodCorner ? 'Food Item' : 'Product Enquiry'}</h3>
              <div className="enquiry-grid">
                <div className={`enquiry-field ${isFoodCorner ? 'full-width' : ''} ${errors.productName ? 'has-error' : ''}`}>
                  <label htmlFor="enquiry-productName">{isFoodCorner ? 'Food Item *' : 'Product Name *'}</label>
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

                {!isFoodCorner ? (
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
                ) : null}
              </div>
            </section>

            <section className="enquiry-section">
              <h3>Message</h3>
              {!isFoodCorner ? (
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
              ) : null}

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
              </>
            )}

            <div className="enquiry-actions">
              <button type="submit" className="enquiry-btn enquiry-btn-submit" disabled={isSubmitting}>
                <FiSend /> {isSubmitting ? 'Submitting...' : 'Submit Enquiry'}
              </button>
              {isGeneral ? (
                <button type="button" className="enquiry-btn enquiry-btn-cancel" onClick={onClose}>
                  Cancel
                </button>
              ) : (
                <button type="button" className="enquiry-btn enquiry-btn-whatsapp" onClick={handleWhatsApp}>
                  <FaWhatsapp /> WhatsApp Enquiry
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EnquiryModal;
