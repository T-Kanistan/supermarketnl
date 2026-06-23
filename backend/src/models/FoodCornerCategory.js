import mongoose from 'mongoose';

const foodCornerCategorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    icon: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    displayOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'foodCornerCategories',
  }
);

foodCornerCategorySchema.index({ status: 1, displayOrder: 1 });

const FoodCornerCategory = mongoose.model('FoodCornerCategory', foodCornerCategorySchema);

export default FoodCornerCategory;
