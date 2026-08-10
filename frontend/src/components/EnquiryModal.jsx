import { useState, useEffect, useRef } from 'react';
import { FiX, FiUser, FiPhone, FiMail, FiPackage, FiTag, FiMessageSquare, FiSend } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import enquiryService from '../services/enquiryService';
import { useToast } from '../context/ToastContext';
import {
  ENQUIRY_TYPES,
  GENERAL_ENQUIRY_TYPES,
  buildSubmissionMessage,
  openWhatsAppEnquiry,
  openCustomerEnquiryWhatsApp,
} from '../utils/enquiryUtils';
import { ENQUIRY_SUBMIT_SUCCESS_MESSAGE } from '../constants/enquiryMessages';
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (value) => EMAIL_PATTERN.test(String(value || '').trim());

const EnquiryModal = ({ isOpen, onClose, product }) => {
  const { addToast } = useToast();
  const [form, setForm] = useState(generalEmptyForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWhatsAppSubmitting, setIsWhatsAppSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showEmailRequiredModal, setShowEmailRequiredModal] = useState(false);
  const [modalEmail, setModalEmail] = useState('');
  const [modalEmailError, setModalEmailError] = useState('');
  const [phoneHelperVisible, setPhoneHelperVisible] = useState(false);
  const emailInputRef = useRef(null);
  const modalEmailInputRef = useRef(null);

  const isFoodCorner = product?.enquirySource === 'food-corner';
  const isGeneral = product?.enquirySource === 'general' || (!product?.name && !isFoodCorner);

  useEffect(() => {
    if (!isOpen) return;

    setShowSuccess(false);
    setShowEmailRequiredModal(false);
    setModalEmail('');
    setModalEmailError('');
    setErrors({});
    setPhoneHelperVisible(false);

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
    if (!showEmailRequiredModal) return undefined;
    setModalEmail(form.email);
    setModalEmailError('');
    const timer = window.setTimeout(() => {
      modalEmailInputRef.current?.focus();
    }, 50);
    return () => window.clearTimeout(timer);
  }, [showEmailRequiredModal, form.email]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key !== 'Escape') return;
      if (showEmailRequiredModal) {
        dismissEmailRequiredModal();
        return;
      }
      onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, showEmailRequiredModal]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === 'email') {
      if (isValidEmail(value)) {
        setErrors((prev) => ({ ...prev, email: '' }));
      }
      return;
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = ({ requireEmail = true } = {}) => {
    const next = {};

    if (form.fullName.trim() && form.fullName.trim().length < 3) {
      next.fullName = 'Full name must be at least 3 characters';
    }
    if (form.phone.trim() && !/^[\d\s+()-]{8,}$/.test(form.phone.trim())) {
      next.phone = 'Enter a valid phone number';
    }
    if (requireEmail) {
      if (!form.email.trim()) {
        setErrors((prev) => ({
          ...prev,
          ...next,
          email: 'Please enter your email address.',
        }));
        setModalEmail(form.email);
        setModalEmailError('');
        setShowEmailRequiredModal(true);
        return false;
      }
      if (!isValidEmail(form.email)) {
        next.email = 'Please enter a valid email address.';
      }
    }
    if (!isGeneral && !form.productName.trim()) next.productName = 'Product name is required';
    if (!form.message.trim()) next.message = 'Message is required';
    if (isGeneral && !form.enquiryType) next.enquiryType = 'Enquiry type is required';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const dismissEmailRequiredModal = () => {
    setShowEmailRequiredModal(false);
    setModalEmail('');
    setModalEmailError('');
  };

  const handleModalEmailChange = (e) => {
    const value = e.target.value;
    setModalEmail(value);

    const trimmed = value.trim();
    if (!trimmed) {
      setModalEmailError('');
      return;
    }

    setModalEmailError(
      isValidEmail(trimmed) ? '' : 'Please enter a valid email address.'
    );
  };

  const handleModalEmailContinue = () => {
    const trimmed = modalEmail.trim();
    if (!isValidEmail(trimmed)) {
      setModalEmailError('Please enter a valid email address.');
      return;
    }

    setForm((prev) => ({ ...prev, email: trimmed }));
    setErrors((prev) => ({ ...prev, email: '' }));
    dismissEmailRequiredModal();
    requestAnimationFrame(() => {
      emailInputRef.current?.focus();
    });
  };

  const modalEmailValid = isValidEmail(modalEmail);

  const getGeneralPayload = () => ({
    fullName: form.fullName.trim(),
    phoneNumber: form.phone.trim(),
    email: form.email.trim(),
    enquiryType: form.enquiryType,
    message: form.message.trim(),
  });

  const completeSubmission = () => {
    setShowSuccess(true);
    addToast(ENQUIRY_SUBMIT_SUCCESS_MESSAGE, 'success');
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 2200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate({ requireEmail: true })) return;

    setIsSubmitting(true);
    try {
      if (isGeneral) {
        await enquiryService.submitGeneralEnquiry({
          ...getGeneralPayload(),
          source: 'website',
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

      completeSubmission();
    } catch (err) {
      console.error('Enquiry submission failed', err);
      addToast('Failed to submit enquiry. Please try again or use WhatsApp.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGeneralWhatsApp = () => {
    if (!validate({ requireEmail: false })) return;

    const payload = getGeneralPayload();
    
    // Open WhatsApp synchronously to prevent browser popup blockers
    openCustomerEnquiryWhatsApp(payload);
    completeSubmission();

    // Best-effort background save
    enquiryService.submitGeneralEnquiry({
      ...payload,
      source: 'whatsapp',
    }).catch((err) => {
      console.error('WhatsApp enquiry save failed', err);
    });
  };

  const handleWhatsApp = () => {
    if (isGeneral || !validate({ requireEmail: false })) return;
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
      : 'Ask about details, availability, pricing, delivery, or other questions.';

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
            <h3>Enquiry Submitted Successfully</h3>
            <p>{ENQUIRY_SUBMIT_SUCCESS_MESSAGE}</p>
          </div>
        ) : (
          <form className="enquiry-form" onSubmit={handleSubmit} noValidate>
            <section className="enquiry-section">
              <h3>Customer Information</h3>
              <div className="enquiry-grid">
                <div className={`enquiry-field ${errors.fullName ? 'has-error' : ''}`}>
                  <label htmlFor="enquiry-fullName">Full Name</label>
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
                  <label htmlFor="enquiry-phone">Phone Number (optional)</label>
                  <div className="enquiry-input-wrap">
                    <FiPhone />
                    <input
                      id="enquiry-phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => {
                        handleChange(e);
                        setPhoneHelperVisible(true);
                      }}
                      onFocus={() => setPhoneHelperVisible(true)}
                      onBlur={() => setPhoneHelperVisible(false)}
                      placeholder="+31659046526 (optional)"
                    />
                  </div>
                  {phoneHelperVisible && (
                    <div className="enquiry-field-helper" role="status">
                      <FiPhone className="enquiry-field-helper-icon" aria-hidden="true" />
                      <span>We will contact you using this phone number regarding your enquiry.</span>
                    </div>
                  )}
                  {errors.phone && <span className="enquiry-error">{errors.phone}</span>}
                </div>

                <div className={`enquiry-field full-width ${errors.email ? 'has-error' : ''}`}>
                  <label htmlFor="enquiry-email">Email Address</label>
                  <div className="enquiry-input-wrap">
                    <FiMail />
                    <input
                      ref={emailInputRef}
                      id="enquiry-email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      autoComplete="email"
                      aria-invalid={errors.email ? 'true' : 'false'}
                      aria-describedby="enquiry-email-helper enquiry-email-error"
                    />
                  </div>
                  <p id="enquiry-email-helper" className="enquiry-field-hint">
                    Required only when submitting an enquiry. Not required for WhatsApp enquiries.
                  </p>
                  {errors.email && (
                    <span id="enquiry-email-error" className="enquiry-error" role="alert">
                      {errors.email}
                    </span>
                  )}
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
              {isGeneral ? (
                <button
                  type="button"
                  className="enquiry-btn enquiry-btn-whatsapp"
                  onClick={handleGeneralWhatsApp}
                  disabled={isSubmitting || isWhatsAppSubmitting}
                >
                  <FaWhatsapp /> {isWhatsAppSubmitting ? 'Opening...' : 'WhatsApp Enquiry'}
                </button>
              ) : (
                <button
                  type="button"
                  className="enquiry-btn enquiry-btn-whatsapp"
                  onClick={handleWhatsApp}
                  disabled={isSubmitting || isWhatsAppSubmitting}
                >
                  <FaWhatsapp /> WhatsApp Enquiry
                </button>
              )}
              <button
                type="submit"
                className="enquiry-btn enquiry-btn-submit"
                disabled={isSubmitting || isWhatsAppSubmitting}
              >
                <FiSend /> {isSubmitting ? 'Submitting...' : 'Submit Enquiry'}
              </button>
              <button type="button" className="enquiry-btn enquiry-btn-cancel" onClick={onClose}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {showEmailRequiredModal && (
          <div
            className="enquiry-validation-overlay"
            onClick={dismissEmailRequiredModal}
            role="presentation"
          >
            <div
              className="enquiry-validation-modal"
              onClick={(e) => e.stopPropagation()}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="enquiry-email-required-title"
              aria-describedby="enquiry-email-required-message"
            >
              <div className="enquiry-validation-icon" aria-hidden="true">
                <FiMail />
              </div>
              <h3 id="enquiry-email-required-title">Email Address Required</h3>
              <p id="enquiry-email-required-message">
                Please enter your email address to submit your enquiry.
                <br />
                Your email is required so our team can send updates and respond to your enquiry.
              </p>

              <div className={`enquiry-validation-field ${modalEmailError ? 'has-error' : ''}`}>
                <label htmlFor="enquiry-modal-email" className="enquiry-validation-label">
                  Email Address
                </label>
                <div className="enquiry-validation-input-wrap">
                  <FiMail aria-hidden="true" />
                  <input
                    ref={modalEmailInputRef}
                    id="enquiry-modal-email"
                    type="email"
                    name="modalEmail"
                    value={modalEmail}
                    onChange={handleModalEmailChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && modalEmailValid) {
                        e.preventDefault();
                        handleModalEmailContinue();
                      }
                    }}
                    placeholder="Enter your email address"
                    autoComplete="email"
                    aria-invalid={modalEmailError ? 'true' : 'false'}
                    aria-describedby={modalEmailError ? 'enquiry-modal-email-error' : undefined}
                  />
                </div>
                {modalEmailError && (
                  <span id="enquiry-modal-email-error" className="enquiry-validation-error" role="alert">
                    {modalEmailError}
                  </span>
                )}
              </div>

              <div className="enquiry-validation-actions">
                <button
                  type="button"
                  className="enquiry-validation-continue"
                  onClick={handleModalEmailContinue}
                  disabled={!modalEmailValid}
                >
                  Continue
                </button>
                <button
                  type="button"
                  className="enquiry-validation-cancel"
                  onClick={dismissEmailRequiredModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnquiryModal;
