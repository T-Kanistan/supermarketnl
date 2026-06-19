import mongoose from 'mongoose';

const featureItemSchema = new mongoose.Schema(
  {
    text: { type: String, trim: true, default: '' },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const homepageAboutSectionSchema = new mongoose.Schema(
  {
    useAboutUsContent: { type: Boolean, default: true },
    sectionHeading: { type: String, required: true, trim: true },
    shortDescription: { type: String, required: true },
    features: { type: [featureItemSchema], default: [] },
    buttonText: { type: String, default: 'Learn More', trim: true },
    buttonLink: { type: String, default: '/about-us', trim: true },
    aboutImage: { type: String, default: '' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

export const getDefaultHomepageAbout = () => ({
  useAboutUsContent: true,
  sectionHeading: 'About Ins Wereld Winkel',
  shortDescription:
    'Since opening in July 2022, Wins Wereld Winkel has been serving the customers with quality groceries, fresh produce, and delicious homemade takeaway food. We offer a wide range of Asian, African, Arabic, and international products, ensuring our customers find everything they need under one roof.',
  features: [
    { text: 'Fresh fruits, vegetables, and quality meat', order: 1 },
    { text: 'International groceries from around the world', order: 2 },
    { text: 'Freshly prepared homemade takeaway meals', order: 3 },
    { text: 'Affordable prices and excellent customer service', order: 4 },
  ],
  buttonText: 'Learn More',
  buttonLink: '/about-us',
  aboutImage:
    'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&q=80&w=1200',
  status: 'Active',
});

const HomepageAboutSection = mongoose.model(
  'HomepageAboutSection',
  homepageAboutSectionSchema,
  'homepage_about_sections'
);

export default HomepageAboutSection;
