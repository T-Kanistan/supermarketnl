import dotenv from 'dotenv';
import connectMongo from '../config/mongo.js';
import Banner from '../models/Banner.js';

dotenv.config();

const defaultBanner = {
  title: 'FRESH',
  highlightText: 'PRODUCTS',
  titleLine2: 'BETTER LIVING',
  subtitle: 'Your one-stop supermarket for quality products and great offers.',
  image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=2000',
  buttonText: 'EXPLORE PRODUCTS',
  buttonLink: '/products',
  buttonText2: 'EXPLORE FOOD CORNER',
  buttonLink2: '/food-corner',
  showOpenTime: true,
  openTimeTitle: 'Open Time',
  supermarketLabel: 'Supermarket',
  supermarketTimings: '8:00 AM - 10:00 PM',
  foodCornerLabel: 'Food Corner',
  foodCornerTimings: '11:00 AM - 11:00 PM',
  status: 'active',
  sortOrder: 1,
};

const run = async () => {
  await connectMongo();

  const existing = await Banner.findOne({ status: 'active' });
  if (existing) {
    console.log('Home banner already exists:', existing.title, existing.highlightText, existing.titleLine2);
    process.exit(0);
  }

  const banner = await Banner.create(defaultBanner);
  console.log('Default home banner created:', banner.title, banner.highlightText, banner.titleLine2);
  process.exit(0);
};

run().catch((err) => {
  console.error('Failed to initialize home banner:', err.message);
  process.exit(1);
});
