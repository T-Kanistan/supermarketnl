import mongoose from 'mongoose';

export const BANNER_PAGE_NAMES = [
  'home',
  'products',
  'food-corner',
  'vacancies',
  'faq',
  'contact',
];

const bannerSchema = new mongoose.Schema(
  {
    pageName: {
      type: String,
      required: [true, 'Page name is required'],
      enum: BANNER_PAGE_NAMES,
      trim: true,
      lowercase: true,
      index: true,
    },
    badgeText: {
      type: String,
      trim: true,
      default: '',
      maxlength: 120,
    },
    mainHeading: {
      type: String,
      required: [true, 'Main heading is required'],
      trim: true,
      maxlength: 200,
    },
    highlightText: {
      type: String,
      trim: true,
      default: '',
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 600,
    },
    button1Text: {
      type: String,
      trim: true,
      default: '',
      maxlength: 80,
    },
    button1Url: {
      type: String,
      trim: true,
      default: '',
    },
    button2Text: {
      type: String,
      trim: true,
      default: '',
      maxlength: 80,
    },
    button2Url: {
      type: String,
      trim: true,
      default: '',
    },
    image: {
      type: String,
      required: [true, 'Banner image is required'],
      trim: true,
    },
    overlayColor: {
      type: String,
      trim: true,
      default: '#0f172a',
    },
    overlayOpacity: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.55,
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'banners',
  }
);

bannerSchema.index({ pageName: 1, isActive: 1, deletedAt: 1, displayOrder: 1 });

const Banner = mongoose.model('Banner', bannerSchema);

export default Banner;
