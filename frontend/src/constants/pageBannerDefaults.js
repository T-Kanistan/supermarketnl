import { PRODUCTS_PAGE_HERO_IMAGE } from './productsPageDefaults';

export const normalizePageType = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'food-corner') return 'foodcorner';
  return normalized;
};

export const BANNER_PAGE_OPTIONS = [
  { value: 'home', label: 'Home Page' },
  { value: 'products', label: 'Products Page' },
  { value: 'foodcorner', label: 'Food Corner Page' },
  { value: 'vacancies', label: 'Vacancies Page' },
  { value: 'faq', label: 'FAQ Page' },
  { value: 'contact', label: 'Contact Us Page' },
];

export const getPageBannerLabel = (pageType) =>
  BANNER_PAGE_OPTIONS.find((option) => option.value === normalizePageType(pageType))?.label ||
  pageType;

const PAGE_BANNER_DEFAULTS = {
  home: {
    pageType: 'home',
    badgeText: 'BETTER LIVING',
    title: 'Fresh Products',
    highlightedTitle: 'Better Living',
    description: 'Your one-stop supermarket for quality products and great offers.',
    buttonText: 'EXPLORE PRODUCTS',
    buttonUrl: '/products',
    button2Text: 'EXPLORE FOOD CORNER',
    button2Url: '/food-corner',
    backgroundImage: '/images/home-banner-produce.jpg',
    sideCardTitle: 'Open Time',
    overlayColor: '#0f172a',
    overlayOpacity: 0.35,
    isActive: true,
  },
  products: {
    pageType: 'products',
    badgeText: 'OUR STORE',
    title: 'Our',
    highlightedTitle: 'Products',
    description: 'Browse fresh groceries, beverages, spices, frozen foods and daily essentials.',
    backgroundImage: PRODUCTS_PAGE_HERO_IMAGE,
    overlayColor: '#000000',
    overlayOpacity: 0.5,
    isActive: true,
  },
  foodcorner: {
    pageType: 'foodcorner',
    badgeText: 'FOOD CORNER',
    title: 'Enjoy Delicious',
    highlightedTitle: 'Food Corner',
    description: 'Freshly prepared meals, snacks and beverages made daily.',
    backgroundImage:
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=2000',
    overlayColor: '#0f172a',
    overlayOpacity: 0.45,
    isActive: true,
  },
  vacancies: {
    pageType: 'vacancies',
    badgeText: 'JOIN OUR TEAM',
    title: 'Join Our Team',
    highlightedTitle: '',
    description: 'Build your career with Ins Wereld Winkel.',
    backgroundImage:
      'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&q=80&w=2000',
    overlayColor: '#0f172a',
    overlayOpacity: 0.55,
    isActive: true,
  },
  faq: {
    pageType: 'faq',
    badgeText: 'HELP CENTER',
    title: 'Frequently Asked Questions',
    highlightedTitle: '',
    description: 'Find answers about our products, services and store policies.',
    backgroundImage:
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=2000',
    overlayColor: '#0f172a',
    overlayOpacity: 0.85,
    isActive: true,
  },
  contact: {
    pageType: 'contact',
    badgeText: 'GET IN TOUCH',
    title: 'Contact Us',
    highlightedTitle: '',
    description: 'We are here to help. Reach out anytime.',
    backgroundImage:
      'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=2000',
    overlayColor: '#0f2d52',
    overlayOpacity: 0.9,
    isActive: true,
  },
};

const pickBannerFields = (apiData) => {
  if (!apiData) return null;
  return {
    ...apiData,
    pageType: normalizePageType(apiData.pageType || apiData.pageName),
    title: apiData.title ?? apiData.mainHeading ?? '',
    highlightedTitle: apiData.highlightedTitle ?? apiData.highlightText ?? '',
    description: apiData.description ?? apiData.subtitle ?? '',
    buttonText: apiData.buttonText ?? apiData.button1Text ?? apiData.primaryButtonLabel ?? '',
    buttonUrl: apiData.buttonUrl ?? apiData.button1Url ?? apiData.primaryButtonLink ?? '',
    button2Text: apiData.button2Text ?? apiData.secondaryButtonLabel ?? '',
    button2Url: apiData.button2Url ?? apiData.secondaryButtonLink ?? '',
    backgroundImage: apiData.backgroundImage ?? apiData.image ?? '',
    sideCardTitle: apiData.sideCardTitle ?? apiData.cardTitle ?? '',
    sideCardDescription: apiData.sideCardDescription ?? '',
    sideCardIcon: apiData.sideCardIcon ?? '',
    overlayColor: apiData.overlayColor ?? '#0f172a',
    overlayOpacity:
      apiData.overlayOpacity !== undefined && apiData.overlayOpacity !== null
        ? Number(apiData.overlayOpacity)
        : 0.55,
    isActive: apiData.isActive !== false,
    // Legacy aliases for existing components
    mainHeading: apiData.title ?? apiData.mainHeading ?? '',
    highlightText: apiData.highlightedTitle ?? apiData.highlightText ?? '',
    image: apiData.backgroundImage ?? apiData.image ?? '',
    button1Text: apiData.buttonText ?? apiData.button1Text ?? '',
    button1Url: apiData.buttonUrl ?? apiData.button1Url ?? '',
  };
};

export const mergePageBanner = (pageName, apiData) => {
  const pageType = normalizePageType(pageName);
  const defaults = PAGE_BANNER_DEFAULTS[pageType] || {};
  const merged = pickBannerFields(apiData);

  if (!merged) {
    return { ...defaults };
  }

  return {
    ...defaults,
    ...merged,
    pageType,
    pageName: pageType === 'foodcorner' ? 'food-corner' : pageType,
    badgeText: merged.badgeText ?? defaults.badgeText ?? '',
    title: merged.title || defaults.title || '',
    highlightedTitle: merged.highlightedTitle ?? defaults.highlightedTitle ?? '',
    description: merged.description || defaults.description || '',
    buttonText: merged.buttonText || defaults.buttonText || '',
    buttonUrl: merged.buttonUrl || defaults.buttonUrl || '',
    button2Text: merged.button2Text || defaults.button2Text || '',
    button2Url: merged.button2Url || defaults.button2Url || '',
    backgroundImage: merged.backgroundImage || defaults.backgroundImage || '',
    sideCardTitle: merged.sideCardTitle || defaults.sideCardTitle || '',
    overlayColor: merged.overlayColor || defaults.overlayColor || '#0f172a',
    overlayOpacity:
      merged.overlayOpacity !== undefined ? merged.overlayOpacity : defaults.overlayOpacity ?? 0.55,
    isActive: merged.isActive !== false,
    mainHeading: merged.title || defaults.title || '',
    highlightText: merged.highlightedTitle ?? defaults.highlightedTitle ?? '',
    image: merged.backgroundImage || defaults.backgroundImage || '',
    button1Text: merged.buttonText || defaults.buttonText || '',
    button1Url: merged.buttonUrl || defaults.buttonUrl || '',
  };
};
