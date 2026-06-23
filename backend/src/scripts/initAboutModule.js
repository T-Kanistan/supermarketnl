import dotenv from 'dotenv';
import connectMongo, { disconnectMongo } from '../config/mongo.js';
import { migrateFromLegacyIfNeeded } from '../services/aboutModuleService.js';

dotenv.config();

const run = async () => {
  await connectMongo();
  await migrateFromLegacyIfNeeded();
  console.log('About module collections initialized / migrated.');
  await disconnectMongo();
};

run().catch(async (err) => {
  console.error(err);
  try {
    await disconnectMongo();
  } catch {
    // ignore
  }
  process.exit(1);
});
