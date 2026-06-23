import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const NEW_IMG = '/images/premium_supermarket_hero.png';

const run = async () => {
  const uri =
    process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/supermarket_db';
  await mongoose.connect(uri);

  const res = await mongoose.connection.db.collection('aboutus').updateMany(
    {},
    { $set: { 'storySection.image': NEW_IMG, storyImage: NEW_IMG } }
  );
  console.log(`Updated ${res.modifiedCount} document(s) in aboutus`);

  const doc = await mongoose.connection.db.collection('aboutus').findOne({});
  console.log('Current story image:', doc?.storySection?.image || doc?.storyImage || '(none)');

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
