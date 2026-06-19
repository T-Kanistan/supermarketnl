import dotenv from 'dotenv';
import connectMongo from '../config/mongo.js';
import AboutUsCMS, { getDefaultAboutCMS } from '../models/AboutCMS.js';

dotenv.config();

const run = async () => {
  await connectMongo();

  const existing = await AboutUsCMS.findOne();
  if (existing) {
    console.log('AboutUsCMS document already exists. Skipping seed.');
    process.exit(0);
  }

  await AboutUsCMS.create(getDefaultAboutCMS());
  console.log('AboutUsCMS seeded successfully.');
  process.exit(0);
};

run().catch((err) => {
  console.error('Failed to initialize AboutUsCMS:', err.message);
  process.exit(1);
});
