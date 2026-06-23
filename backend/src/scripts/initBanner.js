import dotenv from 'dotenv';
import connectMongo from '../config/mongo.js';
import HomepageBanner from '../models/HomepageBanner.js';

dotenv.config();

const defaultBanner = {
  headingLine1: 'FRESH',
  headingLine2: 'PRODUCTS',
  headingLine3: 'BETTER LIVING',
  subtitle: 'Your one-stop supermarket for quality products and great offers.',
  backgroundImage: '/uploads/home-banner/home-banner-produce.jpg',
  primaryButtonLabel: 'EXPLORE PRODUCTS',
  primaryButtonLink: '/products',
  secondaryButtonLabel: 'EXPLORE FOOD CORNER',
  secondaryButtonLink: '/food-corner',
  showOpenTimeCard: true,
  cardTitle: 'Open Time',
  supermarketLabel: 'Supermarket',
  supermarketHours: '8:00 AM - 10:00 PM',
  foodCornerLabel: 'Food Corner',
  foodCornerHours: '11:00 AM - 11:00 PM',
  status: 'active',
};

const run = async () => {
  await connectMongo();

  const existing = await HomepageBanner.findOne({ status: 'active' });
  if (existing) {
    console.log(
      'Homepage banner already exists:',
      existing.headingLine1,
      existing.headingLine2,
      existing.headingLine3
    );
    process.exit(0);
  }

  const banner = await HomepageBanner.create(defaultBanner);
  console.log(
    'Default homepage banner created:',
    banner.headingLine1,
    banner.headingLine2,
    banner.headingLine3
  );
  process.exit(0);
};

run().catch((err) => {
  console.error('Failed to initialize homepage banner:', err.message);
  process.exit(1);
});
