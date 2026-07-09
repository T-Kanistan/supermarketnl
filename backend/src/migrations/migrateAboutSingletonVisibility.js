import mongoose from 'mongoose';
import { AboutIntroduction, AboutOwner } from '../models/aboutModels.js';

const MIGRATION_KEY = 'about_singleton_visibility_v1';
let migrationRan = false;

const hasText = (field) => ({ [field]: { $regex: /\S/ } });

const introContentQuery = {
  $or: [
    hasText('badge_text'),
    hasText('main_heading'),
    hasText('highlight_heading'),
    hasText('description_1'),
    hasText('description_2'),
    hasText('description_3'),
    hasText('description_4'),
    hasText('image'),
  ],
};

const ownerContentQuery = {
  $or: [
    hasText('owner_name'),
    hasText('designation'),
    hasText('quote'),
    hasText('profile_photo'),
    hasText('phone'),
  ],
};

export const migrateAboutSingletonVisibility = async () => {
  if (migrationRan) return;

  const db = mongoose.connection.db;
  const migrations = db.collection('app_migrations');
  if (await migrations.findOne({ key: MIGRATION_KEY })) {
    migrationRan = true;
    return;
  }

  try {
    const [introResult, ownerResult] = await Promise.all([
      AboutIntroduction.updateMany(
        { is_active: false, ...introContentQuery },
        { $set: { is_active: true } }
      ),
      AboutOwner.updateMany(
        { is_active: false, ...ownerContentQuery },
        { $set: { is_active: true } }
      ),
    ]);

    if (introResult.modifiedCount > 0 || ownerResult.modifiedCount > 0) {
      console.log(
        `[migration] About singleton visibility: activated introduction=${introResult.modifiedCount}, owner=${ownerResult.modifiedCount}`
      );
    } else {
      console.log('[migration] About singleton visibility: no inactive records with content found');
    }

    await migrations.insertOne({ key: MIGRATION_KEY, ranAt: new Date() });
    migrationRan = true;
  } catch (error) {
    console.error(`[migration] About singleton visibility failed: ${error.message}`);
    throw error;
  }
};

export default migrateAboutSingletonVisibility;
