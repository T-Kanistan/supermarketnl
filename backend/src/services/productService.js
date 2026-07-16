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

const sanitizeText = (value) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

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

const MENU_TIMING_RANGE_REGEX =
  /^((0[1-9])|(1[0-2])):([0-5][0-9])\s?(AM|PM)\s*-\s*((0[1-9])|(1[0-2])):([0-5][0-9])\s?(AM|PM)$/i;

const normalizeMenuDisplayTiming = (value) => {
  const raw = sanitizeText(value);
  const match = raw.match(MENU_TIMING_RANGE_REGEX);
  if (!match) return '';
  return `${match[1]}:${match[4]} ${match[5].toUpperCase()} - ${match[6]}:${match[9]} ${match[10].toUpperCase()}`;
};

const isAllowedProductImageReference = (value) => {
  const raw = sanitizeText(value);
  if (!raw) return false;
  if (/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(raw)) return true;
  return /\.(jpe?g|png|webp)(\?.*)?$/i.test(raw);
};

const normalizeComparableProductName = (value) => sanitizeText(value).toLowerCase();

const assertUniqueProductNameInCatalogCategory = async ({
  productName,
  productType,
  categoryId,
  excludeId = null,
}) => {
  const comparableName = normalizeComparableProductName(productName);
  if (!comparableName || !productType || !categoryId) return;

  const filter = {
    status: { $ne: 'deleted' },
    productType,
  };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  const existing = await Product.find(filter).select('productName name categoryId');
  const duplicate = existing.some(
    (item) =>
      String(item.categoryId || '') === String(categoryId || '') &&
      normalizeComparableProductName(item.productName || item.name) === comparableName
  );
  if (duplicate) {
    const error = new Error('This product already exists.');
    error.statusCode = 400;
    throw error;
  }
};

const validateProductNameRules = (value) => {
  const productName = sanitizeText(value);
  if (!productName) {
    const error = new Error('Please enter the product name.');
    error.statusCode = 400;
    throw error;
  }
  if (productName.length < 2 || productName.length > 100) {
    const error = new Error('Product name must be between 2 and 100 characters.');
    error.statusCode = 400;
    throw error;
  }
  if (!/^[A-Za-z0-9\s\-'"&()]+$/.test(productName)) {
    const error = new Error('Product name must contain only letters, numbers, spaces, hyphens, apostrophes, ampersands, and parentheses.');
    error.statusCode = 400;
    throw error;
  }
  return productName;
};

const validatePriceRules = (value) => {
  if (value === undefined || value === null || String(value).trim() === '') {
    const error = new Error('Please enter the product price.');
    error.statusCode = 400;
    throw error;
  }
  const raw = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
    const error = new Error('Please enter a valid price.');
    error.statusCode = 400;
    throw error;
  }
  const price = Number(raw);
  if (!Number.isFinite(price)) {
    const error = new Error('Please enter a valid price.');
    error.statusCode = 400;
    throw error;
  }
  if (price <= 0) {
    const error = new Error('Price must be greater than €0.');
    error.statusCode = 400;
    throw error;
  }
  if (price > 9999.99) {
    const error = new Error('Please enter a valid price.');
    error.statusCode = 400;
    throw error;
  }
  return price;
};

