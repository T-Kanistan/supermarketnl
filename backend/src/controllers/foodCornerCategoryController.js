import {
  listCategories,
  getPublicCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
  deleteCategory,
} from '../services/foodCornerCategoryService.js';

const handleServiceError = (res, error) =>
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server error',
  });

/**
 * @desc    List Food Corner categories with search, status filter, pagination
 * @route   GET /api/food-corner/categories
 */
export const getFoodCornerCategories = async (req, res, next) => {
  try {
    const result = await listCategories(req.query);
    res.status(200).json({
      success: true,
      count: result.categories.length,
      pagination: result.pagination,
      data: result.categories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get active public Food Corner categories
 * @route   GET /api/food-corner/public/categories
 */
export const getPublicFoodCornerCategories = async (req, res, next) => {
  try {
    const categories = await getPublicCategories();
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single Food Corner category
 * @route   GET /api/food-corner/categories/:id
 */
export const getFoodCornerCategoryById = async (req, res, next) => {
  try {
    const category = await getCategoryById(req.params.id);
    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    if (error.statusCode) return handleServiceError(res, error);
    next(error);
  }
};

/**
 * @desc    Create Food Corner category
 * @route   POST /api/food-corner/categories
 */
export const createFoodCornerCategory = async (req, res, next) => {
  try {
    const category = await createCategory(req.body);
    res.status(201).json({
      success: true,
      message: 'Food Corner category created successfully',
      data: category,
    });
  } catch (error) {
    if (error.statusCode) return handleServiceError(res, error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category name or slug already exists',
      });
    }
    next(error);
  }
};

/**
 * @desc    Update Food Corner category
 * @route   PUT /api/food-corner/categories/:id
 */
export const updateFoodCornerCategory = async (req, res, next) => {
  try {
    const category = await updateCategory(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Food Corner category updated successfully',
      data: category,
    });
  } catch (error) {
    if (error.statusCode) return handleServiceError(res, error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category name or slug already exists',
      });
    }
    next(error);
  }
};

/**
 * @desc    Toggle Food Corner category status
 * @route   PATCH /api/food-corner/categories/:id/status
 */
export const toggleFoodCornerCategoryStatus = async (req, res, next) => {
  try {
    const category = await toggleCategoryStatus(req.params.id, req.body?.status);
    res.status(200).json({
      success: true,
      message: `Category ${category.status ? 'activated' : 'deactivated'} successfully`,
      data: category,
    });
  } catch (error) {
    if (error.statusCode) return handleServiceError(res, error);
    next(error);
  }
};

/**
 * @desc    Delete Food Corner category
 * @route   DELETE /api/food-corner/categories/:id
 */
export const deleteFoodCornerCategory = async (req, res, next) => {
  try {
    await deleteCategory(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Food Corner category deleted successfully',
    });
  } catch (error) {
    if (error.statusCode) return handleServiceError(res, error);
    next(error);
  }
};
