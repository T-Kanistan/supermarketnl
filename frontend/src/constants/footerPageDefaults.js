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
  };
};
