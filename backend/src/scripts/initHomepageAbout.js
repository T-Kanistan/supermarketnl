import 'dotenv/config';
import connectDB from '../config/mongo.js';
import HomepageAboutSection, { getDefaultHomepageAbout } from '../models/HomepageAboutSection.js';
import AboutUsCMS from '../models/AboutCMS.js';
import HomeCMS from '../models/HomeCMS.js';

const init = async () => {
  await connectDB();

  const existing = await HomepageAboutSection.findOne();
  if (existing) {
    console.log('homepage_about_sections already exists. Skipping seed.');
    process.exit(0);
  }

  const defaults = getDefaultHomepageAbout();
  const aboutDoc = await AboutUsCMS.findOne();
  const homeCms = await HomeCMS.findOne();

  if (aboutDoc) {
    defaults.shortDescription = aboutDoc.homepageShortDescription || defaults.shortDescription;
    defaults.buttonText = aboutDoc.homepageAboutSection?.buttonText || defaults.buttonText;
    defaults.aboutImage = aboutDoc.homepageAboutSection?.image || defaults.aboutImage;
    if (aboutDoc.homepageAboutSection?.features?.length) {
      defaults.features = aboutDoc.homepageAboutSection.features.map((text, index) => ({
        text,
        order: index + 1,
      }));
    }
  }

  defaults.sectionHeading = `About ${homeCms?.storeName || 'Ins Wereld Winkel'}`;

  await HomepageAboutSection.create(defaults);
  console.log('homepage_about_sections seeded successfully.');
  process.exit(0);
};

init().catch((err) => {
  console.error('Failed to initialize homepage about section:', err.message);
  process.exit(1);
});
