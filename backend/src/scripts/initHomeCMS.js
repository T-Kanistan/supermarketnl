import dotenv from 'dotenv';
import connectMongo from '../config/mongo.js';
import HomeCMS, { getDefaultHomeCMS } from '../models/HomeCMS.js';

dotenv.config();

const run = async () => {
  await connectMongo();

  const existing = await HomeCMS.findOne();
  if (existing) {
    console.log('HomeCMS document already exists. Skipping seed.');
    process.exit(0);
  }

  await HomeCMS.create(getDefaultHomeCMS());
  console.log('HomeCMS seeded successfully.');
  process.exit(0);
};

run().catch((err) => {
  console.error('Failed to initialize HomeCMS:', err.message);
  process.exit(1);
});
