import dotenv from 'dotenv';
import connectMongo from '../config/mongo.js';
import HomepageAboutSection, { getDefaultHomepageAbout } from '../models/HomepageAboutSection.js';
import AboutUsCMS, { getDefaultAboutCMS } from '../models/AboutCMS.js';

dotenv.config();

const run = async () => {
  await connectMongo();

  const existing = await HomepageAboutSection.findOne({ status: { $ne: 'deleted' } });
  if (existing) {
    console.log('Homepage about section already exists:', existing.sectionHeading);
    process.exit(0);
  }

  const defaults = getDefaultHomepageAbout();
  const aboutDoc = (await AboutUsCMS.findOne()) || getDefaultAboutCMS();
  defaults.shortDescription =
    aboutDoc.homepageShortDescription || defaults.shortDescription;
  defaults.aboutImage =
    aboutDoc.homepageAboutSection?.image ||
    aboutDoc.heroSection?.heroImage ||
    defaults.aboutImage;

  const doc = await HomepageAboutSection.create(defaults);
  console.log('Default homepage about section created:', doc.sectionHeading);
  process.exit(0);
};

run().catch((err) => {
  console.error('Failed to initialize homepage about section:', err.message);
  process.exit(1);
});
