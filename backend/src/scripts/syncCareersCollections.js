/**
 * MongoDB schema sync for vacancies and job applications.
 * Run: node src/scripts/syncCareersCollections.js
 */
import dotenv from 'dotenv';
import connectMongo, { disconnectMongo } from '../config/mongo.js';
import JobApplication, { APPLICATION_STATUS_LABELS } from '../models/JobApplication.js';
import Vacancy from '../models/Vacancy.js';

dotenv.config();

const sync = async () => {
  await connectMongo();

  await Vacancy.updateMany({ openDate: { $exists: false } }, [
    { $set: { openDate: '$createdAt' } },
  ]);

  const applications = await JobApplication.find({});
  for (const app of applications) {
    app.applicationStatus = APPLICATION_STATUS_LABELS[app.status] || app.applicationStatus;
    await app.save();
  }

  console.log('Careers collections synced successfully.');
  await disconnectMongo();
};

sync().catch(async (error) => {
  console.error('Careers sync failed:', error);
  try {
    await disconnectMongo();
  } catch {
    // ignore
  }
  process.exit(1);
});
