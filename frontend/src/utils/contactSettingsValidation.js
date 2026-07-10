import {
  ADMIN_TEXT_LIMITS,
  sanitizeAdminText,
} from './adminTextValidation.js';
import {
  sanitizeContactPhoneInput,
  validateContactPhone,
  validateContactEmail,
} from './contactInfoValidation.js';

export { sanitizeContactPhoneInput };

const trim = (value) => String(value ?? '').trim();

const requiredText = (value, message) => (trim(value) ? '' : message);

const requiredMaxText = (value, requiredMessage, max, maxMessage, { collapse = true } = {}) => {
  const cleaned = sanitizeAdminText(value, { collapse });
  if (!cleaned) return requiredMessage;
  if (cleaned.length > max) return maxMessage;
  return '';
};

export const STORE_NAME_REQUIRED = 'Store name is required.';
export const STORE_NAME_MAX_LENGTH = 'Store name cannot exceed 100 characters.';

export const ADDRESS_MAX_LENGTH = 'Address cannot exceed 250 characters.';

export const FOOTER_DESCRIPTION_REQUIRED = 'Footer description is required.';
export const FOOTER_DESCRIPTION_MAX_LENGTH = 'Footer description cannot exceed 300 characters.';

export const HERO_BADGE_REQUIRED = 'Hero badge is required.';
export const HERO_BADGE_MAX_LENGTH = 'Hero badge cannot exceed 30 characters.';
export const HERO_TITLE_REQUIRED = 'Hero title is required.';
export const HERO_TITLE_MAX_LENGTH = 'Hero title cannot exceed 80 characters.';
export const HERO_SUBTITLE_REQUIRED = 'Hero subtitle is required.';
export const HERO_SUBTITLE_MAX_LENGTH = 'Hero subtitle cannot exceed 200 characters.';
export const HERO_FEATURE_1_REQUIRED = 'Hero Feature 1 is required.';
export const HERO_FEATURE_2_REQUIRED = 'Hero Feature 2 is required.';
export const HERO_FEATURE_3_REQUIRED = 'Hero Feature 3 is required.';
export const HERO_FEATURE_MAX_LENGTH = 'Hero feature cannot exceed 50 characters.';

export const INFO_CARD_TITLE_REQUIRED = 'Info card title is required.';
export const INFO_CARD_SUBTITLE_REQUIRED = 'Info card subtitle is required.';

export const FORM_TITLE_REQUIRED = 'Form title is required.';
export const SUBMIT_BUTTON_TEXT_REQUIRED = 'Submit button text is required.';
export const FORM_SUBTITLE_REQUIRED = 'Form subtitle is required.';
export const FULL_NAME_LABEL_REQUIRED = 'Full name label is required.';
export const FULL_NAME_PLACEHOLDER_REQUIRED = 'Full name placeholder is required.';
export const EMAIL_LABEL_REQUIRED = 'Email label is required.';
export const EMAIL_PLACEHOLDER_REQUIRED = 'Email placeholder is required.';
export const PHONE_LABEL_REQUIRED = 'Phone label is required.';
export const PHONE_PLACEHOLDER_REQUIRED = 'Phone placeholder is required.';
export const SUBJECT_LABEL_REQUIRED = 'Subject label is required.';
export const SUBJECT_PLACEHOLDER_REQUIRED = 'Subject placeholder is required.';
export const MESSAGE_LABEL_REQUIRED = 'Message label is required.';
export const MESSAGE_PLACEHOLDER_REQUIRED = 'Message placeholder is required.';
export const PRIVACY_NOTE_REQUIRED = 'Privacy note is required.';

export const FORM_LABEL_MAX_LENGTH = 'Form label cannot exceed 50 characters.';
export const FORM_PLACEHOLDER_MAX_LENGTH = 'Placeholder cannot exceed 100 characters.';
export const PRIVACY_NOTE_MAX_LENGTH = 'Privacy note cannot exceed 200 characters.';

const MIN_STORE_NAME_LENGTH = 3;

export const CONTACT_PAGE_FIELDS = new Set([
  'infoCardTitle',
  'infoCardSubtitle',
  'formTitle',
  'submitButtonText',
  'formSubtitle',
  'nameLabel',
  'namePlaceholder',
  'emailLabel',
  'emailPlaceholder',
  'phoneLabel',
  'phonePlaceholder',
  'subjectLabel',
  'subjectPlaceholder',
  'messageLabel',
  'messagePlaceholder',
  'privacyNote',
]);

