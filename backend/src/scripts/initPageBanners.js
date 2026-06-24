import dotenv from 'dotenv';
import connectMongo from '../config/mongo.js';
import { seedPageBanners } from '../migrations/migratePageBanners.js';

dotenv.config();

const run = async () => {
  await connectMongo();
  await seedPageBanners();
  process.exit(0);
};

run().catch((err) => {
  console.error('Failed to initialize page banners:', err.message);
  process.exit(1);
});
