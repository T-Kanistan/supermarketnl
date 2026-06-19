import aboutUsService from '../services/aboutUsService.js';
import { successResponse } from '../utils/apiResponse.js';

export const getAboutUs = async (req, res, next) => {
  try {
    const data = await aboutUsService.getAboutUs();
    return successResponse(res, 200, 'About Us CMS retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const updateAboutUs = async (req, res, next) => {
  try {
    const data = await aboutUsService.updateAboutUs(req.body);
    return successResponse(res, 200, 'About Us CMS updated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const uploadHomepageImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Homepage image file is required' });
    }
    const result = await aboutUsService.uploadAboutImage('homepage', req.file);
    return successResponse(res, 200, 'Homepage image uploaded successfully', result);
  } catch (error) {
    next(error);
  }
};

export const uploadHeroImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Hero image file is required' });
    }
    const result = await aboutUsService.uploadAboutImage('hero', req.file);
    return successResponse(res, 200, 'Hero image uploaded successfully', result);
  } catch (error) {
    next(error);
  }
};

export const uploadStoryImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Story image file is required' });
    }
    const result = await aboutUsService.uploadAboutImage('story', req.file);
    return successResponse(res, 200, 'Story image uploaded successfully', result);
  } catch (error) {
    next(error);
  }
};

export const uploadOwnerPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Owner photo file is required' });
    }
    const result = await aboutUsService.uploadAboutImage('owner', req.file);
    return successResponse(res, 200, 'Owner photo uploaded successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getOffers = async (req, res, next) => {
  try {
    const data = await aboutUsService.listOffers(false);
    return successResponse(res, 200, 'Offers retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const createOffer = async (req, res, next) => {
  try {
    const data = await aboutUsService.createOffer(req.body);
    return successResponse(res, 201, 'Offer created successfully', data);
  } catch (error) {
    next(error);
  }
};

export const updateOffer = async (req, res, next) => {
  try {
    const data = await aboutUsService.updateOffer(req.params.id, req.body);
    return successResponse(res, 200, 'Offer updated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const deleteOffer = async (req, res, next) => {
  try {
    await aboutUsService.deleteOffer(req.params.id);
    return successResponse(res, 200, 'Offer deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const reorderOffers = async (req, res, next) => {
  try {
    const data = await aboutUsService.reorderOffers(req.body.orders);
    return successResponse(res, 200, 'Offers reordered successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getStatistics = async (req, res, next) => {
  try {
    const data = await aboutUsService.listStatistics();
    return successResponse(res, 200, 'Statistics retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const createStatistic = async (req, res, next) => {
  try {
    const data = await aboutUsService.createStatistic(req.body);
    return successResponse(res, 201, 'Statistic created successfully', data);
  } catch (error) {
    next(error);
  }
};

export const updateStatistic = async (req, res, next) => {
  try {
    const data = await aboutUsService.updateStatistic(req.params.id, req.body);
    return successResponse(res, 200, 'Statistic updated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const deleteStatistic = async (req, res, next) => {
  try {
    await aboutUsService.deleteStatistic(req.params.id);
    return successResponse(res, 200, 'Statistic deleted successfully');
  } catch (error) {
    next(error);
  }
};

export default {
  getAboutUs,
  updateAboutUs,
  uploadHomepageImage,
  uploadHeroImage,
  uploadStoryImage,
  uploadOwnerPhoto,
  getOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  reorderOffers,
  getStatistics,
  createStatistic,
  updateStatistic,
  deleteStatistic,
};