export const CONTACT_SETTINGS_FIELD_ORDER = [
  'contactPhone',
  'contactEmail',
  'storeName',
  'address',
  'infoCardTitle',
  'infoCardSubtitle',
  'formTitle',
  'submitButtonText',
  'formSubtitle',
  'nameLabel',
  'namePlaceholder',
  'emailLabel',
  'emailPlaceholder',
  'phoneLabel',
  'phonePlaceholder',
  'subjectLabel',
  'subjectPlaceholder',
  'messageLabel',
  'messagePlaceholder',
  'privacyNote',
];

export const GENERAL_SETTINGS_FIELD_ORDER = ['storeName', 'address'];

export const FOOTER_TEXT_FIELD_ORDER = ['footerDescription'];

export const CONTACT_SETTINGS_FIELD_IDS = {
  contactPhone: 'contact-settings-phone',
  contactEmail: 'contact-settings-email',
  storeName: 'contact-settings-store-name',
  address: 'contact-settings-store-address',
  infoCardTitle: 'contact-settings-info-card-title',
  infoCardSubtitle: 'contact-settings-info-card-subtitle',
  formTitle: 'contact-settings-form-title',
  submitButtonText: 'contact-settings-submit-button-text',
  formSubtitle: 'contact-settings-form-subtitle',
  nameLabel: 'contact-settings-name-label',
  namePlaceholder: 'contact-settings-name-placeholder',
  emailLabel: 'contact-settings-email-label',
  emailPlaceholder: 'contact-settings-email-placeholder',
  phoneLabel: 'contact-settings-phone-label',
  phonePlaceholder: 'contact-settings-phone-placeholder',
  subjectLabel: 'contact-settings-subject-label',
  subjectPlaceholder: 'contact-settings-subject-placeholder',
  messageLabel: 'contact-settings-message-label',
  messagePlaceholder: 'contact-settings-message-placeholder',
  privacyNote: 'contact-settings-privacy-note',
  footerDescription: 'footer-description',
};

export const GENERAL_SETTINGS_FIELD_IDS = {
  storeName: 'general-settings-store-name',
  address: 'general-settings-address',
};

export const getContactSettingsFieldValue = (formData, field) => {
  if (CONTACT_PAGE_FIELDS.has(field)) {
    return formData?.contactPage?.[field];
  }
  return formData?.[field];
};

export const validateStoreName = (value) => {
  const cleaned = sanitizeAdminText(value);
  if (!cleaned) return STORE_NAME_REQUIRED;
  if (cleaned.length < MIN_STORE_NAME_LENGTH) return STORE_NAME_REQUIRED;
  if (cleaned.length > ADMIN_TEXT_LIMITS.storeName.max) return STORE_NAME_MAX_LENGTH;
  return '';
};

export const validateAddress = (value, { required = false } = {}) => {
  const cleaned = sanitizeAdminText(value, { collapse: false });
  if (required && !cleaned) return 'Address is required.';
  if (cleaned.length > ADMIN_TEXT_LIMITS.storeAddress.max) return ADDRESS_MAX_LENGTH;
  return '';
};

export const validateFooterDescription = (value) => {
  const cleaned = sanitizeAdminText(value, { collapse: false });
  if (!cleaned) return FOOTER_DESCRIPTION_REQUIRED;
  if (cleaned.length > ADMIN_TEXT_LIMITS.footerDescription.max) return FOOTER_DESCRIPTION_MAX_LENGTH;
  return '';
};

