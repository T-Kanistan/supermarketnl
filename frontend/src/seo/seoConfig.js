import { DEFAULT_OG_IMAGE, SITE_NAME } from './siteConfig.js';

const page = (title, description, options = {}) => ({
  title,
  description,
  ogImage: options.ogImage || DEFAULT_OG_IMAGE,
  ogType: options.ogType || 'website',
  noindex: options.noindex || false,
  includeLocalBusiness: options.includeLocalBusiness || false,
});

export const SEO_BY_PATH = {
  '/': page(
    'Wins Wereld Winkel | Supermarket & Food Corner in Hilversum',
    'Shop fresh groceries, vegetables, fruits, beverages, frozen foods and delicious takeaway meals at Wins Wereld Winkel, Hilversum.',
    { includeLocalBusiness: true }
  ),
  '/products': page(
    'Products | Wins Wereld Winkel',
    'Browse fresh vegetables, fruits, groceries, beverages and international food products.'
  ),
  '/food-corner': page(
    'Food Corner | Fresh Takeaway Meals',
    'Enjoy fresh homemade takeaway food including Biryani, Kottu Roti, Rolls, Masala Tea and more.'
  ),
  '/vacancies': page(
    'Careers | Wins Wereld Winkel',
    'Explore current job vacancies at Wins Wereld Winkel supermarket and food corner.'
  ),
  '/faq': page(
    'FAQ | Wins Wereld Winkel',
    'Find answers to frequently asked questions about Wins Wereld Winkel supermarket, food corner, opening hours and services in Hilversum.'
  ),
  '/contact-us': page(
    'Contact Us | Wins Wereld Winkel',
    'Contact Wins Wereld Winkel in Hilversum for enquiries about groceries, food corner meals, opening hours and customer support.'
  ),
  '/about-us': page(
    'About Us | Wins Wereld Winkel',
    'Learn about Wins Wereld Winkel — your local supermarket and food corner in Hilversum offering fresh groceries and international products.'
  ),
  '/offers': page(
    'Offers | Wins Wereld Winkel',
    'Discover weekly deals and special offers on groceries and essentials at Wins Wereld Winkel, Hilversum.'
  ),
  '/terms': page(
    'Terms and Conditions | Wins Wereld Winkel',
    'Read the terms and conditions for using the Wins Wereld Winkel website and services.'
  ),
  '/privacy': page(
    'Privacy Policy | Wins Wereld Winkel',
    'Read how Wins Wereld Winkel collects, uses and protects your personal information.'
  ),
  '/login': page('Sign In | Wins Wereld Winkel', 'Secure admin and manager sign in for Wins Wereld Winkel.', {
    noindex: true,
  }),
  '/forgot-password': page('Forgot Password | Wins Wereld Winkel', 'Reset your Wins Wereld Winkel account password.', {
    noindex: true,
  }),
  '/reset-password': page('Reset Password | Wins Wereld Winkel', 'Create a new password for your Wins Wereld Winkel account.', {
    noindex: true,
  }),
};

const ADMIN_PREFIXES = ['/admin', '/manager', '/careers/apply'];

export const getSeoForPath = (pathname) => {
  const path = pathname.split('?')[0].replace(/\/$/, '') || '/';
  const normalized =
    path === '/contact' ? '/contact-us' : path === '/about' ? '/about-us' : path;

  if (ADMIN_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    return page(`${SITE_NAME} Dashboard`, 'Admin dashboard access.', { noindex: true });
  }

  return SEO_BY_PATH[normalized] || null;
};
