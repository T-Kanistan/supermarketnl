import homepageAboutService from '../services/homepageAboutService.js';
import { successResponse } from '../utils/apiResponse.js';

export const getHomepageAbout = async (req, res, next) => {
  try {
    const data = await homepageAboutService.getPublicHomepageAbout();
    return successResponse(res, 200, 'Homepage about section retrieved', data);
  } catch (error) {
    return next(error);
  }
};

export const getAdminHomepageAbout = async (req, res, next) => {
  try {
    const data = await homepageAboutService.getAdminHomepageAbout();
    return successResponse(res, 200, 'Homepage about section retrieved', data);
  } catch (error) {
    return next(error);
  }
};

export const updateHomepageAbout = async (req, res, next) => {
  try {
    const data = await homepageAboutService.updateHomepageAbout(req.body);
    return successResponse(res, 200, 'Homepage About Section updated successfully', data);
  } catch (error) {
    return next(error);
  }
};

export const uploadHomepageAboutImage = async (req, res, next) => {
  try {
    if (!req.file) {
      const error = new Error('Image file is required');
      error.statusCode = 400;
      throw error;
    }

    const result = await homepageAboutService.uploadHomepageAboutImage(req.file);
    return successResponse(res, 200, 'Image uploaded successfully', result);
  } catch (error) {
    return next(error);
  }
};