const FIELD_VALIDATORS = {
  contactPhone: validateContactPhone,
  contactEmail: validateContactEmail,
  storeName: validateStoreName,
  address: (value) => validateAddress(value),
  footerDescription: validateFooterDescription,
  infoCardTitle: (value) => requiredText(value, INFO_CARD_TITLE_REQUIRED),
  infoCardSubtitle: (value) => requiredText(value, INFO_CARD_SUBTITLE_REQUIRED),
  formTitle: (value) => requiredText(value, FORM_TITLE_REQUIRED),
  submitButtonText: (value) => requiredText(value, SUBMIT_BUTTON_TEXT_REQUIRED),
  formSubtitle: (value) => requiredText(value, FORM_SUBTITLE_REQUIRED),
  nameLabel: (value) =>
    requiredMaxText(
      value,
      FULL_NAME_LABEL_REQUIRED,
      ADMIN_TEXT_LIMITS.contactFormLabel.max,
      FORM_LABEL_MAX_LENGTH
    ),
  namePlaceholder: (value) =>
    requiredMaxText(
      value,
      FULL_NAME_PLACEHOLDER_REQUIRED,
      ADMIN_TEXT_LIMITS.contactPlaceholder.max,
      FORM_PLACEHOLDER_MAX_LENGTH
    ),
  emailLabel: (value) =>
    requiredMaxText(
      value,
      EMAIL_LABEL_REQUIRED,
      ADMIN_TEXT_LIMITS.contactFormLabel.max,
      FORM_LABEL_MAX_LENGTH
    ),
  emailPlaceholder: (value) =>
    requiredMaxText(
      value,
      EMAIL_PLACEHOLDER_REQUIRED,
      ADMIN_TEXT_LIMITS.contactPlaceholder.max,
      FORM_PLACEHOLDER_MAX_LENGTH
    ),
  phoneLabel: (value) =>
    requiredMaxText(
      value,
      PHONE_LABEL_REQUIRED,
      ADMIN_TEXT_LIMITS.contactFormLabel.max,
      FORM_LABEL_MAX_LENGTH
    ),
  phonePlaceholder: (value) =>
    requiredMaxText(
      value,
      PHONE_PLACEHOLDER_REQUIRED,
      ADMIN_TEXT_LIMITS.contactPlaceholder.max,
      FORM_PLACEHOLDER_MAX_LENGTH
    ),
  subjectLabel: (value) =>
    requiredMaxText(
      value,
      SUBJECT_LABEL_REQUIRED,
      ADMIN_TEXT_LIMITS.contactFormLabel.max,
      FORM_LABEL_MAX_LENGTH
    ),
  subjectPlaceholder: (value) =>
    requiredMaxText(
      value,
      SUBJECT_PLACEHOLDER_REQUIRED,
      ADMIN_TEXT_LIMITS.contactPlaceholder.max,
      FORM_PLACEHOLDER_MAX_LENGTH
    ),
  messageLabel: (value) =>
    requiredMaxText(
      value,
      MESSAGE_LABEL_REQUIRED,
      ADMIN_TEXT_LIMITS.contactFormLabel.max,
      FORM_LABEL_MAX_LENGTH
    ),
  messagePlaceholder: (value) =>
    requiredMaxText(
      value,
      MESSAGE_PLACEHOLDER_REQUIRED,
      ADMIN_TEXT_LIMITS.contactPlaceholder.max,
      FORM_PLACEHOLDER_MAX_LENGTH
    ),
  privacyNote: (value) =>
    requiredMaxText(
      value,
      PRIVACY_NOTE_REQUIRED,
      ADMIN_TEXT_LIMITS.contactPrivacyNote.max,
      PRIVACY_NOTE_MAX_LENGTH,
      { collapse: false }
    ),
};

export const validateContactSettingsField = (field, formData) => {
  const validator = FIELD_VALIDATORS[field];
  if (!validator) return '';
  return validator(getContactSettingsFieldValue(formData, field));
};

export const validateContactSettingsForm = (formData) => {
  const fieldErrors = {};

  CONTACT_SETTINGS_FIELD_ORDER.forEach((field) => {
    const error = validateContactSettingsField(field, formData);
    if (error) fieldErrors[field] = error;
  });

  return {
    fieldErrors,
    isValid: Object.keys(fieldErrors).length === 0,
  };
};

export const validateGeneralSettingsForm = (formData) => {
  const fieldErrors = {};

  GENERAL_SETTINGS_FIELD_ORDER.forEach((field) => {
    const error =
      field === 'address'
        ? validateAddress(formData.address, { required: true })
        : validateContactSettingsField(field, formData);
    if (error) fieldErrors[field] = error;
  });

  return {
    fieldErrors,
    isValid: Object.keys(fieldErrors).length === 0,
  };
};

export const validateFooterTextForm = (formData) => {
  const fieldErrors = {};
  const footerError = validateFooterDescription(formData.footerDescription);
  if (footerError) fieldErrors.footerDescription = footerError;

  const addressError = validateAddress(formData.address, { required: true });
  if (addressError) fieldErrors.address = addressError;

  return {
    fieldErrors,
    isValid: Object.keys(fieldErrors).length === 0,
  };
};

export const focusFirstContactSettingsError = (fieldErrors) => {
  const firstField = CONTACT_SETTINGS_FIELD_ORDER.find((field) => fieldErrors[field]);
  if (!firstField) return;

  const element = document.getElementById(CONTACT_SETTINGS_FIELD_IDS[firstField]);
  element?.focus();
  element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

export const focusFirstGeneralSettingsError = (fieldErrors) => {
  const firstField = GENERAL_SETTINGS_FIELD_ORDER.find((field) => fieldErrors[field]);
  if (!firstField) return;

  const element = document.getElementById(GENERAL_SETTINGS_FIELD_IDS[firstField]);
  element?.focus();
  element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

export const focusFirstFooterTextError = (fieldErrors) => {
  if (!fieldErrors.footerDescription) return;

  const element = document.getElementById(CONTACT_SETTINGS_FIELD_IDS.footerDescription);
  element?.focus();
  element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
};
