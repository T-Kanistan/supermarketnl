import dotenv from 'dotenv';
import connectMongo, { disconnectMongo } from '../config/mongo.js';
import User from '../models/User.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectMongo();
    console.log('Database connected successfully for seeding.');

    const defaultAdmin = {
      name: 'System Administrator',
      email: 'admin@store.com',
      password: 'Admin@123',
      role: 'admin',
      mustChangePassword: true,
      isActive: true,
    };

    const adminExists = await User.findOne({ role: 'admin' });

    if (adminExists) {
      console.log(`An admin account already exists: ${adminExists.email}`);
      adminExists.email = defaultAdmin.email;
      adminExists.password = defaultAdmin.password;
      await adminExists.save();
      console.log('Synced admin credentials to application defaults.');
    } else {
      console.log('No admin user found. Seeding default admin...');

      const admin = await User.create(defaultAdmin);

      console.log('Default admin account seeded successfully:');
      console.log(`Email: ${admin.email}`);
      console.log('Password: Admin@123 (Change upon first login)');
    }

    await disconnectMongo();
    process.exit(0);
  } catch (error) {
    console.error(`Seeding error: ${error.message}`);
    try {
      await disconnectMongo();
    } catch {
      // ignore disconnect errors during failure cleanup
    }
    process.exit(1);
  }
};

seedAdmin();
