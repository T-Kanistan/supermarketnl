import mongoose from 'mongoose';

const footerLinkSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    url: { type: String, default: '/', trim: true },
    show: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const brandSchema = new mongoose.Schema(
  {
    logo: { type: String, default: '/logo.png' },
    description: {
      type: String,
      default:
        'Your premium destination for high-quality groceries and fresh daily produce. We bring the world to your shopping cart with hand-picked items from across the globe.',
    },
  },
  { _id: false }
);

const socialLinksSchema = new mongoose.Schema(
  {
    facebook: { type: String, default: 'https://facebook.com' },
    instagram: { type: String, default: 'https://instagram.com' },
    whatsapp: { type: String, default: 'https://wa.me/31659046526' },
    tiktok: { type: String, default: 'https://tiktok.com' },
    youtube: { type: String, default: 'https://youtube.com' },
  },
  { _id: false }
);

const businessHoursSchema = new mongoose.Schema(
  {
    supermarket: { type: String, default: '8:00 AM - 10:00 PM', trim: true },
    foodCorner: { type: String, default: '11:00 AM - 11:00 PM', trim: true },
    specialNote: { type: String, default: 'Sunday: 12:00 PM - 7:00 PM', trim: true },
  },
  { _id: false }
);

const contactSchema = new mongoose.Schema(
  {
    address: { type: String, default: 'Amsterdam, Netherlands', trim: true },
    phone: { type: String, default: '+31659046526', trim: true },
    email: { type: String, default: 'info@winswereldwinkel.nl', trim: true },
  },
  { _id: false }
);

const footerCmsSchema = new mongoose.Schema(
  {
    brand: { type: brandSchema, default: () => ({}) },
    socialLinks: { type: socialLinksSchema, default: () => ({}) },
    quickLinks: { type: [footerLinkSchema], default: [] },
    categoryLinks: { type: [footerLinkSchema], default: [] },
    legalLinks: { type: [footerLinkSchema], default: [] },
    businessHours: { type: businessHoursSchema, default: () => ({}) },
    contact: { type: contactSchema, default: () => ({}) },
    businessHoursTitle: { type: String, default: 'BUSINESS HOURS', trim: true },
    supermarketLabel: { type: String, default: 'Supermarket', trim: true },
    foodCornerLabel: { type: String, default: 'Food Corner', trim: true },
    contactTitle: { type: String, default: 'CONTACT', trim: true },
    copyrightName: { type: String, default: 'Wins Wereld Winkel', trim: true },
  },
  { timestamps: true }
);

export const getDefaultFooterCMS = () => ({
  brand: {
    logo: '/logo.png',
    description:
      'Your premium destination for high-quality groceries and fresh daily produce. We bring the world to your shopping cart with hand-picked items from across the globe.',
  },
  socialLinks: {
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com',
    whatsapp: 'https://wa.me/31659046526',
    tiktok: 'https://tiktok.com',
    youtube: 'https://youtube.com',
  },
  businessHours: {
    supermarket: '8:00 AM - 10:00 PM',
    foodCorner: '11:00 AM - 11:00 PM',
    specialNote: 'Sunday: 12:00 PM - 7:00 PM',
  },
  contact: {
    address: 'Amsterdam, Netherlands',
    phone: '+31659046526',
    email: 'info@winswereldwinkel.nl',
  },
  copyrightName: 'Wins Wereld Winkel',
  quickLinks: [
    { label: 'Home', url: '/', order: 1, show: true },
    { label: 'About Us', url: '/about', order: 2, show: true },
    { label: 'Products', url: '/products', order: 3, show: true },
    { label: 'Food Corner', url: '/food-corner', order: 4, show: true },
    { label: 'Offers', url: '/offers', order: 5, show: true },
    { label: 'FAQ', url: '/faq', order: 6, show: true },
    { label: 'Contact Us', url: '/contact', order: 7, show: true },
  ],
  categoryLinks: [
    { label: 'Beverages & Tea', url: '/products?category=beverages-tea', order: 1, show: true },
    { label: 'Frozen Ready to Eat', url: '/products?category=frozen-ready-to-eat', order: 2, show: true },
    { label: 'Meat & Seafoods', url: '/products?category=meat-seafoods', order: 3, show: true },
    { label: 'Spices & Masalas', url: '/products?category=spices-masalas', order: 4, show: true },
    { label: 'Vegetables & Fruits', url: '/products?category=vegetables-fruits', order: 5, show: true },
  ],
  legalLinks: [
    { label: 'Terms & Conditions', url: '/terms', order: 1, show: true },
    { label: 'Privacy Policy', url: '/privacy', order: 2, show: true },
  ],
});

const FooterCMS = mongoose.model('FooterCMS', footerCmsSchema, 'footers');

export default FooterCMS;
