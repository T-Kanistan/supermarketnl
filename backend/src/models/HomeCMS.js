import mongoose from 'mongoose';

const featureItemSchema = new mongoose.Schema(
  {
    title: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    icon: { type: String, default: 'check', trim: true },
  },
  { _id: false }
);

const aboutSectionSchema = new mongoose.Schema(
  {
    bulletPoints: { type: [String], default: [] },
    image: { type: String, default: '' },
    buttonText: { type: String, default: 'Learn More', trim: true },
  },
  { _id: false }
);

const foodCornerPromoSchema = new mongoose.Schema(
  {
    badge: { type: String, default: 'RESTAURANT', trim: true },
    title: { type: String, default: 'DELICIOUS FOOD', trim: true },
    highlight: { type: String, default: 'MADE FRESH', trim: true },
    description: {
      type: String,
      default: 'Tasty | Healthy | Affordable\nExperience premium biryani and authentic meals prepared by our expert chefs.',
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    },
    buttonText: { type: String, default: 'Order Now', trim: true },
    buttonLink: { type: String, default: '/food-corner', trim: true },
  },
  { _id: false }
);

const homeCmsSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
      default: 'Wins Wereld Winkel',
    },
    logo: { type: String, default: '/logo.png' },
    supermarketTimings: { type: String, default: '8:00 AM - 10:00 PM' },
    foodCornerTimings: { type: String, default: '11:00 AM - 11:00 PM' },
    featuresSection: {
      items: {
        type: [featureItemSchema],
        default: () => [
          { title: 'Quality Products', description: 'Handpicked fresh items', icon: 'check' },
          { title: 'Best Offers', description: 'Great discounts daily', icon: 'tag' },
          { title: 'Fresh & Healthy', description: '100% organic goods', icon: 'heart' },
          { title: 'Customer Support', description: '24/7 dedicated support', icon: 'headphones' },
        ],
      },
    },
    aboutSection: {
      type: aboutSectionSchema,
      default: () => ({
        bulletPoints: [
          'Fresh fruits, vegetables, and quality meat',
          'International groceries from around the world',
          'Freshly prepared homemade takeaway meals',
          'Affordable prices and excellent customer service',
        ],
        image: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&q=80&w=1200',
        buttonText: 'Learn More',
      }),
    },
    foodCornerPromo: { type: foodCornerPromoSchema, default: () => ({}) },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export const getDefaultHomeCMS = () => ({
  storeName: 'Wins Wereld Winkel',
  logo: '/logo.png',
  supermarketTimings: '8:00 AM - 10:00 PM',
  foodCornerTimings: '11:00 AM - 11:00 PM',
  featuresSection: {
    items: [
      { title: 'Quality Products', description: 'Handpicked fresh items', icon: 'check' },
      { title: 'Best Offers', description: 'Great discounts daily', icon: 'tag' },
      { title: 'Fresh & Healthy', description: '100% organic goods', icon: 'heart' },
      { title: 'Customer Support', description: '24/7 dedicated support', icon: 'headphones' },
    ],
  },
  aboutSection: {
    bulletPoints: [
      'Fresh fruits, vegetables, and quality meat',
      'International groceries from around the world',
      'Freshly prepared homemade takeaway meals',
      'Affordable prices and excellent customer service',
    ],
    image: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&q=80&w=1200',
    buttonText: 'Learn More',
  },
  foodCornerPromo: {},
});

const HomeCMS = mongoose.model('HomeCMS', homeCmsSchema, 'cms');

export default HomeCMS;
