import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import FoodCornerCategory from '../models/FoodCornerCategory.js';
import { resolveCategoryReference } from './foodCornerCategoryService.js';
import { handleBase64Upload } from '../middlewares/uploadMiddleware.js';
import { logManagerActivity } from './activityLogService.js';

const parseBoolean = (value) => {
  if (value === true || value === false) return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

export const normalizeProductType = (value) => {
  const raw = value == null ? '' : String(value).trim().toLowerCase();
  if (!raw) return 'grocery';

  // Accept common label variants (e.g. "Food Corner", "Grocery")
  if (
    raw === 'food' ||
    raw === 'food-corner' ||
    raw === 'food corner' ||
    raw === 'foodcorner'
  ) {
    return 'food-corner';
  }

  if (raw === 'grocery' || raw === 'supermarket' || raw === 'supermarket section') {
    return 'grocery';
  }

  // Default to grocery for unknown values
  return 'grocery';
};

const parseTimeToMinutes = (timeValue) => {
  if (!timeValue) return null;
  const value = String(timeValue).trim();
  const match24 = value.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) return Number(match24[1]) * 60 + Number(match24[2]);

  const match12 = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let hours = Number(match12[1]) % 12;
    if (match12[3].toUpperCase() === 'PM') hours += 12;
    return hours * 60 + Number(match12[2]);
  }
  return null;
};

export const validateCookingTimes = (startTime, endTime) => {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (start === null || end === null) {
    const error = new Error('Cooking times must be valid time values (e.g. 18:00 or 06:00 PM)');
    error.statusCode = 400;
    throw error;
  }
  if (end <= start) {
    const error = new Error('Cooking end time must be greater than start time');
    error.statusCode = 400;
    throw error;
  }
};

const resolveImage = async (value) => {
  if (!value) return '';
  if (typeof value === 'string' && value.startsWith('data:image')) {
    return (await handleBase64Upload(value)) || value;
  }
  return value;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findGroceryCategory = async (categoryId) => {
  const raw = String(categoryId || '').trim();
  if (!raw) return null;

  if (mongoose.Types.ObjectId.isValid(raw)) {
    const byId = await Category.findById(raw);
    if (byId) return byId;
  }

  const bySlug = await Category.findOne({ slug: raw.toLowerCase() });
  if (bySlug) return bySlug;

  return Category.findOne({ name: new RegExp(`^${escapeRegex(raw)}$`, 'i') });
};

const resolveCategory = async (productType, categoryId) => {
  if (productType === 'food-corner') {
    const category = await resolveCategoryReference(categoryId);
    return {
      categoryId: category._id,
      categoryName: category.categoryName,
    };
  }

  const category = await findGroceryCategory(categoryId);
  if (!category) {
    const error = new Error('Grocery category not found');
    error.statusCode = 400;
    throw error;
  }

  return {
    categoryId: category.slug || category._id.toString(),
    categoryName: category.name,
  };
};

export const formatProduct = (doc) => {
  if (!doc) return null;
  const plain = doc.toObject ? doc.toObject() : { ...doc };

  // Prefer legacy `type` when available (it is more reliable for older rows where
  // `productType` might have been left at its default).
  const productType = plain.type ? normalizeProductType(plain.type) : normalizeProductType(plain.productType);
  const productName = plain.productName || plain.name || '';
  const imageUrl = plain.imageUrl || plain.image || '';
  const featuredProduct = Boolean(plain.featuredProduct ?? plain.isFeatured);
  const stockStatus =
    plain.stockStatus || (Number(plain.stock) > 0 ? 'in_stock' : 'out_of_stock');

  return {
    ...plain,
    id: plain._id?.toString?.() ?? plain.id,
    productType,
    productName,
    imageUrl,
    featuredProduct,
    stockStatus,
    weightUnit: plain.weightUnit || plain.weight || '',
    shortDescription: plain.shortDescription || plain.description || '',
    menuDisplayTiming: plain.menuDisplayTiming || plain.displayTime || '',
    specialBadge: plain.specialBadge || plain.badge || '',
    cookingStartTime: plain.cookingStartTime || '',
    cookingEndTime: plain.cookingEndTime || '',
    // Legacy aliases for storefront/admin compatibility
    name: productName,
    type: productType === 'food-corner' ? 'food' : 'grocery',
    image: imageUrl,
    isFeatured: featuredProduct,
    weight: plain.weightUnit || plain.weight || '',
    stock: stockStatus === 'in_stock' ? Math.max(Number(plain.stock) || 1, 1) : 0,
    description: plain.shortDescription || plain.description || '',
    displayTime: plain.menuDisplayTiming || plain.displayTime || '',
    badge: plain.specialBadge || plain.badge || '',
  };
};

export const buildProductFilter = (query = {}, { publicOnly = false } = {}) => {
  const filter = {};

  if (publicOnly) {
    filter.status = 'active';
  } else if (query.status) {
    filter.status = query.status;
  } else {
    filter.status = { $ne: 'deleted' };
  }

  const productType = query.productType || query.type;
  if (productType && productType !== 'all') {
    const normalized = normalizeProductType(productType);
    const legacyTypeCondition =
      normalized === 'food-corner' ? { $in: ['food', 'food-corner'] } : 'grocery';

    filter.$or = [
      // Prefer legacy `type` for classification correctness (older rows may have wrong `productType`).
      { type: legacyTypeCondition },
      // Fallback: if legacy `type` doesn't exist, use `productType`.
      { $and: [{ type: { $exists: false } }, { productType: normalized }] },
    ];
  }

  const category = query.category || query.categoryId;
  if (category && category !== 'all') {
    filter.categoryId = category;
  }

  const featured = parseBoolean(query.featuredProduct ?? query.isFeatured);
  if (featured !== undefined) {
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [{ featuredProduct: featured }, { isFeatured: featured }],
    });
  }

  if (query.search) {
    const regex = new RegExp(String(query.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [
        { productName: regex },
        { name: regex },
        { categoryName: regex },
        { shortDescription: regex },
        { description: regex },
      ],
    });
  }

  return filter;
};

