import Product from '../models/Product.js';
import { handleBase64Upload } from '../middlewares/uploadMiddleware.js';

const parseBoolean = (value) => {
  if (value === true || value === false) return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

const buildProductFilter = (query, { activeOnly = true } = {}) => {
  const filter = {};

  if (activeOnly) {
    filter.status = 'active';
  } else if (query.status) {
    filter.status = query.status;
  }

  if (query.type) filter.type = query.type;
  if (query.categoryId && query.categoryId !== 'all') filter.categoryId = query.categoryId;

  if (query.isFeatured !== undefined) {
    filter.isFeatured = parseBoolean(query.isFeatured);
  }

  if (query.search) {
    filter.name = { $regex: query.search, $options: 'i' };
  }

  return filter;
};

const resolveImage = async (value) => {
  if (!value) return '';
  if (typeof value === 'string' && value.startsWith('data:image')) {
    return (await handleBase64Upload(value)) || value;
  }
  return value;
};

/**
 * @desc    Get products with filters (public — active only)
 * @route   GET /api/products
 */
export const getProducts = async (req, res, next) => {
  try {
    const filter = buildProductFilter(req.query, { activeOnly: true });
    const products = await Product.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all products (admin)
 * @route   GET /api/products/all
 */
export const getAllProducts = async (req, res, next) => {
  try {
    const filter = buildProductFilter(req.query, { activeOnly: false });
    const products = await Product.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create product
 * @route   POST /api/products
 */
export const createProduct = async (req, res, next) => {
  try {
    const image = await resolveImage(req.body.image);

    const product = await Product.create({
      name: req.body.name,
      categoryId: req.body.categoryId,
      type: req.body.type || 'grocery',
      price: Number(req.body.price) || 0,
      oldPrice: req.body.oldPrice != null ? Number(req.body.oldPrice) : null,
      weight: req.body.weight || '',
      image,
      stock: Number(req.body.stock) || 0,
      status: req.body.status || 'active',
      isFeatured: parseBoolean(req.body.isFeatured) ?? false,
      rating: req.body.rating != null ? Number(req.body.rating) : 4.5,
      reviews: req.body.reviews != null ? Number(req.body.reviews) : 0,
      badge: req.body.badge || '',
      startTime: req.body.startTime || '',
      endTime: req.body.endTime || '',
      displayTime: req.body.displayTime || '',
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 */
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const fields = [
      'name',
      'categoryId',
      'type',
      'weight',
      'status',
      'badge',
      'startTime',
      'endTime',
      'displayTime',
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    if (req.body.price !== undefined) product.price = Number(req.body.price);
    if (req.body.oldPrice !== undefined) {
      product.oldPrice = req.body.oldPrice == null ? null : Number(req.body.oldPrice);
    }
    if (req.body.stock !== undefined) product.stock = Number(req.body.stock);
    if (req.body.rating !== undefined) product.rating = Number(req.body.rating);
    if (req.body.reviews !== undefined) product.reviews = Number(req.body.reviews);

    const featured = parseBoolean(req.body.isFeatured);
    if (featured !== undefined) product.isFeatured = featured;

    if (req.body.image !== undefined) {
      product.image = await resolveImage(req.body.image);
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
