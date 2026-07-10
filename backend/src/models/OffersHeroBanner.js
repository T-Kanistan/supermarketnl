import mongoose from 'mongoose';
import { OFFER_DISCOUNT_TYPES, OFFER_DEPARTMENT_TYPES } from './Offer.js';

export const OFFERS_HERO_BANNER_STATUSES = [
  'active',
  'inactive',
  'draft',
  'expired',
  'deleted',
];

const offersHeroBannerSchema = new mongoose.Schema(
  {
    bannerImage: {
      type: String,
      trim: true,
      default: '',
    },
    backgroundImage: {
      type: String,
      trim: true,
      default: '',
    },
    badgeText: {
      type: String,
      trim: true,
      default: '',
      maxlength: 60,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 150,
    },
    highlightedTitle: {
      type: String,
      trim: true,
      default: '',
      maxlength: 100,
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
      maxlength: 50,
    },
    buttonUrl: {
      type: String,
      trim: true,
      default: '',
    },
    button2Text: {
      type: String,
      trim: true,
      default: '',
      maxlength: 50,
    },
    button2Url: {
      type: String,
      trim: true,
      default: '',
    },
    overlayColor: {
      type: String,
      trim: true,
      default: '#0f172a',
    },
    overlayOpacity: {
      type: Number,
      default: 0.55,
      min: 0,
      max: 1,
    },
    offerType: {
      type: String,
      enum: OFFER_DEPARTMENT_TYPES,
      default: 'Supermarket',
    },
    offerCategory: {
      type: String,
      trim: true,
      default: '',
      maxlength: 100,
    },
    discountType: {
      type: String,
      enum: OFFER_DISCOUNT_TYPES,
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      default: null,
      min: 0,
    },
    offerBadge: {
      type: String,
      trim: true,
      default: '',
      maxlength: 60,
    },
    status: {
      type: String,
      enum: OFFERS_HERO_BANNER_STATUSES,
      default: 'draft',
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'offers_hero_banners',
  }
);

offersHeroBannerSchema.index({ status: 1, startDate: 1, endDate: 1, sortOrder: 1 });
offersHeroBannerSchema.index({ title: 'text', description: 'text', badgeText: 'text' });

offersHeroBannerSchema.pre('save', function preSave(next) {
  if (this.bannerImage) this.backgroundImage = this.bannerImage;
  else if (this.backgroundImage) this.bannerImage = this.backgroundImage;
  next();
});

const OffersHeroBanner = mongoose.model('OffersHeroBanner', offersHeroBannerSchema);

export default OffersHeroBanner;
