import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

categorySchema.index({ status: 1 });

const Category = mongoose.model('Category', categorySchema);

export default Category;
