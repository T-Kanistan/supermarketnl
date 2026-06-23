import dotenv from 'dotenv';
import connectMongo from '../config/mongo.js';
import HomepageBanner from '../models/HomepageBanner.js';

dotenv.config();

const BACKGROUND_IMAGE = '/uploads/home-banner/home-banner-produce.jpg';

const run = async () => {
  await connectMongo();

  const active = await HomepageBanner.findOne({ status: 'active' }).sort({ updatedAt: -1 });
  if (active) {
    active.backgroundImage = BACKGROUND_IMAGE;
    await active.save();
    console.log('Updated homepage banner background:', active.backgroundImage);
    process.exit(0);
  }

  console.log('No active homepage banner found. Run initBanner.js first.');
  process.exit(1);
};

run().catch((err) => {
  console.error('Failed to update homepage banner:', err.message);
  process.exit(1);
});
