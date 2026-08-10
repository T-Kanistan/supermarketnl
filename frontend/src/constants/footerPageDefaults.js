export const SOCIAL_PLATFORM_OPTIONS = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
];

const defaultSocialLinks = [
  { id: 'sm-1', platform: 'facebook', url: 'https://facebook.com', enabled: true },
  { id: 'sm-2', platform: 'instagram', url: 'https://instagram.com', enabled: true },
  { id: 'sm-3', platform: 'whatsapp', url: 'https://wa.me/31659046526', enabled: true },
  { id: 'sm-4', platform: 'tiktok', url: 'https://tiktok.com', enabled: true },
  { id: 'sm-5', platform: 'youtube', url: 'https://youtube.com', enabled: true },
];

export const mapSocialLinksToSocials = (socialLinks = []) => {
  const socials = {};
  socialLinks
    .filter((link) => link.enabled !== false && link.platform && link.url)
    .forEach((link) => {
      socials[link.platform] = link.url;
    });
  return socials;
};

export const defaultFooterPage = {
  quickLinksTitle: 'QUICK LINKS',
  categoriesTitle: 'CATEGORIES',
  businessHoursTitle: 'BUSINESS HOURS',
  contactTitle: 'CONTACT',
  supermarketLabel: 'Supermarket',
  foodCornerLabel: 'Food Corner',
  sundayHours: 'Sunday: 12:00 PM - 7:00 PM',
  copyrightText: '',
  quickLinks: [],
  legalLinks: [],
  socialLinks: defaultSocialLinks,
};

export const emptyFooterPageForm = () =>
  JSON.parse(JSON.stringify(defaultFooterPage));

export const mergeFooterPage = (footerPage) => {
  const base = emptyFooterPageForm();
  if (!footerPage || typeof footerPage !== 'object') return base;

  return {
    ...base,
    ...footerPage,
    quickLinks: Array.isArray(footerPage.quickLinks) && footerPage.quickLinks.length
      ? footerPage.quickLinks.map((link, i) => ({
          id: link.id || `ql-${i + 1}`,
          label: link.label || '',
          path: link.path || '/',
          enabled: link.enabled !== false,
        }))
      : [],
    legalLinks: Array.isArray(footerPage.legalLinks) && footerPage.legalLinks.length
      ? footerPage.legalLinks.map((link, i) => ({
          id: link.id || `ll-${i + 1}`,
          label: link.label || '',
          path: link.path || '/',
          enabled: link.enabled !== false,
        }))
      : [],
    socialLinks: Array.isArray(footerPage.socialLinks) && footerPage.socialLinks.length
      ? footerPage.socialLinks.map((link, i) => ({
          id: link.id || `sm-${i + 1}`,
          platform: link.platform || 'facebook',
          url: link.url || '',
          enabled: link.enabled !== false,
        }))
      : base.socialLinks,
  };
};