export const normalizeProductPayload = async (body, { isUpdate = false } = {}) => {
  const productType = normalizeProductType(
    body.productType || body.type || body.productCatalogType
  );
  const productName = (body.productName || body.name || '').trim();
  const priceValue = body.price;
  const hasPrice = priceValue !== undefined && priceValue !== null && priceValue !== '';
  const price = hasPrice ? Number(priceValue) : undefined;

  if (!isUpdate && !productName) {
    const error = new Error('Product name is required');
    error.statusCode = 400;
    throw error;
  }

  if (!isUpdate && (price === undefined || Number.isNaN(price) || price < 0)) {
    const error = new Error('Price must be greater than or equal to 0');
    error.statusCode = 400;
    throw error;
  }

  const imageInput = body.imageUrl ?? body.image;
  if (!isUpdate && !imageInput) {
    const error = new Error('Product image is required');
    error.statusCode = 400;
    throw error;
  }

  let categoryId = body.categoryId ?? body.category ?? body.categoryName;
  let categoryName = body.categoryName || '';
  if (categoryId) {
    const resolved = await resolveCategory(productType, categoryId);
    categoryId = resolved.categoryId;
    categoryName = resolved.categoryName;
  } else if (!isUpdate) {
    const error = new Error('Category ID is required');
    error.statusCode = 400;
    throw error;
  }

  const payload = {
    productType,
    productName,
    categoryId,
    categoryName,
    price,
    featuredProduct:
      parseBoolean(body.featuredProduct ?? body.isFeatured ?? body.featured) ?? false,
    status: body.status || 'active',
  };

  if (productType === 'grocery') {
    const stockStatus =
      body.stockStatus ||
      (body.stock > 0 || body.stock === 'in_stock' ? 'in_stock' : 'out_of_stock');
    payload.stockStatus = stockStatus === 'out_of_stock' ? 'out_of_stock' : 'in_stock';
    payload.weightUnit = (body.weightUnit || body.weightUnitSize || body.weight || '').trim();
    payload.shortDescription = '';
    payload.menuDisplayTiming = '';
    payload.specialBadge = '';
    payload.cookingStartTime = '';
    payload.cookingEndTime = '';
  } else {
    const cookingStartTime = (body.cookingStartTime || '').trim();
    const cookingEndTime = (body.cookingEndTime || '').trim();
    if (cookingStartTime && cookingEndTime) {
      validateCookingTimes(cookingStartTime, cookingEndTime);
    }

    payload.shortDescription = (body.shortDescription || body.description || '').trim();
    payload.menuDisplayTiming = (body.menuDisplayTiming || body.displayTime || '').trim();
    payload.specialBadge = (body.specialBadge || body.badge || '').trim();
    payload.cookingStartTime = cookingStartTime;
    payload.cookingEndTime = cookingEndTime;
    payload.stockStatus = 'in_stock';
    payload.weightUnit = '';
  }

  if (imageInput !== undefined) {
    payload.imageUrl = await resolveImage(imageInput);
  }

  return payload;
};

const hasField = (body, ...keys) => keys.some((key) => body[key] !== undefined);

