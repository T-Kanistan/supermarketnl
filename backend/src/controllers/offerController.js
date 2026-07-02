import * as offerService from '../services/offerService.js';
import { persistUploadedFile } from '../services/uploadService.js';

const handleServiceError = (error, res, next) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  return next(error);
};

export const getOffers = async (req, res, next) => {
  try {
    const data = await offerService.listOffers(req.query, { publicOnly: true });
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const getAllOffers = async (req, res, next) => {
  try {
    const data = await offerService.listOffers(req.query);
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const getFeaturedOffers = async (req, res, next) => {
  try {
    const data = await offerService.getFeaturedOffers();
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const getOfferCategories = async (req, res, next) => {
  try {
    const data = await offerService.getOfferCategories({ publicOnly: req.query.admin !== 'true' });
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const getOfferCategoriesManage = async (req, res, next) => {
  try {
    const data = await offerService.listOfferCategoriesAdmin();
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const createOfferCategory = async (req, res, next) => {
  try {
    const data = await offerService.createOfferCategory(req.body, req.user);
    return res.status(201).json({ success: true, message: 'Category created successfully', data });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const updateOfferCategory = async (req, res, next) => {
  try {
    const data = await offerService.updateOfferCategory(req.params.id, req.body, req.user);
    return res.status(200).json({ success: true, message: 'Category updated successfully', data });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const updateOfferCategoryStatus = async (req, res, next) => {
  try {
    const data = await offerService.updateOfferCategoryStatus(
      req.params.id,
      req.body.status ?? req.body.active,
      req.user
    );
    return res.status(200).json({ success: true, message: 'Status updated', data });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const deleteOfferCategory = async (req, res, next) => {
  try {
    await offerService.deleteOfferCategory(req.params.id, req.user);
    return res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const getOffersByCategory = async (req, res, next) => {
  try {
    const data = await offerService.getOffersByCategory(req.params.category);
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const getOfferBanner = async (req, res, next) => {
  try {
    const data = await offerService.getOfferBanner();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const updateOfferBanner = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (req.files?.heroImage?.[0]) {
      body.heroImage = await persistUploadedFile(req.files.heroImage[0]);
    }
    if (req.files?.promoImage?.[0]) {
      body.promoImage = await persistUploadedFile(req.files.promoImage[0]);
    }
    const data = await offerService.updateOfferBanner(body, req.user);
    return res.status(200).json({
      success: true,
      message: 'Offers banner updated successfully',
      data,
    });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const getOffer = async (req, res, next) => {
  try {
    const data = await offerService.getOfferById(req.params.id, { publicOnly: true });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const createOffer = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (req.file) {
      body.image = await persistUploadedFile(req.file);
    }
    const data = await offerService.createOffer(body, req.user);
    return res.status(201).json({
      success: true,
      message: 'Offer created successfully',
      data,
    });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const updateOffer = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (req.file) {
      body.image = await persistUploadedFile(req.file);
    }
    const data = await offerService.updateOffer(req.params.id, body, req.user);
    return res.status(200).json({
      success: true,
      message: 'Offer updated successfully',
      data,
    });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const updateOfferStatus = async (req, res, next) => {
  try {
    const data = await offerService.updateOfferStatus(req.params.id, req.body.status, req.user);
    return res.status(200).json({ success: true, message: 'Status updated', data });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const deleteOffer = async (req, res, next) => {
  try {
    await offerService.softDeleteOffer(req.params.id, req.user);
    return res.status(200).json({ success: true, message: 'Offer deleted successfully' });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const uploadOfferImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Offer image file is required' });
    }
    const imageUrl = await persistUploadedFile(req.file);
    return res.status(200).json({ success: true, imageUrl });
  } catch (error) {
    return next(error);
  }
};

export { offerImageUpload } from '../middlewares/offerUploadMiddleware.js';
