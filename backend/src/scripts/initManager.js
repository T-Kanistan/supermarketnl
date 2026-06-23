import dotenv from 'dotenv';
import connectMongo from '../config/mongo.js';
import Manager from '../models/Manager.js';

dotenv.config();

const seedManager = async () => {
  await connectMongo();

  const email = process.env.SEED_MANAGER_EMAIL || 'manager@supermarket.com';
  const username = process.env.SEED_MANAGER_USERNAME || 'manager';
  const existing = await Manager.findOne({ $or: [{ email }, { username }] });

  if (existing) {
    console.log('Manager already exists:', email);
    process.exit(0);
  }

  const passwordHash = await Manager.hashPassword(process.env.SEED_MANAGER_PASSWORD || 'manager123');

  await Manager.create({
    fullName: 'Default Manager',
    email,
    username,
    phoneNumber: '',
    passwordHash,
    status: true,
  });

  console.log('Default manager created:', email, '/', username);
  process.exit(0);
};

seedManager().catch((err) => {
  console.error(err);
  process.exit(1);
});
