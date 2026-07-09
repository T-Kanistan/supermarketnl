import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCMS } from '../../../context/CMSContext';
import { useToast } from '../../../context/ToastContext';
import { getImageUrl } from '../../../services/api';
import { emptyContactPageForm, mergeContactPage } from '../../../constants/contactPageDefaults';
import { emptyFooterPageForm, mergeFooterPage, SOCIAL_PLATFORM_OPTIONS } from '../../../constants/footerPageDefaults';
import contactSettingsService, { mergeContactSettingsIntoForm } from '../../../services/contactSettingsService';
import siteSettingsService from '../../../services/siteSettingsService';
import footerService from '../../../services/footerService';
import categoryService from '../../../services/categoryService';
import { mapProductCategoriesToFooterLinks } from '../../../utils/footerCategories';
import { FaUpload, FaPlus, FaTrash, FaFacebook, FaInstagram, FaWhatsapp, FaTiktok, FaYoutube } from 'react-icons/fa';
import { FiMapPin, FiPhone, FiMail, FiClock } from 'react-icons/fi';
import { CMS_IMAGE_ACCEPT, rejectInvalidCmsImageFile } from '../../../utils/imageUploadValidation';
import {
  validateOpeningHoursField,
  validateOpeningHoursForm,
  focusFirstOpeningHoursError,
  OPENING_HOURS_FIELD_IDS,
} from '../../../utils/openingHoursValidation';
import { notifyCmsSettingsUpdated } from '../../../utils/cmsRefresh';
import {
  sanitizeContactPhoneInput,
  validateContactPhone,
  validateContactEmail,
  validateContactInfoForm,
  focusFirstContactInfoError,
  CONTACT_INFO_FIELD_IDS,
} from '../../../utils/contactInfoValidation';
import {
  CONTACT_PAGE_FIELDS,
  CONTACT_SETTINGS_FIELD_IDS,
  GENERAL_SETTINGS_FIELD_IDS,
  getContactSettingsFieldValue,
  validateContactSettingsField,
  validateContactSettingsForm,
  validateGeneralSettingsForm,
  validateFooterTextForm,
  focusFirstContactSettingsError,
  focusFirstGeneralSettingsError,
  focusFirstFooterTextError,
} from '../../../utils/contactSettingsValidation';
import {
  ADMIN_TEXT_LIMITS,
  boundAdminText,
  formatCharCounter,
  sanitizeAdminText,
} from '../../../utils/adminTextValidation';
import AdminFieldLabel from '../../../components/admin/AdminFieldLabel';
import {
  LEGAL_LINK_LABEL_MAX,
  LEGAL_LINK_PATH_MAX,
  LABEL_DUPLICATE,
  PATH_DUPLICATE,
  validateLegalLinksForm,
  focusFirstLegalLinkError,
  sanitizeLegalLinkLabel,
  sanitizeLegalLinkPath,
} from '../../../utils/legalLinksValidation';

const OPENING_HOURS_PLACEHOLDERS = {
  supermarket: 'MONDAY-SATURDAY (09:00 AM - 09:00 PM)\nSUNDAY (12:00 PM - 07:00 PM)',
  foodCorner: 'SATURDAY-SUNDAY (06:00 PM - 11:00 PM)',
};

