import dotenv from 'dotenv';
import connectMongo, { disconnectMongo } from '../config/mongo.js';
import Admin from '../models/Admin.js';
import ManagerAccount from '../models/ManagerAccount.js';
import User from '../models/User.js';

dotenv.config();

const DEFAULT_ADMIN = {
  name: 'Portal Administrator',
  email: 'admin@winswereldwinkel.nl',
  password: 'Admin@123',
  role: 'admin',
  isActive: true,
};

const DEFAULT_MANAGER = {
  name: 'Portal Manager',
  email: 'manager@winswereldwinkel.nl',
  password: 'Manager@123',
  role: 'manager',
  isActive: true,
};

const upsertAccount = async (Model, defaults) => {
  const existing = await Model.findOne({ email: defaults.email });

  if (existing) {
    existing.name = defaults.name;
    existing.password = defaults.password;
    existing.isActive = defaults.isActive;
    existing.role = defaults.role;
    await existing.save();
    console.log(`Updated existing account: ${defaults.email}`);
    return existing;
  }

  const created = await Model.create(defaults);
  console.log(`Created account: ${defaults.email}`);
  return created;
};

const seedPortalAuth = async () => {
  try {
    await connectMongo();
    console.log('Database connected successfully for portal auth seeding.');

    await upsertAccount(Admin, DEFAULT_ADMIN);
    await upsertAccount(ManagerAccount, DEFAULT_MANAGER);

    const legacyAdminExists = await User.findOne({ email: 'admin@store.com' });
    if (!legacyAdminExists) {
      await User.create({
        name: 'System Administrator',
        email: 'admin@store.com',
        password: 'Admin@123',
        role: 'admin',
        isActive: true,
      });
      console.log('Created legacy admin account: admin@store.com');
    } else {
      console.log('Legacy admin account already exists: admin@store.com');
    }

    console.log('\nPortal auth accounts ready:');
    console.log(`Admin   -> ${DEFAULT_ADMIN.email} / ${DEFAULT_ADMIN.password}`);
    console.log(`Manager -> ${DEFAULT_MANAGER.email} / ${DEFAULT_MANAGER.password}`);

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

seedPortalAuth();
