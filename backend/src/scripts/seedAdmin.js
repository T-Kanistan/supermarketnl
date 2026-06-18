import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/supermarket_db';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    
    await mongoose.connect(mongoUri);
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

    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error(`Seeding error: ${error.message}`);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedAdmin();
