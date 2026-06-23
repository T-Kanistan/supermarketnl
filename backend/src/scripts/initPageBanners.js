import dotenv from 'dotenv';
import connectMongo from '../config/mongo.js';
import Banner from '../models/Banner.js';

dotenv.config();

const defaults = [
  {
    pageName: 'home',
    badgeText: 'BETTER LIVING',
    mainHeading: 'FRESH',
    highlightText: 'PRODUCTS',
    description: 'Your one-stop supermarket for quality products and great offers.',
    button1Text: 'EXPLORE PRODUCTS',
    button1Url: '/products',
    button2Text: 'EXPLORE FOOD CORNER',
    button2Url: '/food-corner',
    image: '/images/home-banner-produce.jpg',
    overlayColor: '#0f172a',
    overlayOpacity: 0.35,
    displayOrder: 0,
    isActive: true,
  },
  {
    pageName: 'products',
    badgeText: 'OUR STORE',
    mainHeading: 'Our',
    highlightText: 'Products',
    description: 'Browse fresh groceries, beverages, spices, and daily essentials from our supermarket.',
    image: '/images/products-hero-banner.png',
    overlayColor: '#000000',
    overlayOpacity: 0.5,
    displayOrder: 0,
    isActive: true,
  },
  {
    pageName: 'food-corner',
    badgeText: 'FOOD CORNER',
    mainHeading: 'Enjoy Delicious',
    highlightText: 'Food Corner',
    description: 'Freshly prepared meals, snacks and beverages made with quality ingredients, every day.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=2000',
    overlayColor: '#0f172a',
    overlayOpacity: 0.45,
    displayOrder: 0,
    isActive: true,
  },
  {
    pageName: 'vacancies',
    badgeText: 'JOIN OUR TEAM',
    mainHeading: 'JOIN OUR TEAM',
    highlightText: '',
    description: 'We are always looking for passionate, energetic and dedicated people to join our team.',
    image: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&q=80&w=2000',
    overlayColor: '#0f172a',
    overlayOpacity: 0.55,
    displayOrder: 0,
    isActive: true,
  },
  {
    pageName: 'faq',
    badgeText: 'HELP CENTER',
    mainHeading: 'Frequently Asked',
    highlightText: 'Questions',
    description: 'Find answers about our supermarket, products, food corner, and services.',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=2000',
    overlayColor: '#0f172a',
    overlayOpacity: 0.85,
    displayOrder: 0,
    isActive: true,
  },
  {
    pageName: 'contact',
    badgeText: 'GET IN TOUCH',
    mainHeading: 'Contact Us',
    highlightText: '',
    description: 'We are here to help with orders, enquiries, and feedback.',
    image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=2000',
    overlayColor: '#0f2d52',
    overlayOpacity: 0.9,
    displayOrder: 0,
    isActive: true,
  },
];

const run = async () => {
  await connectMongo();

  for (const banner of defaults) {
    const existing = await Banner.findOne({ pageName: banner.pageName, deletedAt: null });
    if (existing) {
      console.log(`Banner already exists for page: ${banner.pageName}`);
      continue;
    }
    await Banner.create(banner);
    console.log(`Created default banner for page: ${banner.pageName}`);
  }

  process.exit(0);
};

run().catch((err) => {
  console.error('Failed to initialize page banners:', err.message);
  process.exit(1);
});
