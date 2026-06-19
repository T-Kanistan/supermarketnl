import dotenv from 'dotenv';
import connectMongo from '../config/mongo.js';
import FooterCMS, { getDefaultFooterCMS } from '../models/FooterCMS.js';

dotenv.config();

const run = async () => {
  await connectMongo();

  const existing = await FooterCMS.findOne();
  if (existing) {
    console.log('FooterCMS document already exists. Skipping seed.');
    process.exit(0);
  }

  await FooterCMS.create(getDefaultFooterCMS());
  console.log('FooterCMS seeded successfully.');
  process.exit(0);
};

run().catch((err) => {
  console.error('Failed to initialize FooterCMS:', err.message);
  process.exit(1);
});
