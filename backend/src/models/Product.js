import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    productType: {
      type: String,
      enum: ['grocery', 'food-corner'],
      default: 'grocery',
      index: true,
    },
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Category is required'],
    },
    categoryName: {
      type: String,
      trim: true,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    stockStatus: {
      type: String,
      enum: ['in_stock', 'out_of_stock'],
      default: 'in_stock',
    },
    weightUnit: {
      type: String,
      trim: true,
      default: '',
    },
    imageUrl: {
      type: String,
      required: [true, 'Product image is required'],
      trim: true,
    },
    featuredProduct: {
      type: Boolean,
      default: false,
      index: true,
    },
    showOnHomepage: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'deleted'],
      default: 'active',
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
    shortDescription: {
      type: String,
      trim: true,
      default: '',
    },
    menuDisplayTiming: {
      type: String,
      trim: true,
      default: '',
    },
    specialBadge: {
      type: String,
      trim: true,
      default: '',
    },
    cookingStartTime: {
      type: String,
      trim: true,
      default: '',
    },
    cookingEndTime: {
      type: String,
      trim: true,
      default: '',
    },
    // Legacy fields kept for backward compatibility with existing data/API consumers
    name: { type: String, trim: true },
    type: { type: String, enum: ['grocery', 'food', 'food-corner'] },
    image: { type: String, default: '' },
    weight: { type: String, trim: true, default: '' },
    stock: { type: Number, default: 0, min: 0 },
    isFeatured: { type: Boolean, default: false },
    description: { type: String, trim: true, default: '' },
    displayTime: { type: String, trim: true, default: '' },
    badge: { type: String, trim: true, default: '' },
    oldPrice: { type: Number, default: null, min: 0 },
    rating: { type: Number, min: 0, max: 5, default: 4.5 },
    reviews: { type: Number, min: 0, default: 0 },
  },
  {
    timestamps: true,
    collection: 'products',
  }
);

productSchema.index({ productType: 1, status: 1, categoryId: 1 });
productSchema.index({ featuredProduct: 1, status: 1 });
productSchema.index({ showOnHomepage: 1, status: 1 });
productSchema.index({ productName: 'text', categoryName: 'text' });

const syncLegacyFields = (doc) => {
  if (doc.productName) doc.name = doc.productName;
  else if (doc.name) doc.productName = doc.name;

  if (doc.productType === 'food-corner') doc.type = 'food';
  else if (doc.productType === 'grocery') doc.type = 'grocery';
  else if (doc.type === 'food') doc.productType = 'food-corner';
  else if (doc.type === 'grocery') doc.productType = 'grocery';

  if (doc.imageUrl) doc.image = doc.imageUrl;
  else if (doc.image) doc.imageUrl = doc.image;

  if (doc.weightUnit) doc.weight = doc.weightUnit;
  else if (doc.weight) doc.weightUnit = doc.weight;

  const featured = Boolean(doc.showOnHomepage ?? doc.featuredProduct ?? doc.isFeatured);
  doc.showOnHomepage = featured;
  doc.isFeatured = featured;
  doc.featuredProduct = featured;

  if (doc.stockStatus === 'in_stock') doc.stock = Math.max(doc.stock || 0, 1);
  if (doc.stockStatus === 'out_of_stock') doc.stock = 0;
  if (doc.stock > 0 && !doc.stockStatus) doc.stockStatus = 'in_stock';
  if (doc.stock === 0 && !doc.stockStatus) doc.stockStatus = 'out_of_stock';

  if (doc.shortDescription) doc.description = doc.shortDescription;
  else if (doc.description) doc.shortDescription = doc.description;

  if (doc.menuDisplayTiming) doc.displayTime = doc.menuDisplayTiming;
  else if (doc.displayTime) doc.menuDisplayTiming = doc.displayTime;

  if (doc.specialBadge) doc.badge = doc.specialBadge;
  else if (doc.badge) doc.specialBadge = doc.badge;
};

productSchema.pre('save', function preSave(next) {
  syncLegacyFields(this);
  next();
});

productSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update) {
    const getField = (key) => {
      if (update.$set && update.$set[key] !== undefined) return update.$set[key];
      return update[key];
    };

    const setField = (key, val) => {
      if (update.$set) {
        update.$set[key] = val;
      } else {
        update[key] = val;
      }
    };

    const productName = getField('productName');
    const name = getField('name');
    if (productName !== undefined) setField('name', productName);
    else if (name !== undefined) setField('productName', name);

    const productType = getField('productType');
    const type = getField('type');
    if (productType === 'food-corner') setField('type', 'food');
    else if (productType === 'grocery') setField('type', 'grocery');
    else if (type === 'food') setField('productType', 'food-corner');
    else if (type === 'grocery') setField('productType', 'grocery');

    const imageUrl = getField('imageUrl');
    const image = getField('image');
    if (imageUrl !== undefined) setField('image', imageUrl);
    else if (image !== undefined) setField('imageUrl', image);

    const weightUnit = getField('weightUnit');
    const weight = getField('weight');
    if (weightUnit !== undefined) setField('weight', weightUnit);
    else if (weight !== undefined) setField('weightUnit', weight);

    const showOnHomepage = getField('showOnHomepage');
    const featuredProduct = getField('featuredProduct');
    const isFeatured = getField('isFeatured');
    if (showOnHomepage !== undefined || featuredProduct !== undefined || isFeatured !== undefined) {
      const featured = Boolean(showOnHomepage ?? featuredProduct ?? isFeatured);
      setField('showOnHomepage', featured);
      setField('isFeatured', featured);
      setField('featuredProduct', featured);
    }

    const stockStatus = getField('stockStatus');
    const stock = getField('stock');
    if (stockStatus === 'in_stock') setField('stock', 1);
    if (stockStatus === 'out_of_stock') setField('stock', 0);
    if (stock !== undefined) {
      const numStock = Number(stock);
      if (numStock > 0) setField('stockStatus', 'in_stock');
      if (numStock === 0) setField('stockStatus', 'out_of_stock');
    }

    const shortDescription = getField('shortDescription');
    const description = getField('description');
    if (shortDescription !== undefined) setField('description', shortDescription);
    else if (description !== undefined) setField('shortDescription', description);

    const menuDisplayTiming = getField('menuDisplayTiming');
    const displayTime = getField('displayTime');
    if (menuDisplayTiming !== undefined) setField('displayTime', menuDisplayTiming);
    else if (displayTime !== undefined) setField('menuDisplayTiming', displayTime);

    const specialBadge = getField('specialBadge');
    const badge = getField('badge');
    if (specialBadge !== undefined) setField('badge', specialBadge);
    else if (badge !== undefined) setField('specialBadge', badge);
  }
  next();
});

const Product = mongoose.model('Product', productSchema);

export default Product;
