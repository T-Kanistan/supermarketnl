import * as productService from '../services/productService.js';

export const getProducts = async (req, res, next) => {
  try {
    const data = await productService.listProducts(req.query, {
      publicOnly: true,
      publicListFormat: true,
    });
    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllProducts = async (req, res, next) => {
  try {
    const data = await productService.listProducts(req.query);
    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getFeaturedProducts = async (req, res, next) => {
  try {
    const data = await productService.getFeaturedProducts();
    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductCategories = async (req, res, next) => {
  try {
    const data = await productService.getCategoriesForProductType(req.query.productType);
    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req, res, next) => {
  try {
    const data = await productService.getProductById(req.params.id, { publicOnly: true });
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const data = await productService.createProduct(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    console.log('PRODUCT ID', req.params.id);
    console.log('UPDATE REQUEST BODY', req.body);

    const data = await productService.updateProduct(req.params.id, req.body, req.user);
    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    await productService.softDeleteProduct(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const updateProductStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const data = await productService.updateProductStatus(req.params.id, status, req.user);
    return res.status(200).json({
      success: true,
      message: 'Status updated',
      data,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Product image file is required',
      });
    }

    const imageUrl = `/uploads/products/${req.file.filename}`;
    return res.status(200).json({
      success: true,
      imageUrl,
    });
  } catch (error) {
    next(error);
  }
};

export { productImageUpload } from '../middlewares/productUploadMiddleware.js';
