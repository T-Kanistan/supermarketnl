import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectMongo, { disconnectMongo } from '../config/mongo.js';

dotenv.config();

const NEW_IMG = '/images/premium_supermarket_hero.png';

const run = async () => {
  await connectMongo();

  const res = await mongoose.connection.db.collection('aboutus').updateMany(
    {},
    { $set: { 'storySection.image': NEW_IMG, storyImage: NEW_IMG } }
  );
  console.log(`Updated ${res.modifiedCount} document(s) in aboutus`);

  const doc = await mongoose.connection.db.collection('aboutus').findOne({});
  console.log('Current story image:', doc?.storySection?.image || doc?.storyImage || '(none)');

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
