import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { migrateFromLegacyIfNeeded } from '../services/aboutModuleService.js';

dotenv.config();

const run = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/supermarket_db';
  await mongoose.connect(uri);
  await migrateFromLegacyIfNeeded();
  console.log('About module collections initialized / migrated.');
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