const OpeningHoursField = ({
  field,
  label,
  value,
  rows = 3,
  placeholder,
  error,
  touched,
  onChange,
  onBlur,
  required = true,
  optional = false,
}) => {
  const isInvalid = Boolean(touched && error);
  const fieldId = OPENING_HOURS_FIELD_IDS[field];
  const errorId = `${fieldId}-error`;

  return (
    <div>
      <AdminFieldLabel htmlFor={fieldId} required={required} optional={optional}>
        {label}
      </AdminFieldLabel>
      <textarea
        id={fieldId}
        name={field}
        value={value}
        onChange={(event) => onChange(field, event.target.value)}
        onBlur={() => onBlur(field)}
        rows={rows}
        placeholder={placeholder}
        className={isInvalid ? 'admin-input-invalid' : ''}
        aria-invalid={isInvalid}
        aria-describedby={isInvalid ? errorId : undefined}
      />
      {isInvalid ? (
        <p id={errorId} className="admin-field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
};

const OpeningHoursFields = ({
  formData,
  fieldErrors,
  touchedFields,
  onFieldChange,
  onFieldBlur,
}) => (
  <div className="admin-form-group row-split">
    <OpeningHoursField
      field="supermarketTimings"
      label="Supermarket Opening Hours"
      value={formData.supermarketTimings}
      placeholder={OPENING_HOURS_PLACEHOLDERS.supermarket}
      error={fieldErrors.supermarketTimings}
      touched={touchedFields.supermarketTimings}
      onChange={onFieldChange}
      onBlur={onFieldBlur}
    />
    <OpeningHoursField
      field="foodCornerTimings"
      label="Food Corner Opening Hours"
      value={formData.foodCornerTimings}
      placeholder={OPENING_HOURS_PLACEHOLDERS.foodCorner}
      error={fieldErrors.foodCornerTimings}
      touched={touchedFields.foodCornerTimings}
      onChange={onFieldChange}
      onBlur={onFieldBlur}
    />
  </div>
);

const ContactInfoField = ({
  field,
  label,
  value,
  placeholder,
  hint,
  error,
  touched,
  onChange,
  onBlur,
  inputMode,
  required = true,
  optional = false,
}) => {
  const isInvalid = Boolean(touched && error);
  const fieldId = CONTACT_INFO_FIELD_IDS[field];
  const errorId = `${fieldId}-error`;

  return (
    <div>
      <AdminFieldLabel htmlFor={fieldId} required={required} optional={optional}>
        {label}
      </AdminFieldLabel>
      <input
        id={fieldId}
        type="text"
        name={field}
        value={value}
        onChange={(event) => onChange(field, event.target.value)}
        onBlur={() => onBlur(field)}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={field === 'contactEmail' ? 'email' : 'tel'}
        className={isInvalid ? 'admin-input-invalid' : ''}
        aria-invalid={isInvalid}
        aria-describedby={isInvalid ? errorId : hint ? `${fieldId}-hint` : undefined}
      />
      {isInvalid ? (
        <p id={errorId} className="admin-field-error" role="alert">
          {error}
        </p>
      ) : null}
      {hint && !isInvalid ? (
        <p id={`${fieldId}-hint`} className="admin-field-hint">{hint}</p>
      ) : null}
    </div>
  );
};

const ContactInfoFields = ({
  formData,
  fieldErrors,
  touchedFields,
  onFieldChange,
  onFieldBlur,
  phoneHint,
}) => (
  <div className="admin-form-group row-split">
    <ContactInfoField
      field="contactPhone"
      label="Phone Number"
      value={formData.contactPhone}
      placeholder="+31659046526 / +310644234955"
      hint={phoneHint}
      error={fieldErrors.contactPhone}
      touched={touchedFields.contactPhone}
      onChange={onFieldChange}
      onBlur={onFieldBlur}
      inputMode="tel"
    />
    <ContactInfoField
      field="contactEmail"
      label="Email Address"
      value={formData.contactEmail}
      placeholder="info@winswereldwinkel.nl"
      error={fieldErrors.contactEmail}
      touched={touchedFields.contactEmail}
      onChange={onFieldChange}
      onBlur={onFieldBlur}
      inputMode="email"
    />
  </div>
);

const ContactValidatedField = ({
  field,
  label,
  value,
  placeholder,
  hint,
  error,
  touched,
  onChange,
  onBlur,
  multiline = false,
  rows = 2,
  inputMode,
  maxLength,
  fieldId,
  collapseOnBlur,
  required = false,
  optional = false,
}) => {
  const isInvalid = Boolean(touched && error);
  const resolvedId =
    fieldId || CONTACT_SETTINGS_FIELD_IDS[field] || CONTACT_INFO_FIELD_IDS[field] || GENERAL_SETTINGS_FIELD_IDS[field];
  const errorId = `${resolvedId}-error`;
  const shouldCollapse = collapseOnBlur ?? !multiline;

  const handleChange = (event) => {
    let nextValue = event.target.value;
    if (maxLength) nextValue = boundAdminText(nextValue, maxLength);
    onChange(field, nextValue);
  };

  const handleBlur = () => {
    onBlur(field, sanitizeAdminText(value, { collapse: shouldCollapse }));
  };

  const sharedProps = {
    id: resolvedId,
    name: field,
    value: value ?? '',
    onChange: handleChange,
    onBlur: handleBlur,
    placeholder,
    className: isInvalid ? 'admin-input-invalid' : '',
    'aria-invalid': isInvalid,
    'aria-describedby': isInvalid ? errorId : hint ? `${resolvedId}-hint` : undefined,
    ...(maxLength ? { maxLength } : {}),
  };

  return (
    <div>
      <AdminFieldLabel htmlFor={resolvedId} required={required} optional={optional}>
        {label}
      </AdminFieldLabel>
      {multiline ? (
        <textarea {...sharedProps} rows={rows} />
      ) : (
        <input {...sharedProps} type="text" inputMode={inputMode} />
      )}
      <div className="admin-field-meta">
        {isInvalid ? (
          <p id={errorId} className="admin-field-error" role="alert">
            {error}
          </p>
        ) : (
          <span />
        )}
        {maxLength ? (
          <span className="admin-char-counter">{formatCharCounter(value, maxLength)}</span>
        ) : null}
      </div>
      {hint && !isInvalid ? (
        <p id={`${resolvedId}-hint`} className="admin-field-hint">{hint}</p>
      ) : null}
    </div>
  );
};

const buildFormState = (cmsData) => ({
  storeName: cmsData?.storeName || '',
  logo: cmsData?.logo || '',
  footerLogo: cmsData?.footerLogo || cmsData?.logo || '',
  contactEmail: cmsData?.contactEmail || '',
  contactPhone: cmsData?.contactPhone || '',
  address: cmsData?.address || '',
  footerDescription: cmsData?.footerDescription || '',
  supermarketTimings: cmsData?.supermarketTimings || '',
  foodCornerTimings: cmsData?.foodCornerTimings || '',
  contactPage: mergeContactPage(cmsData?.contactPage),
  footerPage: mergeFooterPage(cmsData?.footerPage),
});

const SOCIAL_PREVIEW_ICONS = {
  facebook: FaFacebook,
  instagram: FaInstagram,
  whatsapp: FaWhatsapp,
  tiktok: FaTiktok,
  youtube: FaYoutube,
};

const SOCIAL_PREVIEW_CLASSES = {
  facebook: 'fb',
  instagram: 'ig',
  whatsapp: 'wa',
  tiktok: 'tt',
  youtube: 'yt',
};

const CMS_FIELD_LIMITS = {
  storeName: ADMIN_TEXT_LIMITS.storeName.max,
  address: ADMIN_TEXT_LIMITS.storeAddress.max,
  footerDescription: ADMIN_TEXT_LIMITS.footerDescription.max,
  quickLinkLabel: ADMIN_TEXT_LIMITS.quickLinkLabel.max,
  categoryLabel: ADMIN_TEXT_LIMITS.categoryLabel.max,
  heroBadge: ADMIN_TEXT_LIMITS.contactHeroBadge.max,
  heroTitle: ADMIN_TEXT_LIMITS.contactHeroTitle.max,
  heroSubtitle: ADMIN_TEXT_LIMITS.contactHeroSubtitle.max,
  heroFeature: ADMIN_TEXT_LIMITS.contactHeroFeature.max,
  formLabel: ADMIN_TEXT_LIMITS.contactFormLabel.max,
  placeholder: ADMIN_TEXT_LIMITS.contactPlaceholder.max,
  privacyNote: ADMIN_TEXT_LIMITS.contactPrivacyNote.max,
};

const MULTILINE_CMS_FIELDS = new Set(['heroSubtitle', 'formSubtitle', 'privacyNote', 'address', 'footerDescription']);

const FooterLinkRow = ({ link, onChange, onRemove, showEnabled = true, labelMaxLength }) => (
  <div className="footer-link-row">
    <div className="admin-form-group" style={{ marginBottom: 0 }}>
      <AdminFieldLabel optional>Label</AdminFieldLabel>
      <input
        type="text"
        value={link.label}
        onChange={(e) => onChange('label', labelMaxLength ? boundAdminText(e.target.value, labelMaxLength) : e.target.value)}
        onBlur={(e) => onChange('label', sanitizeAdminText(e.target.value))}
        placeholder="Link text"
        maxLength={labelMaxLength}
      />
      {labelMaxLength ? (
        <span className="admin-char-counter">{formatCharCounter(link.label, labelMaxLength)}</span>
      ) : null}
    </div>
    <div className="admin-form-group" style={{ marginBottom: 0 }}>
      <AdminFieldLabel optional>Path / URL</AdminFieldLabel>
      <input
        type="text"
        value={link.path}
        onChange={(e) => onChange('path', e.target.value)}
        placeholder="/products or https://..."
      />
    </div>
    {showEnabled && (
      <label className="footer-link-toggle">
        <input
          type="checkbox"
          checked={link.enabled !== false}
          onChange={(e) => onChange('enabled', e.target.checked)}
        />
        Show
      </label>
    )}
    <button type="button" className="footer-link-remove" onClick={onRemove} aria-label="Remove link">
      <FaTrash />
    </button>
  </div>
);

const LegalFooterLinkRow = ({
  link,
  errors = {},
  touched = {},
  onChange,
  onBlur,
  onRemove,
}) => {
  const showLabelError = errors.label && (touched.label || errors.label === LABEL_DUPLICATE);
  const showPathError = errors.path && (touched.path || errors.path === PATH_DUPLICATE);

  return (
    <div className="footer-link-row">
      <div className="admin-form-group" style={{ marginBottom: 0 }}>
        <AdminFieldLabel htmlFor={`legal-link-${link.id}-label`} required>
          Label
        </AdminFieldLabel>
        <input
          id={`legal-link-${link.id}-label`}
          type="text"
          maxLength={LEGAL_LINK_LABEL_MAX}
          value={link.label}
          onChange={(e) => onChange('label', e.target.value)}
          onBlur={() => onBlur('label')}
          placeholder="Link text"
          className={showLabelError ? 'admin-input-invalid' : ''}
          aria-invalid={showLabelError ? 'true' : undefined}
        />
        {showLabelError && (
          <p className="admin-field-error" role="alert">
            {errors.label}
          </p>
        )}
      </div>
      <div className="admin-form-group" style={{ marginBottom: 0 }}>
        <AdminFieldLabel htmlFor={`legal-link-${link.id}-path`} required>
          Path / URL
        </AdminFieldLabel>
        <input
          id={`legal-link-${link.id}-path`}
          type="text"
          maxLength={LEGAL_LINK_PATH_MAX}
          value={link.path}
          onChange={(e) => onChange('path', e.target.value)}
          onBlur={() => onBlur('path')}
          placeholder="/terms or https://..."
          className={showPathError ? 'admin-input-invalid' : ''}
          aria-invalid={showPathError ? 'true' : undefined}
        />
        {showPathError && (
          <p className="admin-field-error" role="alert">
            {errors.path}
          </p>
        )}
      </div>
      <label className="footer-link-toggle">
        <input
          type="checkbox"
          checked={link.enabled !== false}
          onChange={(e) => onChange('enabled', e.target.checked)}
        />
        Show
      </label>
      <button type="button" className="footer-link-remove" onClick={onRemove} aria-label="Remove link">
        <FaTrash />
      </button>
    </div>
  );
};

const SocialLinkRow = ({ link, onChange, onRemove }) => (
  <div className="footer-link-row footer-social-link-row">
    <div className="admin-form-group" style={{ marginBottom: 0 }}>
      <AdminFieldLabel optional>Platform</AdminFieldLabel>
      <select
        value={link.platform}
        onChange={(e) => onChange('platform', e.target.value)}
      >
        {SOCIAL_PLATFORM_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
    <div className="admin-form-group" style={{ marginBottom: 0 }}>
      <AdminFieldLabel optional>Profile URL</AdminFieldLabel>
      <input
        type="url"
        value={link.url}
        onChange={(e) => onChange('url', e.target.value)}
        placeholder="https://facebook.com/yourpage"
      />
    </div>
    <label className="footer-link-toggle">
      <input
        type="checkbox"
        checked={link.enabled !== false}
        onChange={(e) => onChange('enabled', e.target.checked)}
      />
      Show
    </label>
    <button type="button" className="footer-link-remove" onClick={onRemove} aria-label="Remove social link">
      <FaTrash />
    </button>
  </div>
);

const FooterPreview = ({ formData }) => {
  const footer = formData.footerPage;
  const quickLinks = footer.quickLinks.filter((l) => l.enabled && l.label);
  const [categoryLinks, setCategoryLinks] = useState([]);
  const legalLinks = footer.legalLinks.filter((l) => l.enabled && l.label);
  const socialLinks = (footer.socialLinks || []).filter((l) => l.enabled && l.url);

  useEffect(() => {
    let mounted = true;

    categoryService
      .getCategories({ admin: true })
      .then((list) => {
        if (!mounted) return;
        setCategoryLinks(mapProductCategoriesToFooterLinks(list));
      })
      .catch(() => {
        if (mounted) setCategoryLinks([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="footer-admin-preview">
      <p className="footer-admin-preview-label">Live Preview</p>
      <div className="footer-admin-preview-inner">
        <div className="footer-admin-preview-grid">
          <div className="footer-admin-preview-col brand">
            <img src={getImageUrl(formData.footerLogo || formData.logo) || '/logo.png'} alt="Logo" className="footer-admin-preview-logo" />
            <p>{formData.footerDescription || 'Footer description...'}</p>
            {socialLinks.length > 0 && (
              <div className="footer-admin-preview-socials">
                {socialLinks.map((link) => {
                  const Icon = SOCIAL_PREVIEW_ICONS[link.platform];
                  if (!Icon) return null;
                  return (
                    <span key={link.id} className={SOCIAL_PREVIEW_CLASSES[link.platform] || link.platform} title={link.platform}>
                      <Icon />
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          <div className="footer-admin-preview-col">
            <h5>{footer.quickLinksTitle}</h5>
            <ul>{quickLinks.map((l) => <li key={l.id}>{l.label}</li>)}</ul>
          </div>
          <div className="footer-admin-preview-col">
            <h5>{footer.categoriesTitle}</h5>
            <ul>{categoryLinks.map((l) => <li key={l.id}>{l.label}</li>)}</ul>
          </div>
          <div className="footer-admin-preview-col">
            <h5>{footer.businessHoursTitle}</h5>
            <p><FiClock /> {footer.supermarketLabel}</p>
            <small>{formData.supermarketTimings}</small>
            <p><FiClock /> {footer.foodCornerLabel}</p>
            <small>{formData.foodCornerTimings}</small>
            {footer.sundayHours && <small>{footer.sundayHours}</small>}
          </div>
          <div className="footer-admin-preview-col">
            <h5>{footer.contactTitle}</h5>
            <p><FiMapPin /> {formData.address}</p>
            <p><FiPhone /> {formData.contactPhone}</p>
            <p><FiMail /> {formData.contactEmail}</p>
          </div>
        </div>
        <div className="footer-admin-preview-bottom">
          <div>{legalLinks.map((l) => <span key={l.id}>{l.label}</span>)}</div>
          <p>&copy; {new Date().getFullYear()} {footer.copyrightText || formData.storeName}. All Rights Reserved.</p>
        </div>
      </div>
    </div>
  );
};

export const AdminSiteSettings = () => {
  const { cmsData, updateFooterData, refreshCMS, patchCmsTimings } = useCMS();
  const { addToast } = useToast();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [openingHoursErrors, setOpeningHoursErrors] = useState({});
  const [openingHoursTouched, setOpeningHoursTouched] = useState({});
  const [contactInfoErrors, setContactInfoErrors] = useState({});
  const [contactInfoTouched, setContactInfoTouched] = useState({});
  const [contactSettingsErrors, setContactSettingsErrors] = useState({});
  const [contactSettingsTouched, setContactSettingsTouched] = useState({});
  const [legalLinkErrors, setLegalLinkErrors] = useState({});
  const [legalLinkTouched, setLegalLinkTouched] = useState({});
  const [formInitialized, setFormInitialized] = useState(false);

  const resetValidationState = () => {
    setOpeningHoursErrors({});
    setOpeningHoursTouched({});
    setContactInfoErrors({});
    setContactInfoTouched({});
    setContactSettingsErrors({});
    setContactSettingsTouched({});
    setLegalLinkErrors({});
    setLegalLinkTouched({});
  };

  const [formData, setFormData] = useState({
    ...buildFormState(null),
    contactPage: emptyContactPageForm(),
    footerPage: emptyFooterPageForm(),
  });

  const allowedTabs = ['general', 'contact', 'footer'];

  useEffect(() => {
    const tab = location.state?.settingsTab;
    if (tab && allowedTabs.includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.state?.settingsTab]);

  useEffect(() => {
    let isMounted = true;

    const initForm = async () => {
      const base = buildFormState(cmsData);
      let next = { ...base };

      const [siteResult, contactResult, footerResult] = await Promise.allSettled([
        siteSettingsService.getSiteSettings(),
        contactSettingsService.getContactSettings(),
        footerService.getFooterSettings(),
      ]);

      if (siteResult.status === 'fulfilled' && siteResult.value && isMounted) {
        const siteSettings = siteResult.value;
        next = {
          ...next,
          storeName: siteSettings.storeName ?? next.storeName,
          logo: siteSettings.storeLogo ?? next.logo,
          address: siteSettings.physicalAddress ?? next.address,
          supermarketTimings:
            siteSettings.supermarketOpeningHours ?? next.supermarketTimings,
          foodCornerTimings:
            siteSettings.foodCornerOpeningHours ?? next.foodCornerTimings,
        };
      } else if (siteResult.status === 'rejected') {
        console.warn('Site settings API unavailable, using CMS fallback.', siteResult.reason);
      }

      if (contactResult.status === 'fulfilled' && contactResult.value && isMounted) {
        next = mergeContactSettingsIntoForm(next, contactResult.value);
      } else if (contactResult.status === 'rejected') {
        console.warn('Contact settings API unavailable, using CMS fallback.', contactResult.reason);
      }

      if (footerResult.status === 'fulfilled' && footerResult.value && isMounted) {
        const footerData = footerResult.value;
        next = {
          ...next,
          footerDescription: footerData.footerDescription ?? next.footerDescription,
          footerLogo: footerData.logo ?? next.footerLogo ?? next.logo,
          footerPage: mergeFooterPage({
            ...next.footerPage,
            ...footerData.footerPage,
          }),
        };
      } else if (footerResult.status === 'rejected') {
        console.warn('Footer settings API unavailable, using CMS fallback.', footerResult.reason);
      }

      if (isMounted) {
        setFormData(next);
        resetValidationState();
        setFormInitialized(true);
      }
    };

    initForm().catch((err) => {
      console.error('Failed to initialize site settings form', err);
      if (isMounted) {
        setFormInitialized(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'contactPhone' || name === 'contactEmail') {
      handleContactInfoChange(name, value);
      return;
    }

    if (name === 'storeName' || name === 'address' || name === 'footerDescription') {
      handleContactSettingsChange(name, value);
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'supermarketTimings' || name === 'foodCornerTimings') {
      setOpeningHoursTouched((prev) => ({ ...prev, [name]: true }));
      setOpeningHoursErrors((prev) => ({
        ...prev,
        [name]: validateOpeningHoursField(value, name),
      }));
    }
  };

  const validateContactInfoField = (field, value) =>
    field === 'contactPhone' ? validateContactPhone(value) : validateContactEmail(value);

  const handleContactInfoChange = (field, value) => {
    const nextValue = field === 'contactPhone' ? sanitizeContactPhoneInput(value) : value;

    setFormData((prev) => ({ ...prev, [field]: nextValue }));
    setContactInfoTouched((prev) => ({ ...prev, [field]: true }));
    setContactInfoErrors((prev) => ({
      ...prev,
      [field]: validateContactInfoField(field, nextValue),
    }));
  };

  const handleContactInfoBlur = (field) => {
    setContactInfoTouched((prev) => ({ ...prev, [field]: true }));
    setContactInfoErrors((prev) => ({
      ...prev,
      [field]: validateContactInfoField(field, formData[field]),
    }));
  };

  const validateContactInfoBeforeSave = () => {
    const validation = validateContactInfoForm(formData);

    if (!validation.isValid) {
      setContactInfoErrors(validation.fieldErrors);
      setContactInfoTouched((prev) => ({
        ...prev,
        ...Object.fromEntries(
          Object.keys(validation.fieldErrors).map((field) => [field, true])
        ),
      }));
      focusFirstContactInfoError(validation.fieldErrors);
      addToast('Please fix the contact information errors before saving.', 'error');
      return false;
    }

    setContactInfoErrors({});
    return true;
  };

  const handleContactSettingsChange = (field, value) => {
    const nextValue = field === 'contactPhone' ? sanitizeContactPhoneInput(value) : value;
    const nextFormData = CONTACT_PAGE_FIELDS.has(field)
      ? { ...formData, contactPage: { ...formData.contactPage, [field]: nextValue } }
      : { ...formData, [field]: nextValue };

    setFormData(nextFormData);
    setContactSettingsTouched((prev) => ({ ...prev, [field]: true }));
    setContactSettingsErrors((prev) => ({
      ...prev,
      [field]: validateContactSettingsField(field, nextFormData),
    }));
  };

  const handleContactSettingsBlur = (field, sanitizedValue) => {
    const shouldCollapse = !MULTILINE_CMS_FIELDS.has(field);
    const sanitized =
      sanitizedValue ??
      sanitizeAdminText(getContactSettingsFieldValue(formData, field), { collapse: shouldCollapse });
    const current = getContactSettingsFieldValue(formData, field);
    const nextFormData =
      sanitized !== current
        ? CONTACT_PAGE_FIELDS.has(field)
          ? { ...formData, contactPage: { ...formData.contactPage, [field]: sanitized } }
          : { ...formData, [field]: sanitized }
        : formData;

    if (nextFormData !== formData) {
      setFormData(nextFormData);
    }

    setContactSettingsTouched((prev) => ({ ...prev, [field]: true }));
    setContactSettingsErrors((prev) => ({
      ...prev,
      [field]: validateContactSettingsField(field, nextFormData),
    }));
  };

  const validateGeneralSettingsBeforeSave = () => {
    const validation = validateGeneralSettingsForm(formData);

    if (!validation.isValid) {
      setContactSettingsErrors((prev) => ({ ...prev, ...validation.fieldErrors }));
      setContactSettingsTouched((prev) => ({
        ...prev,
        ...Object.fromEntries(Object.keys(validation.fieldErrors).map((field) => [field, true])),
      }));
      focusFirstGeneralSettingsError(validation.fieldErrors);
      addToast('Please fix the general settings errors before saving.', 'error');
      return false;
    }

    return true;
  };

  const validateFooterTextBeforeSave = () => {
    const validation = validateFooterTextForm(formData);

    if (!validation.isValid) {
      setContactSettingsErrors((prev) => ({ ...prev, ...validation.fieldErrors }));
      setContactSettingsTouched((prev) => ({
        ...prev,
        ...Object.fromEntries(Object.keys(validation.fieldErrors).map((field) => [field, true])),
      }));
      focusFirstFooterTextError(validation.fieldErrors);
      addToast('Please fix the footer description before saving.', 'error');
      return false;
    }

    return true;
  };

  const validateContactSettingsBeforeSave = () => {
    const validation = validateContactSettingsForm(formData);

    if (!validation.isValid) {
      setContactSettingsErrors(validation.fieldErrors);
      setContactSettingsTouched((prev) => ({
        ...prev,
        ...Object.fromEntries(
          Object.keys(validation.fieldErrors).map((field) => [field, true])
        ),
      }));
      focusFirstContactSettingsError(validation.fieldErrors);
      addToast('Please fix the required contact page fields before saving.', 'error');
      return false;
    }

    setContactSettingsErrors({});
    return true;
  };

  const handleOpeningHoursChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setOpeningHoursTouched((prev) => ({ ...prev, [field]: true }));
    setOpeningHoursErrors((prev) => ({
      ...prev,
      [field]: validateOpeningHoursField(value, field),
    }));
  };

  const handleOpeningHoursBlur = (field) => {
    setOpeningHoursTouched((prev) => ({ ...prev, [field]: true }));
    setOpeningHoursErrors((prev) => ({
      ...prev,
      [field]: validateOpeningHoursField(formData[field], field),
    }));
  };

  const validateOpeningHoursBeforeSave = () => {
    const validation = validateOpeningHoursForm(formData);

    if (!validation.isValid) {
      setOpeningHoursErrors(validation.fieldErrors);
      setOpeningHoursTouched((prev) => ({
        ...prev,
        ...Object.fromEntries(
          Object.keys(validation.fieldErrors).map((field) => [field, true])
        ),
      }));
      focusFirstOpeningHoursError(validation.fieldErrors);
      addToast('Please fix the opening hours errors before saving.', 'error');
      return false;
    }

    setOpeningHoursErrors({});
    return true;
  };

  const applyOpeningHoursToStorefront = (timings) => {
    patchCmsTimings({
      supermarketTimings: timings.supermarketTimings,
      foodCornerTimings: timings.foodCornerTimings,
    });
    notifyCmsSettingsUpdated();
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (rejectInvalidCmsImageFile(file, (msg) => addToast(msg, 'error'), e.target)) return;

    if (file.size > 2 * 1024 * 1024) {
      addToast('File too large. Max size is 2MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, logo: reader.result }));
      addToast('Logo loaded. Save settings to apply.', 'info');
    };
    reader.readAsDataURL(file);
  };

  const handleFooterLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (rejectInvalidCmsImageFile(file, (msg) => addToast(msg, 'error'), e.target)) return;

    if (file.size > 2 * 1024 * 1024) {
      addToast('File too large. Max size is 2MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, footerLogo: reader.result }));
      addToast('Footer logo loaded. Save settings to apply.', 'info');
    };
    reader.readAsDataURL(file);
  };

  const updateContactPage = (field, value) => {
    if (CONTACT_PAGE_FIELDS.has(field)) {
      handleContactSettingsChange(field, value);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      contactPage: { ...prev.contactPage, [field]: value },
    }));
  };

  const updateFooterPage = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      footerPage: { ...prev.footerPage, [field]: value },
    }));
  };

  const updateFooterLinks = (listKey, index, field, value) => {
    setFormData((prev) => {
      const links = [...prev.footerPage[listKey]];
      links[index] = { ...links[index], [field]: value };
      return { ...prev, footerPage: { ...prev.footerPage, [listKey]: links } };
    });
  };

  const addFooterLink = (listKey) => {
    setFormData((prev) => ({
      ...prev,
      footerPage: {
        ...prev.footerPage,
        [listKey]: [
          ...prev.footerPage[listKey],
          {
            id: `${listKey}-${Date.now()}`,
            label: '',
            path: listKey === 'legalLinks' ? '' : '/',
            enabled: true,
          },
        ],
      },
    }));
  };

  const buildLegalLinkErrors = (links, touched, { forceAll = false } = {}) => {
    const { rowErrors } = validateLegalLinksForm(links);
    const nextErrors = {};

    links.forEach((link) => {
      const errors = rowErrors[link.id] || {};
      const rowTouched = touched[link.id] || {};
      const isDuplicateLabel = errors.label === LABEL_DUPLICATE;
      const isDuplicatePath = errors.path === PATH_DUPLICATE;

      nextErrors[link.id] = {
        label:
          errors.label && (forceAll || rowTouched.label || isDuplicateLabel) ? errors.label : '',
        path: errors.path && (forceAll || rowTouched.path || isDuplicatePath) ? errors.path : '',
      };
    });

    return nextErrors;
  };

  const updateLegalLink = (index, field, value) => {
    const links = [...formData.footerPage.legalLinks];
    links[index] = { ...links[index], [field]: value };
    const linkId = links[index].id;

    setFormData((prev) => ({
      ...prev,
      footerPage: { ...prev.footerPage, legalLinks: links },
    }));

    const nextTouched = {
      ...legalLinkTouched,
      [linkId]: { ...legalLinkTouched[linkId], [field]: true },
    };
    setLegalLinkTouched(nextTouched);
    setLegalLinkErrors(buildLegalLinkErrors(links, nextTouched));
  };

  const handleLegalLinkBlur = (index, field) => {
    const links = formData.footerPage.legalLinks;
    const linkId = links[index].id;
    const nextTouched = {
      ...legalLinkTouched,
      [linkId]: { ...legalLinkTouched[linkId], [field]: true },
    };
    setLegalLinkTouched(nextTouched);
    setLegalLinkErrors(buildLegalLinkErrors(links, nextTouched));
  };

  const removeLegalLink = (index) => {
    const links = formData.footerPage.legalLinks;
    const linkId = links[index]?.id;
    const remaining = links.filter((_, i) => i !== index);

    setFormData((prev) => ({
      ...prev,
      footerPage: {
        ...prev.footerPage,
        legalLinks: remaining,
      },
    }));

    const nextTouched = { ...legalLinkTouched };
    if (linkId) {
      delete nextTouched[linkId];
    }
    setLegalLinkTouched(nextTouched);
    setLegalLinkErrors(buildLegalLinkErrors(remaining, nextTouched));
  };

  const validateLegalLinksBeforeSave = () => {
    const links = formData.footerPage.legalLinks;
    const validation = validateLegalLinksForm(links);

    if (!validation.isValid) {
      const allTouched = Object.fromEntries(
        links.map((link) => [link.id, { label: true, path: true }])
      );
      setLegalLinkTouched(allTouched);
      setLegalLinkErrors(buildLegalLinkErrors(links, allTouched, { forceAll: true }));
      focusFirstLegalLinkError(validation.rowErrors);
      addToast('Please fix the legal link errors before saving.', 'error');
      return false;
    }

    setLegalLinkErrors({});
    return true;
  };

  const removeFooterLink = (listKey, index) => {
    setFormData((prev) => ({
      ...prev,
      footerPage: {
        ...prev.footerPage,
        [listKey]: prev.footerPage[listKey].filter((_, i) => i !== index),
      },
    }));
  };

  const updateSocialLinks = (index, field, value) => {
    setFormData((prev) => {
      const links = [...(prev.footerPage.socialLinks || [])];
      links[index] = { ...links[index], [field]: value };
      return { ...prev, footerPage: { ...prev.footerPage, socialLinks: links } };
    });
  };

  const addSocialLink = () => {
    setFormData((prev) => ({
      ...prev,
      footerPage: {
        ...prev.footerPage,
        socialLinks: [
          ...(prev.footerPage.socialLinks || []),
          { id: `sm-${Date.now()}`, platform: 'facebook', url: '', enabled: true },
        ],
      },
    }));
  };

  const removeSocialLink = (index) => {
    setFormData((prev) => ({
      ...prev,
      footerPage: {
        ...prev.footerPage,
        socialLinks: (prev.footerPage.socialLinks || []).filter((_, i) => i !== index),
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (activeTab === 'general' && !validateGeneralSettingsBeforeSave()) {
      return;
    }

    if (activeTab === 'contact' && !validateContactSettingsBeforeSave()) {
      return;
    }

    if (activeTab === 'footer' && !validateFooterTextBeforeSave()) {
      return;
    }

    if (activeTab === 'footer' && !validateContactInfoBeforeSave()) {
      return;
    }

    if (activeTab === 'footer' && !validateLegalLinksBeforeSave()) {
      return;
    }

    if (['general', 'contact', 'footer'].includes(activeTab) && !validateOpeningHoursBeforeSave()) {
      return;
    }

    setIsSaving(true);
    try {
      if (activeTab === 'contact') {
        const updated = await contactSettingsService.updateContactSettings(formData);
        applyOpeningHoursToStorefront({
          supermarketTimings: formData.supermarketTimings,
          foodCornerTimings: formData.foodCornerTimings,
        });
        await refreshCMS();
        setFormData((prev) => mergeContactSettingsIntoForm(prev, updated));
        resetValidationState();
        addToast('Contact settings updated successfully!', 'success');
      } else if (activeTab === 'footer') {
        const sanitizedFormData = {
          ...formData,
          footerPage: {
            ...formData.footerPage,
            legalLinks: formData.footerPage.legalLinks.map((link) => ({
              ...link,
              label: sanitizeLegalLinkLabel(link.label),
              path: sanitizeLegalLinkPath(link.path),
            })),
          },
        };
        const updated = await updateFooterData(sanitizedFormData);
        await refreshCMS();
        setFormData((prev) => ({
          ...prev,
          footerDescription: updated.footerDescription ?? prev.footerDescription,
          footerLogo: updated.logo ?? prev.footerLogo,
          footerPage: mergeFooterPage({
            ...prev.footerPage,
            ...updated.footerPage,
          }),
        }));
        resetValidationState();
        addToast('Footer settings updated successfully!', 'success');
      } else if (activeTab === 'general') {
        await siteSettingsService.updateSiteSettings(formData);
        applyOpeningHoursToStorefront({
          supermarketTimings: formData.supermarketTimings,
          foodCornerTimings: formData.foodCornerTimings,
        });
        await refreshCMS();
        const refreshed = await siteSettingsService.getSiteSettings();
        setFormData((prev) => ({
          ...prev,
          storeName: refreshed.storeName || prev.storeName,
          logo: refreshed.storeLogo || prev.logo,
          address: refreshed.physicalAddress || prev.address,
          supermarketTimings: refreshed.supermarketOpeningHours ?? prev.supermarketTimings,
          foodCornerTimings: refreshed.foodCornerOpeningHours ?? prev.foodCornerTimings,
        }));
        addToast('Settings updated successfully', 'success');
      }
    } catch (err) {
      console.error('Failed to update settings', err);
      addToast(err.message || 'Failed to update settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!formInitialized) {
    return (
      <div className="settings-loading-skeleton" style={{ background: 'white', padding: '40px', borderRadius: '16px', animation: 'pulse 1.5s infinite ease-in-out' }}>
        <div style={{ height: '30px', width: '200px', background: '#cbd5e1', marginBottom: '20px' }}></div>
        <div style={{ height: '200px', background: '#cbd5e1' }}></div>
      </div>
    );
  }

  return (
    <div className="settings-tabs-container">
      {/* Sidebar Tabs list */}
      <div className="settings-tabs-list">
        <button 
          className={`settings-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          General Settings
        </button>
        <button 
          className={`settings-tab-btn ${activeTab === 'contact' ? 'active' : ''}`}
          onClick={() => setActiveTab('contact')}
        >
          Contact Us Settings
        </button>
        <button 
          className={`settings-tab-btn ${activeTab === 'footer' ? 'active' : ''}`}
          onClick={() => setActiveTab('footer')}
        >
          Footer Details
        </button>
      </div>

      {/* Forms content side */}
      <div className="settings-form-content">
        <form onSubmit={handleSubmit} noValidate>
          {activeTab === 'general' && (
            <div>
              <h3>General Settings</h3>
              <div className="admin-form-group">
                <ContactValidatedField
                  field="storeName"
                  fieldId={GENERAL_SETTINGS_FIELD_IDS.storeName}
                  label="Store Name"
                  required
                  value={formData.storeName}
                  placeholder="e.g. Ins Wereld Winkel"
                  maxLength={CMS_FIELD_LIMITS.storeName}
                  error={contactSettingsErrors.storeName}
                  touched={contactSettingsTouched.storeName}
                  onChange={handleContactSettingsChange}
                  onBlur={handleContactSettingsBlur}
                />
              </div>
              <div className="admin-form-group">
                <AdminFieldLabel htmlFor="logo-file" optional>Store Logo</AdminFieldLabel>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  {formData.logo && (
                    <img 
                      src={getImageUrl(formData.logo)} 
                      alt="Logo preview" 
                      style={{ height: '80px', width: 'auto', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px', background: 'white' }} 
                    />
                  )}
                  <div className="image-upload-zone" style={{ flex: 1, padding: '16px' }}>
                    <input 
                      type="file" 
                      accept={CMS_IMAGE_ACCEPT} 
                      id="logo-file" 
                      onChange={handleLogoUpload} 
                      style={{ display: 'none' }} 
                    />
                    <label htmlFor="logo-file" style={{ cursor: 'pointer', margin: 0 }}>
                      <FaUpload className="upload-icon" style={{ fontSize: '1.5rem', marginBottom: '4px' }} />
                      <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Select store logo image (Max 2MB)</p>
                    </label>
                  </div>
                </div>
              </div>
              <div className="admin-form-group">
                <ContactValidatedField
                  field="address"
                  fieldId={GENERAL_SETTINGS_FIELD_IDS.address}
                  label="Physical Address"
                  required
                  value={formData.address}
                  placeholder="Amsterdam, Netherlands"
                  maxLength={CMS_FIELD_LIMITS.address}
                  multiline
                  rows={3}
                  collapseOnBlur={false}
                  error={contactSettingsErrors.address}
                  touched={contactSettingsTouched.address}
                  onChange={handleContactSettingsChange}
                  onBlur={handleContactSettingsBlur}
                />
              </div>
              <OpeningHoursFields
                formData={formData}
                fieldErrors={openingHoursErrors}
                touchedFields={openingHoursTouched}
                onFieldChange={handleOpeningHoursChange}
                onFieldBlur={handleOpeningHoursBlur}
              />
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="about-settings-sections">
              <h3>Contact Us Page Settings</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}>
                Manage contact information and the message form shown on the Contact page.
              </p>

              <div className="settings-subsection">
                <h4>1. Contact Information</h4>
                <div className="admin-form-group row-split">
                  <ContactValidatedField
                    field="contactPhone"
                    label="Phone Number"
                    required
                    value={formData.contactPhone}
                    placeholder="+31659046526 / +310644234955"
                    hint="Separate multiple numbers with / for the help box (e.g. +31659046526 / +310644234955)."
                    error={contactSettingsErrors.contactPhone}
                    touched={contactSettingsTouched.contactPhone}
                    onChange={handleContactSettingsChange}
                    onBlur={handleContactSettingsBlur}
                    inputMode="tel"
                  />
                  <ContactValidatedField
                    field="contactEmail"
                    label="Email Address"
                    required
                    value={formData.contactEmail}
                    placeholder="info@winswereldwinkel.nl"
                    error={contactSettingsErrors.contactEmail}
                    touched={contactSettingsTouched.contactEmail}
                    onChange={handleContactSettingsChange}
                    onBlur={handleContactSettingsBlur}
                    inputMode="email"
                  />
                </div>
                <div className="admin-form-group">
                  <ContactValidatedField
                    field="storeName"
                    label="Store Name (Location Line 1)"
                    required
                    value={formData.storeName}
                    placeholder="Ins Wereld Winkel"
                    maxLength={CMS_FIELD_LIMITS.storeName}
                    error={contactSettingsErrors.storeName}
                    touched={contactSettingsTouched.storeName}
                    onChange={handleContactSettingsChange}
                    onBlur={handleContactSettingsBlur}
                  />
                </div>
                <div className="admin-form-group">
                  <ContactValidatedField
                    field="address"
                    label="Store Address (Location Line 2)"
                    optional
                    value={formData.address}
                    placeholder="Amsterdam, Netherlands (optional)"
                    maxLength={CMS_FIELD_LIMITS.address}
                    multiline
                    rows={2}
                    collapseOnBlur={false}
                    error={contactSettingsErrors.address}
                    touched={contactSettingsTouched.address}
                    onChange={handleContactSettingsChange}
                    onBlur={handleContactSettingsBlur}
                  />
                </div>
                <OpeningHoursFields
                  formData={formData}
                  fieldErrors={openingHoursErrors}
                  touchedFields={openingHoursTouched}
                  onFieldChange={handleOpeningHoursChange}
                  onFieldBlur={handleOpeningHoursBlur}
                />
                <div className="admin-form-group">
                  <AdminFieldLabel htmlFor="contact-holiday-hours" optional>Holiday Hours Note</AdminFieldLabel>
                  <input
                    id="contact-holiday-hours"
                    type="text"
                    value={formData.contactPage.holidayHours}
                    onChange={(e) => updateContactPage('holidayHours', e.target.value)}
                    placeholder="Opens as Announced"
                  />
                </div>
              </div>

              <div className="settings-subsection">
                <h4>2. Page Hero</h4>
                <div className="admin-form-group row-split">
                  <ContactValidatedField
                    field="heroBadge"
                    label="Hero Badge"
                    required
                    value={formData.contactPage.heroBadge}
                    maxLength={CMS_FIELD_LIMITS.heroBadge}
                    error={contactSettingsErrors.heroBadge}
                    touched={contactSettingsTouched.heroBadge}
                    onChange={handleContactSettingsChange}
                    onBlur={handleContactSettingsBlur}
                  />
                  <ContactValidatedField
                    field="heroTitle"
                    label="Hero Title"
                    required
                    value={formData.contactPage.heroTitle}
                    maxLength={CMS_FIELD_LIMITS.heroTitle}
                    error={contactSettingsErrors.heroTitle}
                    touched={contactSettingsTouched.heroTitle}
                    onChange={handleContactSettingsChange}
                    onBlur={handleContactSettingsBlur}
                  />
                </div>
                <div className="admin-form-group">
                  <ContactValidatedField
                    field="heroSubtitle"
                    label="Hero Subtitle"
                    required
                    value={formData.contactPage.heroSubtitle}
                    maxLength={CMS_FIELD_LIMITS.heroSubtitle}
                    multiline
                    rows={2}
                    collapseOnBlur={false}
                    error={contactSettingsErrors.heroSubtitle}
                  touched={contactSettingsTouched.heroSubtitle}
                  onChange={handleContactSettingsChange}
                  onBlur={handleContactSettingsBlur}
                  />
                </div>
                <div className="admin-form-group row-split">
                  <ContactValidatedField
                    field="heroFeature1"
                    label="Hero Feature 1"
                    required
                    value={formData.contactPage.heroFeature1}
                    maxLength={CMS_FIELD_LIMITS.heroFeature}
                    error={contactSettingsErrors.heroFeature1}
                    touched={contactSettingsTouched.heroFeature1}
                    onChange={handleContactSettingsChange}
                    onBlur={handleContactSettingsBlur}
                  />
                  <ContactValidatedField
                    field="heroFeature2"
                    label="Hero Feature 2"
                    required
                    value={formData.contactPage.heroFeature2}
                    maxLength={CMS_FIELD_LIMITS.heroFeature}
                    error={contactSettingsErrors.heroFeature2}
                    touched={contactSettingsTouched.heroFeature2}
                    onChange={handleContactSettingsChange}
                    onBlur={handleContactSettingsBlur}
                  />
                  <ContactValidatedField
                    field="heroFeature3"
                    label="Hero Feature 3"
                    required
                    value={formData.contactPage.heroFeature3}
                    maxLength={CMS_FIELD_LIMITS.heroFeature}
                    error={contactSettingsErrors.heroFeature3}
                    touched={contactSettingsTouched.heroFeature3}
                    onChange={handleContactSettingsChange}
                    onBlur={handleContactSettingsBlur}
                  />
                </div>
              </div>

              <div className="settings-subsection">
                <h4>3. Contact Information Card</h4>
                <div className="admin-form-group row-split">
                  <ContactValidatedField
                    field="infoCardTitle"
                    label="Info Card Title"
                    required
                    value={formData.contactPage.infoCardTitle}
                    placeholder="Contact Information"
                    error={contactSettingsErrors.infoCardTitle}
                    touched={contactSettingsTouched.infoCardTitle}
                    onChange={handleContactSettingsChange}
                    onBlur={handleContactSettingsBlur}
                  />
                  <ContactValidatedField
                    field="infoCardSubtitle"
                    label="Info Card Subtitle"
                    required
                    value={formData.contactPage.infoCardSubtitle}
                    placeholder="Find our phone, email, location..."
                    error={contactSettingsErrors.infoCardSubtitle}
                    touched={contactSettingsTouched.infoCardSubtitle}
                    onChange={handleContactSettingsChange}
                    onBlur={handleContactSettingsBlur}
                  />
                </div>
              </div>

              <div className="settings-subsection">
                <h4>4. Send Us a Message Form</h4>
                <div className="admin-form-group row-split">
                  <ContactValidatedField
                    field="formTitle"
                    label="Form Title"
                    required
                    value={formData.contactPage.formTitle}
                    error={contactSettingsErrors.formTitle}
                    touched={contactSettingsTouched.formTitle}
                    onChange={handleContactSettingsChange}
                    onBlur={handleContactSettingsBlur}
                  />
                  <ContactValidatedField
                    field="submitButtonText"
                    label="Submit Button Text"
                    required
                    value={formData.contactPage.submitButtonText}
                    error={contactSettingsErrors.submitButtonText}
                    touched={contactSettingsTouched.submitButtonText}
                    onChange={handleContactSettingsChange}
                    onBlur={handleContactSettingsBlur}
                  />
                </div>
                <div className="admin-form-group">
                  <ContactValidatedField
                    field="formSubtitle"
                    label="Form Subtitle"
                    required
                    value={formData.contactPage.formSubtitle}
                    error={contactSettingsErrors.formSubtitle}
                  touched={contactSettingsTouched.formSubtitle}
                  onChange={handleContactSettingsChange}
                  onBlur={handleContactSettingsBlur}
                  />
                </div>
                <div className="admin-form-group row-split">
                  <ContactValidatedField
                    field="nameLabel"
                    label="Full Name Label"
                    required
                    value={formData.contactPage.nameLabel}
                    maxLength={CMS_FIELD_LIMITS.formLabel}
                    error={contactSettingsErrors.nameLabel}
                    touched={contactSettingsTouched.nameLabel}
                    onChange={handleContactSettingsChange}
                    onBlur={handleContactSettingsBlur}
                  />
                  <ContactValidatedField
                    field="namePlaceholder"
                    label="Full Name Placeholder"
                    required
                    value={formData.contactPage.namePlaceholder}
                    maxLength={CMS_FIELD_LIMITS.placeholder}
                    error={contactSettingsErrors.namePlaceholder}
                    touched={contactSettingsTouched.namePlaceholder}
                    onChange={handleContactSettingsChange}
                    onBlur={handleContactSettingsBlur}
                  />
                </div>
                <div className="admin-form-group row-split">
                  <ContactValidatedField
                    field="emailLabel"
                    label="Email Label"
                    required
                    value={formData.contactPage.emailLabel}
                    maxLength={CMS_FIELD_LIMITS.formLabel}
                    error={contactSettingsErrors.emailLabel}
                    touched={contactSettingsTouched.emailLabel}
                    onChange={handleContactSettingsChange}
                    onBlur={handleContactSettingsBlur}
                  />
                  <ContactValidatedField
                    field="emailPlaceholder"
                    label="Email Placeholder"
                    required
                    value={formData.contactPage.emailPlaceholder}
                    maxLength={CMS_FIELD_LIMITS.placeholder}
                    error={contactSettingsErrors.emailPlaceholder}
                    touched={contactSettingsTouched.emailPlaceholder}
                    onChange={handleContactSettingsChange}
                    onBlur={handleContactSettingsBlur}
                  />
                </div>
                <div className="admin-form-group row-split">
                  <ContactValidatedField
                    field="phoneLabel"
                    label="Phone Label"
                    required
                    value={formData.contactPage.phoneLabel}
                    maxLength={CMS_FIELD_LIMITS.formLabel}
                    error={contactSettingsErrors.phoneLabel}
                    touched={contactSettingsTouched.phoneLabel}
                    onChange={handleContactSettingsChange}
                    onBlur={handleContactSettingsBlur}
                  />
                  <ContactValidatedField
                    field="phonePlaceholder"
                    label="Phone Placeholder"
                    required
                    value={formData.contactPage.phonePlaceholder}
                    maxLength={CMS_FIELD_LIMITS.placeholder}
                    error={contactSettingsErrors.phonePlaceholder}
                    touched={contactSettingsTouched.phonePlaceholder}
                    onChange={handleContactSettingsChange}
                    onBlur={handleContactSettingsBlur}
                  />
                </div>
                <div className="admin-form-group row-split">
                  <ContactValidatedField
                    field="subjectLabel"
                    label="Subject Label"
                    required
                    value={formData.contactPage.subjectLabel}
                    maxLength={CMS_FIELD_LIMITS.formLabel}
                    error={contactSettingsErrors.subjectLabel}
                    touched={contactSettingsTouched.subjectLabel}
                    onChange={handleContactSettingsChange}
                    onBlur={handleContactSettingsBlur}
                  />
                  <ContactValidatedField
                    field="subjectPlaceholder"
                    label="Subject Placeholder"
                    required
                    value={formData.contactPage.subjectPlaceholder}
                    maxLength={CMS_FIELD_LIMITS.placeholder}
                    error={contactSettingsErrors.subjectPlaceholder}
                    touched={contactSettingsTouched.subjectPlaceholder}
                    onChange={handleContactSettingsChange}
                    onBlur={handleContactSettingsBlur}
                  />
                </div>
                <div className="admin-form-group row-split">
                  <ContactValidatedField
                    field="messageLabel"
                    label="Message Label"
                    required
                    value={formData.contactPage.messageLabel}
                    maxLength={CMS_FIELD_LIMITS.formLabel}
                    error={contactSettingsErrors.messageLabel}
                    touched={contactSettingsTouched.messageLabel}
                    onChange={handleContactSettingsChange}
                    onBlur={handleContactSettingsBlur}
                  />
                  <ContactValidatedField
                    field="messagePlaceholder"
                    label="Message Placeholder"
                    required
                    value={formData.contactPage.messagePlaceholder}
                    maxLength={CMS_FIELD_LIMITS.placeholder}
                    error={contactSettingsErrors.messagePlaceholder}
                    touched={contactSettingsTouched.messagePlaceholder}
                    onChange={handleContactSettingsChange}
                    onBlur={handleContactSettingsBlur}
                  />
                </div>
                <div className="admin-form-group">
                  <ContactValidatedField
                    field="privacyNote"
                    label="Privacy Note (below form)"
                    required
                    value={formData.contactPage.privacyNote}
                    maxLength={CMS_FIELD_LIMITS.privacyNote}
                    multiline
                    rows={2}
                    collapseOnBlur={false}
                    error={contactSettingsErrors.privacyNote}
                  touched={contactSettingsTouched.privacyNote}
                  onChange={handleContactSettingsChange}
                  onBlur={handleContactSettingsBlur}
                />
                </div>
              </div>

              <div className="settings-subsection">
                <h4>4. Help Box &amp; Map</h4>
                <div className="admin-form-group row-split">
                  <div>
                    <AdminFieldLabel htmlFor="help-box-title" optional>Help Box Title</AdminFieldLabel>
                    <input type="text" value={formData.contactPage.helpBoxText} onChange={(e) => updateContactPage('helpBoxText', e.target.value)} />
                  </div>
                  <div>
                    <AdminFieldLabel htmlFor="help-box-subtext" optional>Help Box Subtext</AdminFieldLabel>
                    <input type="text" value={formData.contactPage.helpBoxSubtext} onChange={(e) => updateContactPage('helpBoxSubtext', e.target.value)} />
                  </div>
                </div>
                <div className="admin-form-group">
                  <AdminFieldLabel htmlFor="google-maps-embed" optional>Google Maps Embed</AdminFieldLabel>
                  <textarea
                    value={formData.contactPage.mapEmbedUrl}
                    onChange={(e) => updateContactPage('mapEmbedUrl', e.target.value)}
                    rows="3"
                    placeholder='Paste the full <iframe ...> embed code OR just the embed URL'
                  />
                  <p className="admin-field-hint">
                    In Google Maps, open Share &rarr; Embed a map &rarr; Copy HTML, then paste it here.
                    You can paste the whole &lt;iframe&gt; code or just the URL &mdash; we&apos;ll handle the rest.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'footer' && (
            <div className="footer-settings-sections">
              <h3>Footer Details</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>
                Manage every section of the site footer — brand, links, hours, contact, and legal links.
              </p>

              <FooterPreview formData={formData} />

              <div className="settings-subsection">
                <h4>1. Brand &amp; About</h4>
                <div className="admin-form-group">
                  <AdminFieldLabel htmlFor="footer-logo-file" optional>Footer Logo</AdminFieldLabel>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {(formData.footerLogo || formData.logo) && (
                      <img
                        src={getImageUrl(formData.footerLogo || formData.logo)}
                        alt="Footer logo preview"
                        style={{ height: '80px', width: 'auto', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px', background: 'white' }}
                      />
                    )}
                    <div className="image-upload-zone" style={{ flex: 1, minWidth: '200px', padding: '16px' }}>
                      <input type="file" accept={CMS_IMAGE_ACCEPT} id="footer-logo-file" onChange={handleFooterLogoUpload} style={{ display: 'none' }} />
                      <label htmlFor="footer-logo-file" style={{ cursor: 'pointer', margin: 0 }}>
                        <FaUpload className="upload-icon" style={{ fontSize: '1.5rem', marginBottom: '4px' }} />
                        <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Upload footer logo (Max 2MB)</p>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="admin-form-group">
                  <ContactValidatedField
                    field="footerDescription"
                    label="Footer Description"
                    required
                    value={formData.footerDescription}
                    placeholder="Your premium destination for high-quality groceries..."
                    maxLength={CMS_FIELD_LIMITS.footerDescription}
                    multiline
                    rows={4}
                    collapseOnBlur={false}
                    error={contactSettingsErrors.footerDescription}
                    touched={contactSettingsTouched.footerDescription}
                    onChange={handleContactSettingsChange}
                    onBlur={handleContactSettingsBlur}
                  />
                </div>
              </div>

              <div className="settings-subsection">
                <div className="footer-section-header">
                  <h4>2. Social Media Links</h4>
                  <button type="button" className="action-btn-secondary" onClick={addSocialLink}>
                    <FaPlus /> Add Social Link
                  </button>
                </div>
                <p className="admin-field-hint" style={{ marginBottom: '16px' }}>
                  Add, edit, or remove social profiles shown below the footer description.
                </p>
                {(formData.footerPage.socialLinks || []).map((link, index) => (
                  <SocialLinkRow
                    key={link.id}
                    link={link}
                    onChange={(field, value) => updateSocialLinks(index, field, value)}
                    onRemove={() => removeSocialLink(index)}
                  />
                ))}
              </div>

              <div className="settings-subsection">
                <div className="footer-section-header">
                  <h4>3. Quick Links</h4>
                  <button type="button" className="action-btn-secondary" onClick={() => addFooterLink('quickLinks')}>
                    <FaPlus /> Add Link
                  </button>
                </div>
                <div className="admin-form-group">
                  <AdminFieldLabel optional>Section Title</AdminFieldLabel>
                  <input
                    type="text"
                    value={formData.footerPage.quickLinksTitle}
                    onChange={(e) =>
                      updateFooterPage(
                        'quickLinksTitle',
                        boundAdminText(e.target.value, CMS_FIELD_LIMITS.quickLinkLabel)
                      )
                    }
                    onBlur={(e) => updateFooterPage('quickLinksTitle', sanitizeAdminText(e.target.value))}
                    maxLength={CMS_FIELD_LIMITS.quickLinkLabel}
                  />
                  <span className="admin-char-counter">
                    {formatCharCounter(formData.footerPage.quickLinksTitle, CMS_FIELD_LIMITS.quickLinkLabel)}
                  </span>
                </div>
                {formData.footerPage.quickLinks.map((link, index) => (
                  <FooterLinkRow
                    key={link.id}
                    link={link}
                    labelMaxLength={CMS_FIELD_LIMITS.quickLinkLabel}
                    onChange={(field, value) => updateFooterLinks('quickLinks', index, field, value)}
                    onRemove={() => removeFooterLink('quickLinks', index)}
                  />
                ))}
              </div>

              <div className="settings-subsection">
                <h4>4. Categories</h4>
                <div className="admin-form-group">
                  <AdminFieldLabel optional>Section Title</AdminFieldLabel>
                  <input
                    type="text"
                    value={formData.footerPage.categoriesTitle}
                    onChange={(e) =>
                      updateFooterPage(
                        'categoriesTitle',
                        boundAdminText(e.target.value, CMS_FIELD_LIMITS.categoryLabel)
                      )
                    }
                    onBlur={(e) => updateFooterPage('categoriesTitle', sanitizeAdminText(e.target.value))}
                    maxLength={CMS_FIELD_LIMITS.categoryLabel}
                  />
                  <span className="admin-char-counter">
                    {formatCharCounter(formData.footerPage.categoriesTitle, CMS_FIELD_LIMITS.categoryLabel)}
                  </span>
                  <p className="admin-field-hint">
                    Category links are loaded automatically from Product Categories. Up to 7 active
                    categories appear in the footer, ordered by creation date. Manage categories in
                    the Product Categories section.
                  </p>
                </div>
              </div>

              <div className="settings-subsection">
                <h4>5. Business Hours</h4>
                <div className="admin-form-group">
                  <AdminFieldLabel optional>Section Title</AdminFieldLabel>
                  <input
                    type="text"
                    value={formData.footerPage.businessHoursTitle}
                    onChange={(e) => updateFooterPage('businessHoursTitle', e.target.value)}
                  />
                </div>
                <div className="admin-form-group row-split">
                  <div>
                    <AdminFieldLabel optional>Supermarket Label</AdminFieldLabel>
                    <input
                      type="text"
                      value={formData.footerPage.supermarketLabel}
                      onChange={(e) => updateFooterPage('supermarketLabel', e.target.value)}
                    />
                  </div>
                  <div>
                    <OpeningHoursField
                      field="supermarketTimings"
                      label="Supermarket Hours"
                      value={formData.supermarketTimings}
                      placeholder={OPENING_HOURS_PLACEHOLDERS.supermarket}
                      error={openingHoursErrors.supermarketTimings}
                      touched={openingHoursTouched.supermarketTimings}
                      onChange={handleOpeningHoursChange}
                      onBlur={handleOpeningHoursBlur}
                    />
                  </div>
                </div>
                <div className="admin-form-group row-split">
                  <div>
                    <AdminFieldLabel optional>Food Corner Label</AdminFieldLabel>
                    <input
                      type="text"
                      value={formData.footerPage.foodCornerLabel}
                      onChange={(e) => updateFooterPage('foodCornerLabel', e.target.value)}
                    />
                  </div>
                  <div>
                    <OpeningHoursField
                      field="foodCornerTimings"
                      label="Food Corner Hours"
                      value={formData.foodCornerTimings}
                      placeholder={OPENING_HOURS_PLACEHOLDERS.foodCorner}
                      error={openingHoursErrors.foodCornerTimings}
                      touched={openingHoursTouched.foodCornerTimings}
                      onChange={handleOpeningHoursChange}
                      onBlur={handleOpeningHoursBlur}
                    />
                  </div>
                </div>
                <div className="admin-form-group">
                  <AdminFieldLabel optional>Sunday / Special Hours Note</AdminFieldLabel>
                  <input
                    type="text"
                    value={formData.footerPage.sundayHours}
                    onChange={(e) => updateFooterPage('sundayHours', e.target.value)}
                    placeholder="Sunday: 12:00 PM - 7:00 PM"
                  />
                </div>
              </div>

              <div className="settings-subsection">
                <h4>6. Contact</h4>
                <div className="admin-form-group">
                  <AdminFieldLabel optional>Section Title</AdminFieldLabel>
                  <input
                    type="text"
                    value={formData.footerPage.contactTitle}
                    onChange={(e) => updateFooterPage('contactTitle', e.target.value)}
                  />
                </div>
                <div className="admin-form-group">
                  <ContactValidatedField
                    field="address"
                    label="Address"
                    required
                    value={formData.address}
                    placeholder="Amsterdam, Netherlands"
                    maxLength={CMS_FIELD_LIMITS.address}
                    multiline
                    rows={2}
                    collapseOnBlur={false}
                    error={contactSettingsErrors.address}
                    touched={contactSettingsTouched.address}
                    onChange={handleContactSettingsChange}
                    onBlur={handleContactSettingsBlur}
                  />
                </div>
                <ContactInfoFields
                  formData={formData}
                  fieldErrors={contactInfoErrors}
                  touchedFields={contactInfoTouched}
                  onFieldChange={handleContactInfoChange}
                  onFieldBlur={handleContactInfoBlur}
                />
              </div>

              <div className="settings-subsection">
                <div className="footer-section-header">
                  <h4>7. Bottom Bar &amp; Legal Links</h4>
                  <button type="button" className="action-btn-secondary" onClick={() => addFooterLink('legalLinks')}>
                    <FaPlus /> Add Legal Link
                  </button>
                </div>
                <div className="admin-form-group">
                  <AdminFieldLabel htmlFor="footer-copyright-name" optional>
                    Copyright Name
                  </AdminFieldLabel>
                  <input
                    type="text"
                    value={formData.footerPage.copyrightText}
                    onChange={(e) => updateFooterPage('copyrightText', e.target.value)}
                    placeholder="Leave empty to use store name"
                  />
                </div>
                {formData.footerPage.legalLinks.map((link, index) => (
                  <LegalFooterLinkRow
                    key={link.id}
                    link={link}
                    errors={legalLinkErrors[link.id] || {}}
                    touched={legalLinkTouched[link.id] || {}}
                    onChange={(field, value) => updateLegalLink(index, field, value)}
                    onBlur={(field) => handleLegalLinkBlur(index, field)}
                    onRemove={() => removeLegalLink(index)}
                  />
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button 
              type="button" 
              className="action-btn-secondary"
              onClick={async () => {
                try {
                  const siteSettings = await siteSettingsService.getSiteSettings();
                  const contactSettings = await contactSettingsService.getContactSettings();
                  const footerSettings = await footerService.getFooterSettings();
                  let next = mergeContactSettingsIntoForm(buildFormState(cmsData), contactSettings);
                  next = {
                    ...next,
                    storeName: siteSettings?.storeName ?? next.storeName,
                    logo: siteSettings?.storeLogo ?? next.logo,
                    footerLogo: footerSettings?.logo ?? next.footerLogo ?? next.logo,
                    address: siteSettings?.physicalAddress ?? next.address,
                    supermarketTimings:
                      siteSettings?.supermarketOpeningHours ?? next.supermarketTimings,
                    foodCornerTimings:
                      siteSettings?.foodCornerOpeningHours ?? next.foodCornerTimings,
                    footerDescription:
                      footerSettings?.footerDescription ?? next.footerDescription,
                    footerPage: mergeFooterPage({
                      ...next.footerPage,
                      ...footerSettings?.footerPage,
                    }),
                  };
                  setFormData(next);
                  resetValidationState();
                  addToast('Form reset to saved settings', 'info');
                } catch (err) {
                  console.error('Failed to reload settings', err);
                  if (cmsData) {
                    setFormData(buildFormState(cmsData));
                    resetValidationState();
                    addToast('Form reset to saved settings', 'info');
                  }
                }
              }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={`action-btn-primary ${isSaving ? 'disabled' : ''}`}
              disabled={isSaving}
            >
              {isSaving ? 'Saving Settings...' : 'Save Site Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSiteSettings;
