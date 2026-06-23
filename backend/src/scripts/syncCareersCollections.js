/**
 * MongoDB schema sync for vacancies and job applications.
 * Run: node src/scripts/syncCareersCollections.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import JobApplication, { APPLICATION_STATUS_LABELS } from '../models/JobApplication.js';
import Vacancy from '../models/Vacancy.js';

dotenv.config();

const sync = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not configured');
  }

  await mongoose.connect(uri);

  await Vacancy.updateMany({ openDate: { $exists: false } }, [
    { $set: { openDate: '$createdAt' } },
  ]);

  const applications = await JobApplication.find({});
  for (const app of applications) {
    app.applicationStatus = APPLICATION_STATUS_LABELS[app.status] || app.applicationStatus;
    await app.save();
  }

  console.log('Careers collections synced successfully.');
  await mongoose.disconnect();
};

sync().catch((error) => {
  console.error('Careers sync failed:', error);
  process.exit(1);
});
