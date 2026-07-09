import mongoose from 'mongoose';
import HomepageAboutSection from '../models/HomepageAboutSection.js';

const MIGRATION_KEY = 'homepage_about_visibility_v1';
let migrationRan = false;

const hasPublishableContent = {
  sectionHeading: { $regex: /\S/ },
  shortDescription: { $regex: /\S/ },
  buttonText: { $regex: /\S/ },
  buttonLink: { $regex: /\S/ },
};

export const migrateHomepageAboutVisibility = async () => {
  if (migrationRan) return;

  const db = mongoose.connection.db;
  const migrations = db.collection('app_migrations');
  if (await migrations.findOne({ key: MIGRATION_KEY })) {
    migrationRan = true;
    return;
  }

  try {
    const result = await HomepageAboutSection.updateMany(
      {
        status: { $in: ['inactive', 'draft'] },
        ...hasPublishableContent,
      },
      { $set: { status: 'active' } }
    );

    if (result.modifiedCount > 0) {
      console.log(
        `[migration] Homepage about visibility: activated ${result.modifiedCount} section(s) with content`
      );
    } else {
      console.log('[migration] Homepage about visibility: no inactive sections with content found');
    }

    await migrations.insertOne({ key: MIGRATION_KEY, ranAt: new Date() });
    migrationRan = true;
  } catch (error) {
    console.error(`[migration] Homepage about visibility failed: ${error.message}`);
    throw error;
  }
};

export default migrateHomepageAboutVisibility;
