import mongoose from 'mongoose';

const STATUS_TYPES = ['active', 'inactive', 'draft', 'deleted'];

const homepageBannerSchema = new mongoose.Schema(
  {
    headingLine1: {
      type: String,
      required: [true, 'Heading line 1 is required'],
      trim: true,
      maxlength: 100,
    },
    headingLine2: {
      type: String,
      required: [true, 'Heading line 2 is required'],
      trim: true,
      maxlength: 100,
    },
    headingLine3: {
      type: String,
      required: [true, 'Heading line 3 is required'],
      trim: true,
      maxlength: 100,
    },
    subtitle: {
      type: String,
      required: [true, 'Subtitle is required'],
      trim: true,
      maxlength: 300,
    },
    primaryButtonLabel: {
      type: String,
      required: [true, 'Primary button label is required'],
      trim: true,
      maxlength: 50,
    },
    primaryButtonLink: {
      type: String,
      required: [true, 'Primary button link is required'],
      trim: true,
    },
    secondaryButtonLabel: {
      type: String,
      trim: true,
      maxlength: 50,
      default: 'EXPLORE FOOD CORNER',
    },
    secondaryButtonLink: {
      type: String,
      trim: true,
      default: '/food-corner',
    },
    backgroundImage: {
      type: String,
      required: [true, 'Background image is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: STATUS_TYPES,
      default: 'active',
      index: true,
    },
    showOpenTimeCard: {
      type: Boolean,
      default: true,
    },
    cardTitle: {
      type: String,
      trim: true,
      default: 'Open Time',
    },
    supermarketLabel: {
      type: String,
      trim: true,
      default: 'Supermarket',
    },
    supermarketHours: {
      type: String,
      trim: true,
      default: '8:00 AM - 10:00 PM',
    },
    foodCornerLabel: {
      type: String,
      trim: true,
      default: 'Food Corner',
    },
    foodCornerHours: {
      type: String,
      trim: true,
      default: '6:00 PM - 10:00 PM (Weekend)',
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
    collection: 'homepage_banners',
  }
);

homepageBannerSchema.index({ status: 1, updatedAt: -1 });

const HomepageBanner = mongoose.model('HomepageBanner', homepageBannerSchema);

export { STATUS_TYPES };
export default HomepageBanner;
