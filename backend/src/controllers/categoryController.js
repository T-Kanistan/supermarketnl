import mongoose from 'mongoose';
import Category from '../models/Category.js';
import { handleBase64Upload } from '../middlewares/uploadMiddleware.js';

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const mapCategory = (category) => ({
  ...category.toObject(),
  id: category.slug,
});

const findCategoryByParam = async (param) => {
  if (mongoose.Types.ObjectId.isValid(param)) {
    return Category.findById(param);
  }
  return Category.findOne({ slug: param });
};

/**
 * @desc    Get active categories (public)
 * @route   GET /api/categories
 */
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ status: 'active' }).sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories.map(mapCategory),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all categories (admin)
 * @route   GET /api/categories/all
 */
export const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories.map(mapCategory),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create category
 * @route   POST /api/categories
 */
export const createCategory = async (req, res, next) => {
  try {
    const { name, status } = req.body;
    const slug = slugify(name);

    let image = '';
    if (req.body.image) {
      image = (await handleBase64Upload(req.body.image)) || req.body.image;
    }

    const category = await Category.create({
      slug,
      name,
      image,
      status,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: mapCategory(category),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update category
 * @route   PUT /api/categories/:id
 */
export const updateCategory = async (req, res, next) => {
  try {
    const category = await findCategoryByParam(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    if (req.body.name !== undefined) {
      category.name = req.body.name;
      category.slug = slugify(req.body.name);
    }
    if (req.body.status !== undefined) category.status = req.body.status;
    if (req.body.image !== undefined) {
      category.image = (await handleBase64Upload(req.body.image)) || req.body.image;
    }

    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: mapCategory(category),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete category
 * @route   DELETE /api/categories/:id
 */
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await findCategoryByParam(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
