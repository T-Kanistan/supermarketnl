import dotenv from 'dotenv';
import connectMongo, { disconnectMongo } from '../config/mongo.js';

dotenv.config();

const testConnection = async () => {
  try {
    await connectMongo();
    console.log('[db:test] Atlas connection verified successfully.');
    await disconnectMongo();
    process.exit(0);
  } catch (error) {
    console.error(`[db:test] Connection test failed: ${error.message}`);
    process.exit(1);
  }
};

testConnection();
