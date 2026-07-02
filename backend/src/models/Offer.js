import mongoose from 'mongoose';

export const OFFER_DISCOUNT_TYPES = ['percentage', 'flat', 'bogo', 'combo'];
export const OFFER_DEPARTMENT_TYPES = ['Supermarket', 'Food Corner'];
export const OFFER_STATUS_TYPES = ['active', 'inactive', 'deleted'];

const offerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Offer title is required'],
      trim: true,
      maxlength: 150,
    },
    subtitle: {
      type: String,
      trim: true,
      default: '',
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1000,
    },
    category: {
      type: String,
      required: [true, 'Offer category is required'],
      trim: true,
      index: true,
    },
    offerDepartment: {
      type: String,
      enum: OFFER_DEPARTMENT_TYPES,
      default: 'Supermarket',
      index: true,
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
    originalPrice: {
      type: Number,
      default: null,
      min: 0,
    },
    offerPrice: {
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
    image: {
      type: String,
      required: [true, 'Offer image is required'],
      trim: true,
    },
    bannerImage: {
      type: String,
      trim: true,
      default: '',
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    buttonText: {
      type: String,
      trim: true,
      default: 'Enquiry',
      maxlength: 50,
    },
    buttonLink: {
      type: String,
      trim: true,
      default: '',
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: OFFER_STATUS_TYPES,
      default: 'active',
      index: true,
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
    collection: 'offers',
  }
);

offerSchema.index({ status: 1, category: 1 });
offerSchema.index({ status: 1, offerDepartment: 1 });
offerSchema.index({ featured: 1, status: 1 });
offerSchema.index({ sortOrder: 1, createdAt: -1 });
offerSchema.index({ title: 'text', subtitle: 'text', description: 'text' });

const Offer = mongoose.model('Offer', offerSchema);

export default Offer;
