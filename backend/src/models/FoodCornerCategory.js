import mongoose from 'mongoose';

const foodCornerCategorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Category Name must be at least 2 characters.'],
      maxlength: [30, 'Category Name cannot exceed 30 characters.'],
    },
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: [30, 'Slug cannot exceed 30 characters.'],
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Slug can contain only lowercase letters, numbers and hyphens.',
      ],
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
foodCornerCategorySchema.index({ createdAt: -1 });

const FoodCornerCategory = mongoose.model('FoodCornerCategory', foodCornerCategorySchema);

export default FoodCornerCategory;