export const buildPartialProductUpdate = async (body, existing) => {
  const update = {};
  const existingPlain = existing.toObject ? existing.toObject() : existing;
  const productType = normalizeProductType(
    body.productType ??
      body.type ??
      body.productCatalogType ??
      existingPlain.productType ??
      existingPlain.type
  );

  if (hasField(body, 'productType', 'type', 'productCatalogType')) {
    update.productType = productType;
  }

  if (hasField(body, 'productName', 'name')) {
    const productName = (body.productName || body.name || '').trim();
    if (!productName) {
      const error = new Error('Product name is required');
      error.statusCode = 400;
      throw error;
    }
    update.productName = productName;
  }

  if (body.price !== undefined) {
    const price = Number(body.price);
    if (Number.isNaN(price) || price < 0) {
      const error = new Error('Price must be greater than or equal to 0');
      error.statusCode = 400;
      throw error;
    }
    update.price = price;
  }

  if (hasField(body, 'categoryId', 'category', 'categoryName')) {
    const categoryRef = body.categoryId ?? body.category ?? body.categoryName;
    if (categoryRef) {
      const resolved = await resolveCategory(productType, categoryRef);
      update.categoryId = resolved.categoryId;
      update.categoryName = resolved.categoryName;
    }
  }

  if (hasField(body, 'featuredProduct', 'isFeatured', 'featured')) {
    update.featuredProduct = Boolean(
      parseBoolean(body.featuredProduct ?? body.isFeatured ?? body.featured)
    );
  }

  if (body.status !== undefined) {
    update.status = body.status;
  }

  if (productType === 'grocery') {
    if (body.stockStatus !== undefined) {
      update.stockStatus =
        body.stockStatus === 'out_of_stock' ? 'out_of_stock' : 'in_stock';
    }
    if (hasField(body, 'weightUnit', 'weightUnitSize', 'weight')) {
      update.weightUnit = (body.weightUnit || body.weightUnitSize || body.weight || '').trim();
    }
  } else {
    if (hasField(body, 'shortDescription', 'description')) {
      update.shortDescription = (body.shortDescription || body.description || '').trim();
    }
    if (hasField(body, 'menuDisplayTiming', 'displayTime')) {
      update.menuDisplayTiming = (body.menuDisplayTiming || body.displayTime || '').trim();
    }
    if (hasField(body, 'specialBadge', 'badge')) {
      update.specialBadge = (body.specialBadge || body.badge || '').trim();
    }
    if (body.cookingStartTime !== undefined) {
      update.cookingStartTime = (body.cookingStartTime || '').trim();
    }
    if (body.cookingEndTime !== undefined) {
      update.cookingEndTime = (body.cookingEndTime || '').trim();
    }
    if (update.cookingStartTime && update.cookingEndTime) {
      validateCookingTimes(update.cookingStartTime, update.cookingEndTime);
    }
  }

  if (hasField(body, 'imageUrl', 'image')) {
    const imageInput = body.imageUrl ?? body.image;
    update.imageUrl = imageInput ? await resolveImage(imageInput) : existingPlain.imageUrl || '';
  }

  return update;
};

export const listProducts = async (query = {}, options = {}) => {
  const filter = buildProductFilter(query, options);
  const products = await Product.find(filter).sort({ createdAt: -1 });
  return products.map(formatProduct);
};

export const getFeaturedProducts = async () => {
  const products = await Product.find({
    status: 'active',
    $or: [{ featuredProduct: true }, { isFeatured: true }],
  }).sort({ createdAt: -1 });
  return products.map(formatProduct);
};

export const getProductById = async (id) => {
  const product = await Product.findOne({ _id: id, status: { $ne: 'deleted' } });
  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }
  return formatProduct(product);
};

export const createProduct = async (body, user) => {
  const payload = await normalizeProductPayload(body);
  payload.createdBy = user?._id || null;
  payload.updatedBy = user?._id || null;

  const product = await Product.create(payload);

  await logManagerActivity({
    user,
    action: 'CREATE',
    module: 'PRODUCT',
    description: `Created ${product.productName}`,
  });

  return formatProduct(product);
};

export const updateProduct = async (id, body, user) => {
  const product = await Product.findOne({ _id: id, status: { $ne: 'deleted' } });
  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  const updateData = await buildPartialProductUpdate(body, product);
  if (Object.keys(updateData).length === 0) {
    return formatProduct(product);
  }

  updateData.updatedBy = user?._id || null;

  const updated = await Product.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  await logManagerActivity({
    user,
    action: 'UPDATE',
    module: 'PRODUCT',
    description: `Updated ${updated.productName || updated.name}`,
  });

  return formatProduct(updated);
};

export const softDeleteProduct = async (id, user) => {
  const product = await Product.findOne({ _id: id, status: { $ne: 'deleted' } });
  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  product.status = 'deleted';
  product.updatedBy = user?._id || null;
  await product.save();

  await logManagerActivity({
    user,
    action: 'DELETE',
    module: 'PRODUCT',
    description: `Deleted ${product.productName}`,
  });

  return { success: true };
};

export const getCategoriesForProductType = async (productTypeValue) => {
  const productType = normalizeProductType(productTypeValue);

  if (productType === 'food-corner') {
    const categories = await FoodCornerCategory.find({ status: true }).sort({
      displayOrder: 1,
      categoryName: 1,
    });
    return categories.map((cat) => ({
      id: cat._id.toString(),
      categoryId: cat._id.toString(),
      slug: cat.slug,
      categoryName: cat.categoryName,
      name: cat.categoryName,
    }));
  }

  const categories = await Category.find({ status: 'active' }).sort({ name: 1 });
  return categories.map((cat) => ({
    id: cat.slug || cat._id.toString(),
    categoryId: cat.slug || cat._id.toString(),
    slug: cat.slug,
    categoryName: cat.name,
    name: cat.name,
  }));
};
