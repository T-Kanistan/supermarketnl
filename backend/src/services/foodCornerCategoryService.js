import mongoose from 'mongoose';
import FoodCornerCategory from '../models/FoodCornerCategory.js';
import Product from '../models/Product.js';
import { buildMultiFieldSearchFilter } from '../utils/adminSearchQuery.js';
import { persistFoodCornerCategoryIconUpload } from './uploadService.js';
import {
  assertFoodCornerCategoryName,
  assertFoodCornerCategorySlug,
  FOOD_CORNER_CATEGORY_SLUG_MAX,
  isFoodCornerCategoryIconUrl,
  resolveFoodCornerCategoryIcon,
} from '../utils/foodCornerCategoryIconValidation.js';

const uploadCategoryIcon = async (value) => persistFoodCornerCategoryIconUpload(value);

/** Newest categories first everywhere (admin list, public menu, dropdowns). */
const CATEGORY_SORT = { createdAt: -1, _id: -1 };

export const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, FOOD_CORNER_CATEGORY_SLUG_MAX);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const mapCategory = (category) => {
  const plain = category.toObject ? category.toObject() : category;
  return {
    _id: plain._id,
    id: plain._id?.toString(),
    categoryName: plain.categoryName,
    slug: plain.slug,
    icon: plain.icon || '',
    description: plain.description || '',
    displayOrder: plain.displayOrder ?? 0,
    status: Boolean(plain.status),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const mapPublicCategory = (category) => {
  const plain = category.toObject ? category.toObject() : category;
  return {
    _id: plain._id,
    categoryName: plain.categoryName,
    slug: plain.slug,
    icon: plain.icon || '',
  };
};

export const findCategoryByParam = async (param) => {
  const raw = String(param || '').trim();
  if (!raw) return null;

  if (mongoose.Types.ObjectId.isValid(raw)) {
    const byId = await FoodCornerCategory.findById(raw);
    if (byId) return byId;
  }

  const bySlug = await FoodCornerCategory.findOne({ slug: raw.toLowerCase() });
  if (bySlug) return bySlug;

  return FoodCornerCategory.findOne({
    categoryName: new RegExp(`^${escapeRegex(raw)}$`, 'i'),
  });
};

const parseStatusFilter = (value) => {
  if (value === undefined || value === null || value === '' || value === 'all') {
    return undefined;
  }
  if (value === true || value === 'true' || value === 1 || value === '1') return true;
  if (value === false || value === 'false' || value === 0 || value === '0') return false;
  return undefined;
};

const parsePagination = (query) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const buildCategoryQuery = (query = {}) => {
  const filter = {};

  const searchFilter = buildMultiFieldSearchFilter(query.search, [
    'categoryName',
    'slug',
    'description',
  ]);
  if (searchFilter) {
    Object.assign(filter, searchFilter);
  }

  const status = parseStatusFilter(query.status);
  if (status !== undefined) {
    filter.status = status;
  }

  return filter;
};

export const listCategories = async (query = {}) => {
  const filter = buildCategoryQuery(query);
  const { page, limit, skip } = parsePagination(query);

  const [categories, total] = await Promise.all([
    FoodCornerCategory.find(filter)
      .sort(CATEGORY_SORT)
      .skip(skip)
      .limit(limit),
    FoodCornerCategory.countDocuments(filter),
  ]);

  return {
    categories: categories.map(mapCategory),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getPublicCategories = async () => {
  const categories = await FoodCornerCategory.find({ status: true })
    .sort(CATEGORY_SORT)
    .select('categoryName slug icon createdAt');

  return categories.map(mapPublicCategory);
};

export const getCategoryById = async (id) => {
  const category = await findCategoryByParam(id);
  if (!category) {
    const error = new Error('Food Corner category not found');
    error.statusCode = 404;
    throw error;
  }
  return mapCategory(category);
};

export const countLinkedFoodItems = async (category) => {
  const id = category._id;
  const slug = category.slug;
  const categoryName = category.categoryName;

  return Product.countDocuments({
    type: 'food',
    $or: [
      { categoryId: id },
      { categoryId: id.toString() },
      { categoryId: slug },
      { categoryName },
    ],
  });
};

export const resolveCategoryReference = async (reference) => {
  if (!reference) {
    const error = new Error('Food Corner category is required');
    error.statusCode = 400;
    throw error;
  }

  const category = await findCategoryByParam(reference);
  if (!category) {
    const error = new Error('Food Corner category not found');
    error.statusCode = 400;
    throw error;
  }

  return category;
};

export const createCategory = async (payload) => {
  const categoryName = assertFoodCornerCategoryName(payload.categoryName || payload.name || '');
  const slug = assertFoodCornerCategorySlug(payload.slug || slugify(categoryName));

  const existingName = await FoodCornerCategory.findOne({
    categoryName: { $regex: new RegExp(`^${escapeRegex(categoryName)}$`, 'i') },
  });
  if (existingName) {
    const error = new Error('Category name must be unique');
    error.statusCode = 400;
    throw error;
  }

  const existingSlug = await FoodCornerCategory.findOne({ slug });
  if (existingSlug) {
    const error = new Error('Category slug must be unique');
    error.statusCode = 400;
    throw error;
  }

  const category = await FoodCornerCategory.create({
    categoryName,
    slug,
    icon: await resolveFoodCornerCategoryIcon(payload.icon, { required: true }, uploadCategoryIcon),
    description: payload.description || '',
    displayOrder: Number(payload.displayOrder) || 0,
    status: payload.status !== undefined ? Boolean(payload.status) : true,
  });

  return mapCategory(category);
};

export const updateCategory = async (id, payload) => {
  const category = await findCategoryByParam(id);
  if (!category) {
    const error = new Error('Food Corner category not found');
    error.statusCode = 404;
    throw error;
  }

  const previousId = category._id;
  const previousSlug = category.slug;
  const previousName = category.categoryName;

  if (payload.categoryName !== undefined || payload.name !== undefined) {
    const categoryName = assertFoodCornerCategoryName(payload.categoryName || payload.name);
    const existingName = await FoodCornerCategory.findOne({
      _id: { $ne: category._id },
      categoryName: { $regex: new RegExp(`^${escapeRegex(categoryName)}$`, 'i') },
    });
    if (existingName) {
      const error = new Error('Category name must be unique');
      error.statusCode = 400;
      throw error;
    }
    category.categoryName = categoryName;
  }

  if (payload.slug !== undefined) {
    const slug = assertFoodCornerCategorySlug(payload.slug);
    const existingSlug = await FoodCornerCategory.findOne({
      _id: { $ne: category._id },
      slug,
    });
    if (existingSlug) {
      const error = new Error('Category slug must be unique');
      error.statusCode = 400;
      throw error;
    }
    category.slug = slug;
  } else if (payload.categoryName !== undefined || payload.name !== undefined) {
    const slug = assertFoodCornerCategorySlug(slugify(category.categoryName));
    const existingSlug = await FoodCornerCategory.findOne({
      _id: { $ne: category._id },
      slug,
    });
    if (!existingSlug) {
      category.slug = slug;
    }
  }

  if (payload.icon !== undefined) {
    category.icon = await resolveFoodCornerCategoryIcon(
      payload.icon,
      { required: true, existingIcon: category.icon },
      uploadCategoryIcon
    );
  } else if (!isFoodCornerCategoryIconUrl(category.icon)) {
    const error = new Error('Please upload a category icon.');
    error.statusCode = 400;
    throw error;
  }
  if (payload.description !== undefined) category.description = payload.description;
  if (payload.displayOrder !== undefined) {
    category.displayOrder = Number(payload.displayOrder) || 0;
  }
  if (payload.status !== undefined) category.status = Boolean(payload.status);

  await category.save();

  const categoryChanged =
    !category._id.equals(previousId) ||
    category.slug !== previousSlug ||
    category.categoryName !== previousName;

  if (categoryChanged) {
    await Product.updateMany(
      {
        type: 'food',
        $or: [
          { categoryId: previousId },
          { categoryId: previousId.toString() },
          { categoryId: previousSlug },
          { categoryName: previousName },
        ],
      },
      {
        $set: {
          categoryId: category._id,
          categoryName: category.categoryName,
        },
      }
    );
  } else if (category.categoryName !== previousName) {
    await Product.updateMany(
      { type: 'food', categoryId: category._id },
      { $set: { categoryName: category.categoryName } }
    );
  }

  return mapCategory(category);
};

export const toggleCategoryStatus = async (id, forcedStatus) => {
  const category = await findCategoryByParam(id);
  if (!category) {
    const error = new Error('Food Corner category not found');
    error.statusCode = 404;
    throw error;
  }

  category.status =
    forcedStatus !== undefined ? Boolean(forcedStatus) : !category.status;
  await category.save();
  return mapCategory(category);
};

export const deleteCategory = async (id) => {
  const category = await findCategoryByParam(id);
  if (!category) {
    const error = new Error('Food Corner category not found');
    error.statusCode = 404;
    throw error;
  }

  const linkedCount = await countLinkedFoodItems(category);
  if (linkedCount > 0) {
    const error = new Error(
      `Cannot delete category linked to ${linkedCount} Food Corner item(s)`
    );
    error.statusCode = 400;
    throw error;
  }

  await category.deleteOne();
  return true;
};

export const getActiveCategories = async () => {
  return FoodCornerCategory.find({ status: true }).sort(CATEGORY_SORT);
};

export const buildCategoryLookupMap = (categories) => {
  const map = new Map();
  categories.forEach((cat) => {
    const plain = cat.toObject ? cat.toObject() : cat;
    map.set(String(plain._id), plain);
    map.set(plain._id?.toString(), plain);
    map.set(plain.slug, plain);
    map.set(plain.categoryName, plain);
  });
  return map;
};
