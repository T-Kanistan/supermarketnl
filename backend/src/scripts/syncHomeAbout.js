import dotenv from 'dotenv';
import connectMongo from '../config/mongo.js';
import AboutUsCMS, { getDefaultAboutCMS } from '../models/AboutCMS.js';

dotenv.config();

const run = async () => {
  await connectMongo();

  let about = await AboutUsCMS.findOne();
  if (!about) {
    about = await AboutUsCMS.create(getDefaultAboutCMS());
    console.log('AboutUsCMS created with homepage defaults.');
    process.exit(0);
  }

  const defaults = getDefaultAboutCMS();
  about.homepageShortDescription = defaults.homepageShortDescription;
  about.homepageAboutSection = defaults.homepageAboutSection;
  about.markModified('homepageAboutSection');
  await about.save();

  console.log('Homepage About section synced into AboutUsCMS.');
  process.exit(0);
};

run().catch((err) => {
  console.error('Failed to sync homepage about section:', err.message);
  process.exit(1);
});
