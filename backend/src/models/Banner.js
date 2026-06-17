import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: 'FRESH PRODUCTS',
    },
    highlightText: {
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
