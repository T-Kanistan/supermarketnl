import mongoose from 'mongoose';

export const BANNER_PAGE_TYPES = [
  'home',
  'products',
  'foodcorner',
  'vacancies',
  'faq',
  'contact',
];

/** Accept legacy slugs used in routes and older records. */
export const normalizePageType = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'food-corner') return 'foodcorner';
  if (BANNER_PAGE_TYPES.includes(normalized)) return normalized;
  return normalized;
};

const bannerSchema = new mongoose.Schema(
  {
    pageType: {
      type: String,
      required: [true, 'Page type is required'],
      enum: BANNER_PAGE_TYPES,
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
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    highlightedTitle: {
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
    buttonText: {
      type: String,
      trim: true,
      default: '',
      maxlength: 80,
    },
    buttonUrl: {
      type: String,
      trim: true,
      default: '',
    },
    backgroundImage: {
      type: String,
      required: [true, 'Banner image is required'],
      trim: true,
    },
    sideCardTitle: {
      type: String,
      trim: true,
      default: '',
      maxlength: 120,
    },
    sideCardDescription: {
      type: String,
      trim: true,
      default: '',
      maxlength: 300,
    },
    sideCardIcon: {
      type: String,
      trim: true,
      default: '',
      maxlength: 80,
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

bannerSchema.index({ pageType: 1, isActive: 1, deletedAt: 1, displayOrder: 1 });

const Banner = mongoose.model('Banner', bannerSchema);

export default Banner;

// Legacy export for existing imports
export const BANNER_PAGE_NAMES = BANNER_PAGE_TYPES;
