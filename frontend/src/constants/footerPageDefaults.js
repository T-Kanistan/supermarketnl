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
  quickLinks: [
    { id: 'ql-1', label: 'Home', path: '/', enabled: true },
    { id: 'ql-2', label: 'About Us', path: '/about-us', enabled: true },
    { id: 'ql-3', label: 'Products', path: '/products', enabled: true },
    { id: 'ql-4', label: 'Food Corner', path: '/food-corner', enabled: true },
    { id: 'ql-5', label: 'Offers', path: '/offers', enabled: true },
    { id: 'ql-6', label: 'FAQ', path: '/faq', enabled: true },
    { id: 'ql-7', label: 'Contact Us', path: '/contact-us', enabled: true },
  ],
  legalLinks: [
    { id: 'll-1', label: 'Terms & Conditions', path: '/terms', enabled: true },
    { id: 'll-2', label: 'Privacy Policy', path: '/privacy', enabled: true },
  ],
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
      : base.quickLinks,
    legalLinks: Array.isArray(footerPage.legalLinks) && footerPage.legalLinks.length
      ? footerPage.legalLinks.map((link, i) => ({
          id: link.id || `ll-${i + 1}`,
          label: link.label || '',
          path: link.path || '/',
          enabled: link.enabled !== false,
        }))
      : base.legalLinks,
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
