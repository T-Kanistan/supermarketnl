import mongoose from 'mongoose';

export const OFFER_CATEGORY_STATUS = ['active', 'inactive'];

const offerCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: 80,
      unique: true,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 300,
    },
    icon: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: OFFER_CATEGORY_STATUS,
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
    collection: 'offer_categories',
  }
);

offerCategorySchema.index({ sortOrder: 1, name: 1 });

const OfferCategory = mongoose.model('OfferCategory', offerCategorySchema);

export default OfferCategory;
