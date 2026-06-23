import mongoose from 'mongoose';

const ts = { timestamps: true };

export const AboutIntroduction = mongoose.model(
  'AboutIntroduction',
  new mongoose.Schema(
    {
      badge_text: { type: String, default: '' },
      main_heading: { type: String, default: '' },
      highlight_heading: { type: String, default: '' },
      description_1: { type: String, default: '' },
      description_2: { type: String, default: '' },
      description_3: { type: String, default: '' },
      description_4: { type: String, default: '' },
      button1_text: { type: String, default: 'Explore Products' },
      button1_url: { type: String, default: '/products' },
      button2_text: { type: String, default: 'Contact Us' },
      button2_url: { type: String, default: '/contact' },
      serving_badge_text: { type: String, default: '' },
      image: { type: String, default: '' },
      display_order: { type: Number, default: 1 },
      is_active: { type: Boolean, default: true },
    },
    { ...ts, collection: 'about_introduction' }
  )
);

export const AboutStory = mongoose.model(
  'AboutStory',
  new mongoose.Schema(
    {
      title: { type: String, default: 'Our Story' },
      description: { type: String, default: '' },
      image: { type: String, default: '' },
      is_active: { type: Boolean, default: true },
    },
    { ...ts, collection: 'about_story' }
  )
);

export const AboutStoryTimeline = mongoose.model(
  'AboutStoryTimeline',
  new mongoose.Schema(
    {
      title: { type: String, required: true, trim: true },
      subtitle: { type: String, default: '', trim: true },
      description: { type: String, default: '' },
      icon: { type: String, default: 'FiCalendar' },
      display_order: { type: Number, default: 0 },
      is_active: { type: Boolean, default: true },
    },
    { ...ts, collection: 'about_story_timeline' }
  )
);

export const AboutValues = mongoose.model(
  'AboutValues',
  new mongoose.Schema(
    {
      title: { type: String, required: true, trim: true },
      description: { type: String, default: '' },
      icon: { type: String, default: 'FiTarget' },
      display_order: { type: Number, default: 0 },
      is_active: { type: Boolean, default: true },
    },
    { ...ts, collection: 'about_values' }
  )
);

export const AboutOffers = mongoose.model(
  'AboutOffers',
  new mongoose.Schema(
    {
      title: { type: String, required: true, trim: true },
      description: { type: String, required: true, trim: true },
      image: { type: String, required: true, trim: true },
      display_order: { type: Number, default: 0 },
      is_active: { type: Boolean, default: true },
    },
    { ...ts, collection: 'about_offers' }
  )
);

export const AboutStatistics = mongoose.model(
  'AboutStatistics',
  new mongoose.Schema(
    {
      title: { type: String, required: true, trim: true },
      value: { type: Number, default: 0 },
      suffix: { type: String, default: '' },
      icon: { type: String, default: 'FiUsers' },
      display_order: { type: Number, default: 0 },
      is_active: { type: Boolean, default: true },
    },
    { ...ts, collection: 'about_statistics' }
  )
);

export const AboutOwner = mongoose.model(
  'AboutOwner',
  new mongoose.Schema(
    {
      owner_name: { type: String, default: '' },
      designation: { type: String, default: '' },
      quote: { type: String, default: '' },
      phone: { type: String, default: '' },
      address: { type: String, default: '' },
      since_year: { type: String, default: '2022' },
      experience_text: { type: String, default: '' },
      badge_text: { type: String, default: 'Founder & Owner' },
      profile_photo: { type: String, default: '' },
      is_active: { type: Boolean, default: true },
    },
    { ...ts, collection: 'about_owner' }
  )
);

export default {
  AboutIntroduction,
  AboutStory,
  AboutStoryTimeline,
  AboutValues,
  AboutOffers,
  AboutStatistics,
  AboutOwner,
};