const validateGroceryWeightUnit = (value) => {
  const weightUnit = sanitizeText(value);
  if (!weightUnit) {
    const error = new Error('Please enter the weight or unit size.');
    error.statusCode = 400;
    throw error;
  }
  if (weightUnit.length > 20) {
    const error = new Error('Weight / unit size cannot exceed 20 characters.');
    error.statusCode = 400;
    throw error;
  }
  return weightUnit;
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
  const featuredProduct = Boolean(plain.showOnHomepage ?? plain.featuredProduct ?? plain.isFeatured);
  const stockStatus =
    plain.stockStatus || (Number(plain.stock) > 0 ? 'in_stock' : 'out_of_stock');

  return {
    ...plain,
    id: plain._id?.toString?.() ?? plain.id,
    productType,
    productName,
    imageUrl,
    featuredProduct,
    showOnHomepage: featuredProduct,
    stockStatus,
    weightUnit: plain.weightUnit || plain.weight || '',
    shortDescription: plain.shortDescription || plain.description || '',
    menuDisplayTiming: plain.menuDisplayTiming || plain.displayTime || '',
    specialBadge: plain.specialBadge || plain.badge || '',
    cookingStartTime: plain.cookingStartTime || '',
    cookingEndTime: plain.cookingEndTime || '',
    status: plain.status || 'active',
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

export const formatProductListItem = (doc) => {
  const plain = formatProduct(doc);
  const status = plain.status === 'deleted' ? 'inactive' : plain.status || 'active';

  return {
    _id: plain._id,
    id: plain.id,
    productName: plain.productName,
    category: plain.categoryName || plain.categoryId || '',
    categoryId: plain.categoryId,
    categoryName: plain.categoryName,
    price: plain.price,
    image: plain.imageUrl || plain.image || '',
    imageUrl: plain.imageUrl || plain.image || '',
    status,
    featuredProduct: plain.featuredProduct,
    showOnHomepage: plain.showOnHomepage,
    isFeatured: plain.isFeatured,
    productType: plain.productType,
    name: plain.name || plain.productName,
    stock: plain.stock,
    weightUnit: plain.weightUnit || plain.weight || '',
    weight: plain.weightUnit || plain.weight || '',
    createdAt: plain.createdAt,
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

  const featured = parseBoolean(
    query.showOnHomepage ?? query.featuredProduct ?? query.isFeatured ?? query.featured
  );
  if (featured !== undefined) {
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [
        { showOnHomepage: featured },
        { featuredProduct: featured },
        { isFeatured: featured },
      ],
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
  const productName = sanitizeText(body.productName || body.name || '');
  const priceValue = body.price;
  const hasPrice = priceValue !== undefined && priceValue !== null && priceValue !== '';
  const price = hasPrice ? validatePriceRules(priceValue) : undefined;

  if (!isUpdate) validateProductNameRules(productName);

  if (!isUpdate && price === undefined) validatePriceRules(priceValue);

  const imageInput = body.imageUrl ?? body.image;
  if (!isUpdate && productType === 'food-corner' && !imageInput) {
    const error = new Error('Please upload a product image.');
    error.statusCode = 400;
    throw error;
  }
  if (imageInput && !isAllowedProductImageReference(imageInput)) {
    const error = new Error('Unsupported file format. Please upload JPG, JPEG, PNG, or WEBP image files only.');
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

  const featuredValue =
    productType === 'grocery'
      ? parseBoolean(body.showOnHomepage ?? body.featuredProduct ?? body.isFeatured ?? body.featured) ?? false
      : false;

  const payload = {
    productType,
    productName,
    categoryId,
    categoryName,
    price,
    featuredProduct: featuredValue,
    showOnHomepage: featuredValue,
    status: ['active', 'inactive'].includes(body.status) ? body.status : 'active',
  };

  if (productType === 'grocery') {
    const stockStatus =
      body.stockStatus ||
      (body.stock > 0 || body.stock === 'in_stock' ? 'in_stock' : 'out_of_stock');
    payload.stockStatus = stockStatus === 'out_of_stock' ? 'out_of_stock' : 'in_stock';
    payload.weightUnit = validateGroceryWeightUnit(
      body.weightUnit || body.weightUnitSize || body.weight || ''
    );
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

    payload.shortDescription = sanitizeText(body.shortDescription || body.description || '');
    if (payload.shortDescription.length > 500) {
      const error = new Error('Description cannot exceed 500 characters.');
      error.statusCode = 400;
      throw error;
    }
    payload.menuDisplayTiming = normalizeMenuDisplayTiming(body.menuDisplayTiming || body.displayTime || '');
    if (!payload.menuDisplayTiming) {
      const error = new Error('Please enter a valid time range.');
      error.statusCode = 400;
      throw error;
    }
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
    update.productName = validateProductNameRules(body.productName || body.name || '');
  }

  if (body.price !== undefined) {
    update.price = validatePriceRules(body.price);
  }

  if (hasField(body, 'categoryId', 'category', 'categoryName')) {
    const categoryRef = body.categoryId ?? body.category ?? body.categoryName;
    if (categoryRef) {
      const resolved = await resolveCategory(productType, categoryRef);
      update.categoryId = resolved.categoryId;
      update.categoryName = resolved.categoryName;
    }
  }

  if (hasField(body, 'featuredProduct', 'isFeatured', 'featured', 'showOnHomepage')) {
    if (productType === 'grocery') {
      const featuredValue = Boolean(
        parseBoolean(body.showOnHomepage ?? body.featuredProduct ?? body.isFeatured ?? body.featured)
      );
      update.featuredProduct = featuredValue;
      update.showOnHomepage = featuredValue;
    }
  }

  if (hasField(body, 'productType', 'type', 'productCatalogType') && productType === 'food-corner') {
    update.showOnHomepage = false;
    update.featuredProduct = false;
    update.weightUnit = '';
    update.stockStatus = 'in_stock';
    update.shortDescription = update.shortDescription ?? existingPlain.shortDescription ?? '';
  }

  if (hasField(body, 'productType', 'type', 'productCatalogType') && productType === 'grocery') {
    update.menuDisplayTiming = '';
    update.shortDescription = '';
    update.displayTime = '';
  }

  if (body.status !== undefined) {
    if (!['active', 'inactive'].includes(body.status)) {
      const error = new Error('Status must be active or inactive');
      error.statusCode = 400;
      throw error;
    }
    update.status = body.status;
  }

  if (productType === 'grocery') {
    if (body.stockStatus !== undefined) {
      update.stockStatus =
        body.stockStatus === 'out_of_stock' ? 'out_of_stock' : 'in_stock';
    }
    if (hasField(body, 'weightUnit', 'weightUnitSize', 'weight')) {
      update.weightUnit = validateGroceryWeightUnit(
        body.weightUnit || body.weightUnitSize || body.weight || ''
      );
    }
  } else {
    if (hasField(body, 'shortDescription', 'description')) {
      const cleanedDescription = sanitizeText(body.shortDescription || body.description || '');
      if (cleanedDescription.length > 500) {
        const error = new Error('Description cannot exceed 500 characters.');
        error.statusCode = 400;
        throw error;
      }
      update.shortDescription = cleanedDescription;
    }
    if (hasField(body, 'menuDisplayTiming', 'displayTime')) {
      const cleanedTiming = normalizeMenuDisplayTiming(body.menuDisplayTiming || body.displayTime || '');
      if (!cleanedTiming) {
        const error = new Error('Please enter a valid time range.');
        error.statusCode = 400;
        throw error;
      }
      update.menuDisplayTiming = cleanedTiming;
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
    if (imageInput && !isAllowedProductImageReference(imageInput)) {
      const error = new Error('Unsupported file format. Please upload JPG, JPEG, PNG, or WEBP image files only.');
      error.statusCode = 400;
      throw error;
    }
    update.imageUrl = imageInput ? await resolveImage(imageInput) : existingPlain.imageUrl || '';
  }

  return update;
};

export const listProducts = async (query = {}, options = {}) => {
  const filter = buildProductFilter(query, options);
  const products = await Product.find(filter).sort({ createdAt: -1 });

  if (options.publicListFormat) {
    return products.map(formatProductListItem);
  }

  return products.map(formatProduct);
};

export const getFeaturedProducts = async () => {
  const products = await Product.find({
    status: 'active',
    $or: [
      { showOnHomepage: true },
      { featuredProduct: true },
      { isFeatured: true },
    ],
  }).sort({ createdAt: -1 });
  return products.map(formatProduct);
};

export const getProductById = async (id, options = {}) => {
  const filter = { _id: id, status: { $ne: 'deleted' } };
  if (options.publicOnly) {
    filter.status = 'active';
  }

  const product = await Product.findOne(filter);
  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }
  return formatProduct(product);
};

export const createProduct = async (body, user) => {
  const payload = await normalizeProductPayload(body);
  await assertUniqueProductNameInCatalogCategory({
    productName: payload.productName,
    productType: payload.productType,
    categoryId: payload.categoryId,
  });
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
  const role = user?.role || user?.accountType;

  const product = await Product.findOne({ _id: id, status: { $ne: 'deleted' } });
  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  const updateData = await buildPartialProductUpdate(body, product);
  const mergedType = updateData.productType || product.productType;
  const mergedTiming = sanitizeText(updateData.menuDisplayTiming ?? product.menuDisplayTiming ?? product.displayTime);
  const mergedDescription = sanitizeText(updateData.shortDescription ?? product.shortDescription ?? product.description);
  if (mergedType === 'food-corner') {
    if (!mergedTiming) {
      const error = new Error('Please enter the menu display time.');
      error.statusCode = 400;
      throw error;
    }
    if (!normalizeMenuDisplayTiming(mergedTiming)) {
      const error = new Error('Please enter a valid time range.');
      error.statusCode = 400;
      throw error;
    }
    if (mergedDescription.length > 500) {
      const error = new Error('Description cannot exceed 500 characters.');
      error.statusCode = 400;
      throw error;
    }
  }
  const nextType = updateData.productType || product.productType;
  const nextCategoryId = updateData.categoryId || product.categoryId;
  const nextProductName = updateData.productName || product.productName || product.name;
  if (nextProductName && nextType && nextCategoryId) {
    await assertUniqueProductNameInCatalogCategory({
      productName: nextProductName,
      productType: nextType,
      categoryId: nextCategoryId,
      excludeId: product._id,
    });
  }
  if (role === 'manager') {
    delete updateData.productType;
  }
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

export const updateProductStatus = async (id, status, user) => {
  if (!['active', 'inactive'].includes(status)) {
    const error = new Error('Status must be active or inactive');
    error.statusCode = 400;
    throw error;
  }

  const product = await Product.findOne({ _id: id, status: { $ne: 'deleted' } });
  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  product.status = status;
  product.updatedBy = user?._id || null;
  await product.save();

  await logManagerActivity({
    user,
    action: 'UPDATE_STATUS',
    module: 'PRODUCT',
    description: `Set ${product.productName || product.name} status to ${status}`,
  });

  return formatProduct(product);
};

export const getCategoriesForProductType = async (productTypeValue) => {
  const productType = normalizeProductType(productTypeValue);

  if (productType === 'food-corner') {
    const categories = await FoodCornerCategory.find({ status: true }).sort({
      createdAt: -1,
      _id: -1,
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

export const batchAdjustPrices = async ({ productType, categoryId, adjustmentType, direction, value }, user) => {
  const role = user?.role || user?.accountType;
  if (role !== 'admin') {
    const error = new Error('Only administrators can perform batch price adjustments');
    error.statusCode = 403;
    throw error;
  }

  if (!productType || !categoryId || !adjustmentType || !direction || value === undefined) {
    const error = new Error('All fields are required');
    error.statusCode = 400;
    throw error;
  }

  const numValue = Number(value);
  if (Number.isNaN(numValue) || numValue <= 0) {
    const error = new Error('Adjustment value must be a positive number greater than 0');
    error.statusCode = 400;
    throw error;
  }

  const normalizedType = normalizeProductType(productType);
  
  // Resolve category name for logging
  let categoryName = '';
  if (normalizedType === 'food-corner') {
    const cat = await FoodCornerCategory.findById(categoryId);
    if (!cat) {
      const error = new Error('Food Corner category not found');
      error.statusCode = 404;
      throw error;
    }
    categoryName = cat.categoryName || cat.name;
  } else {
    const cat = await findGroceryCategory(categoryId);
    if (!cat) {
      const error = new Error('Grocery category not found');
      error.statusCode = 404;
      throw error;
    }
    categoryName = cat.name;
  }

  // Construct search filter matching buildProductFilter
  const filter = { status: { $ne: 'deleted' } };
  const legacyTypeCondition =
    normalizedType === 'food-corner' ? { $in: ['food', 'food-corner'] } : 'grocery';
  filter.$or = [
    { type: legacyTypeCondition },
    { $and: [{ type: { $exists: false } }, { productType: normalizedType }] },
  ];
  filter.categoryId = categoryId;

  const products = await Product.find(filter);
  if (products.length === 0) {
    return {
      success: true,
      count: 0,
      message: `No products found under the selected category "${categoryName}".`,
    };
  }

  const updatedProducts = [];
  for (const product of products) {
    const previousPrice = product.price;
    let newPrice = previousPrice;

    if (direction === 'increase') {
      if (adjustmentType === 'percentage') {
        newPrice = previousPrice * (1 + numValue / 100);
      } else {
        newPrice = previousPrice + numValue;
      }
    } else if (direction === 'decrease') {
      if (adjustmentType === 'percentage') {
        newPrice = previousPrice * (1 - numValue / 100);
      } else {
        newPrice = previousPrice - numValue;
      }
    }

    // Round to 2 decimal places and ensure minimum price is 0.01
    newPrice = Math.max(0.01, Math.round(newPrice * 100) / 100);

    product.price = newPrice;
    
    // Update oldPrice for discount display
    if (direction === 'decrease') {
      product.oldPrice = previousPrice;
    } else {
      product.oldPrice = null;
    }

    product.updatedBy = user?._id || null;
    await product.save();
    updatedProducts.push(product);
  }

  // Log audit/activity
  await logManagerActivity({
    user,
    action: 'BATCH_UPDATE_PRICES',
    module: 'PRODUCT',
    description: `Adjusted prices for category "${categoryName}" (${normalizedType === 'food-corner' ? 'Food Corner' : 'Grocery'}) by ${direction === 'increase' ? '+' : '-'}${numValue}${adjustmentType === 'percentage' ? '%' : ''}. Updated ${products.length} products.`,
  });

  return {
    success: true,
    count: products.length,
    message: `Successfully adjusted prices for ${products.length} products in category "${categoryName}".`,
  };
};

