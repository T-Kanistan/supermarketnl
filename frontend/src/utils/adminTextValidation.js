export const ADMIN_TEXT_LIMITS = {
  categoryName: { min: 2, max: 50 },
  productName: { min: 2, max: 100 },
  weightUnit: { max: 20 },
  productDescription: { max: 500 },
  foodName: { min: 2, max: 100 },
  menuTiming: { max: 50 },
  bannerBadge: { max: 30 },
  bannerTitle: { max: 60 },
  bannerHighlightedTitle: { max: 40 },
  bannerDescription: { max: 250 },
  offerTitle: { max: 100 },
  offerDescription: { max: 300 },
  offerBadge: { max: 25 },
  vacancyTitle: { max: 100 },
  vacancyLocation: { max: 100 },
  vacancyEmploymentType: { max: 30 },
  vacancyWorkingDays: { max: 50 },
  vacancyWorkingHours: { max: 50 },
  vacancyDescription: { max: 2000 },
  faqQuestion: { max: 150 },
  faqAnswer: { max: 1000 },
  storeName: { max: 100 },
  storeAddress: { max: 250 },
  emailSubtext: { max: 150 },
  phoneSubtext: { max: 150 },
  footerDescription: { max: 300 },
  quickLinkLabel: { max: 50 },
  categoryLabel: { max: 50 },
  legalLinkLabel: { max: 50 },
  sectionTitle: { max: 100 },
  sectionDescription: { max: 1000 },
  missionTitle: { max: 100 },
  missionDescription: { max: 500 },
  ownerName: { max: 100 },
  ownerDesignation: { max: 100 },
  ownerQuote: { max: 300 },
  ownerExperience: { max: 100 },
  ownerBadge: { max: 50 },
  contactHeroBadge: { max: 30 },
  contactHeroTitle: { max: 80 },
  contactHeroSubtitle: { max: 200 },
  contactHeroFeature: { max: 50 },
  contactFormLabel: { max: 50 },
  contactPlaceholder: { max: 100 },
  contactPrivacyNote: { max: 200 },
  legalPageTitle: { max: 100 },
  legalSectionHeading: { max: 100 },
  legalSectionBody: { max: 3000 },
};

export const CATEGORY_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const CATEGORY_IMAGE_ACCEPT = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';

export const sanitizeAdminText = (value, { collapse = true } = {}) => {
  let text = String(value ?? '');
  if (collapse) text = text.replace(/\s+/g, ' ');
  return text.trim();
};

export const boundAdminText = (value, max) => {
  const text = String(value ?? '');
  return text.length > max ? text.slice(0, max) : text;
};

export const formatCharCounter = (value, max) => {
  const length = String(value ?? '').length;
  return `${length} / ${max}`;
};

export const validateAdminText = (
  value,
  {
    required = false,
    min = 0,
    max = Infinity,
    requiredMessage = 'This field is required.',
    rangeMessage = null,
    maxMessage = null,
    collapse = true,
  } = {}
) => {
  const cleaned = sanitizeAdminText(value, { collapse });

  if (required && !cleaned) return requiredMessage;
  if (!cleaned) return '';

  if (min > 0 && cleaned.length < min) {
    return rangeMessage || `Must be between ${min} and ${max} characters.`;
  }
  if (cleaned.length > max) {
    return maxMessage || `Cannot exceed ${max} characters.`;
  }
  return '';
};

export const validateCategoryName = (value) => {
  const { min, max } = ADMIN_TEXT_LIMITS.categoryName;
  return validateAdminText(value, {
    required: true,
    min,
    max,
    requiredMessage: 'Please enter a category name.',
    rangeMessage: 'Category name must be between 2 and 50 characters.',
    maxMessage: 'Category name must be between 2 and 50 characters.',
  });
};

export const validateCategoryImage = (image, { isEdit = false, existingImage = '' } = {}) => {
  const hasImage = Boolean(String(image || existingImage || '').trim());
  if (!hasImage) {
    return isEdit ? '' : 'Please upload a category image.';
  }
  return '';
};

export const isValidCategoryImageFile = (file) => {
  if (!file) return false;
  const name = (file.name || '').toLowerCase();
  const mime = (file.type || '').toLowerCase();
  const validExt = /\.(jpe?g|png|webp)$/.test(name);
  const validMime = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(mime);
  return validExt && (!mime || validMime);
};

export const validateCategoryImageFile = (file) => {
  if (!file) return { valid: false, error: 'Please upload a category image.' };
  if (!isValidCategoryImageFile(file)) {
    return {
      valid: false,
      error:
        'Unsupported file format. Please upload JPG, JPEG, PNG, or WEBP image files only.',
    };
  }
  if (file.size > CATEGORY_IMAGE_MAX_BYTES) {
    return {
      valid: false,
      error:
        'File size exceeds the maximum limit of 2 MB. Please upload a smaller image.',
    };
  }
  return { valid: true, error: '' };
};
