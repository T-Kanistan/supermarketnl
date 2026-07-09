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

export const sanitizeAdminText = (value, { collapse = true } = {}) => {
  let text = String(value ?? '');
  if (collapse) text = text.replace(/\s+/g, ' ');
  return text.trim();
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

export const assertAdminText = (value, options = {}) => {
  const { collapse = true, ...validateOptions } = options;
  const error = validateAdminText(value, { ...validateOptions, collapse });
  if (error) {
    const err = new Error(error);
    err.statusCode = 400;
    throw err;
  }
  return sanitizeAdminText(value, { collapse });
};

export const expressTextValidator =
  (options) =>
  (value) => {
    if (value === undefined || value === null || value === '') {
      if (options.required) {
        throw new Error(options.requiredMessage || 'This field is required.');
      }
      return true;
    }
    const error = validateAdminText(value, options);
    if (error) throw new Error(error);
    return true;
  };
