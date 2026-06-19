import dotenv from 'dotenv';
import connectMongo from '../config/mongo.js';
import ContactCMS, { getDefaultContactCMS } from '../models/ContactCMS.js';

dotenv.config();

const run = async () => {
  await connectMongo();

  const existing = await ContactCMS.findOne();
  if (existing) {
    console.log('ContactCMS document already exists. Skipping seed.');
    process.exit(0);
  }

  await ContactCMS.create(getDefaultContactCMS());
  console.log('ContactCMS seeded successfully.');
  process.exit(0);
};

run().catch((err) => {
  console.error('Failed to initialize ContactCMS:', err.message);
  process.exit(1);
});
