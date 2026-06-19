import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: 'FRESH',
    },
    highlightText: {
      type: String,
      trim: true,
      default: 'PRODUCTS',
    },
    titleLine2: {
      type: String,
      trim: true,
      default: 'BETTER LIVING',
    },
    subtitle: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'Banner image URL is required'],
    },
    buttonText: {
      type: String,
      trim: true,
      default: 'EXPLORE PRODUCTS',
    },
    buttonLink: {
      type: String,
      trim: true,
      default: '/products',
    },
    buttonText2: {
      type: String,
      trim: true,
      default: 'EXPLORE FOOD CORNER',
    },
    buttonLink2: {
      type: String,
      trim: true,
      default: '/food-corner',
    },
    showOpenTime: {
      type: Boolean,
      default: true,
    },
    openTimeTitle: {
      type: String,
      trim: true,
      default: 'Open Time',
    },
    supermarketLabel: {
      type: String,
      trim: true,
      default: 'Supermarket',
    },
    supermarketTimings: {
      type: String,
      trim: true,
      default: '8:00 AM - 10:00 PM',
    },
    foodCornerLabel: {
      type: String,
      trim: true,
      default: 'Food Corner',
    },
    foodCornerTimings: {
      type: String,
      trim: true,
      default: '11:00 AM - 11:00 PM',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Banner = mongoose.model('Banner', bannerSchema);

export default Banner;
