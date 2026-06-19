import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    categoryId: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['grocery', 'food'],
      default: 'grocery',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    oldPrice: {
      type: Number,
      default: null,
      min: 0,
    },
    weight: {
      type: String,
      trim: true,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 4.5,
    },
    reviews: {
      type: Number,
      min: 0,
      default: 0,
    },
    badge: {
      type: String,
      trim: true,
      default: '',
    },
    startTime: {
      type: String,
      trim: true,
      default: '',
    },
    endTime: {
      type: String,
      trim: true,
      default: '',
    },
    displayTime: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ status: 1, type: 1, categoryId: 1 });
productSchema.index({ isFeatured: 1, status: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
