import * as homepageAboutService from '../services/homepageAboutService.js';
import { getHomepageAboutPublicPath } from '../middlewares/homepageAboutUploadMiddleware.js';
import { successResponse } from '../utils/apiResponse.js';

const handleServiceError = (error, res, next) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.errors || null,
    });
  }
  return next(error);
};

export const getStorefrontHomepageAbout = async (req, res, next) => {
  try {
    const data = await homepageAboutService.getStorefrontHomepageAbout();
    if (!data) {
      return res.status(404).json({ success: false, message: 'No active homepage about section found' });
    }
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const getActiveHomepageAbout = async (req, res, next) => {
  try {
    const data = await homepageAboutService.getActiveHomepageAbout();
    return successResponse(res, 200, 'Active homepage about section retrieved', data);
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const getHomepageAboutSections = async (req, res, next) => {
  try {
    const data = await homepageAboutService.listHomepageAboutSections();
    return successResponse(res, 200, 'Homepage about sections retrieved', data);
  } catch (error) {
    return next(error);
  }
};

export const getHomepageAboutById = async (req, res, next) => {
  try {
    const data = await homepageAboutService.getHomepageAboutById(req.params.id);
    return successResponse(res, 200, 'Homepage about section retrieved', data);
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const getHomepageAboutPreview = async (req, res, next) => {
  try {
    const data = await homepageAboutService.getHomepageAboutPreview(req.params.id);
    return successResponse(res, 200, 'Homepage about preview retrieved', data);
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const createHomepageAbout = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (req.file) {
      body.aboutImage = getHomepageAboutPublicPath(req.file.filename);
    }

    const data = await homepageAboutService.createHomepageAbout(body, req.user);
    return successResponse(res, 201, 'Homepage About section created successfully', data);
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const updateHomepageAbout = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (req.file) {
      body.aboutImage = getHomepageAboutPublicPath(req.file.filename);
    }

    const data = await homepageAboutService.updateHomepageAbout(req.params.id, body, req.user);
    return successResponse(res, 200, 'Homepage About section updated successfully', data);
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const updateHomepageAboutLegacy = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (req.file) {
      body.aboutImage = getHomepageAboutPublicPath(req.file.filename);
    }

    const data = await homepageAboutService.updateActiveHomepageAbout(body, req.user);
    return successResponse(res, 200, 'Homepage About section updated successfully', data);
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const deleteHomepageAbout = async (req, res, next) => {
  try {
    await homepageAboutService.softDeleteHomepageAbout(req.params.id, req.user);
    return successResponse(res, 200, 'Homepage About section deleted successfully');
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const uploadHomepageAboutImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image file is required' });
    }

    return res.status(200).json({
      success: true,
      imageUrl: getHomepageAboutPublicPath(req.file.filename),
    });
  } catch (error) {
    return next(error);
  }
};

// Legacy public endpoint
export const getHomepageAbout = async (req, res, next) => {
  try {
    const data = await homepageAboutService.getStorefrontHomepageAbout();
    if (!data) {
      return successResponse(res, 200, 'Homepage about section retrieved', { status: 'inactive' });
    }
    return successResponse(res, 200, 'Homepage about section retrieved', {
      status: 'active',
      ...data,
    });
  } catch (error) {
    return next(error);
  }
};

export const getAdminHomepageAbout = async (req, res, next) => {
  try {
    await homepageAboutService.ensureDefaultSection();

    let data;
    try {
      data = await homepageAboutService.getActiveHomepageAbout();
    } catch {
      const list = await homepageAboutService.listHomepageAboutSections();
      data = list[0] || null;
    }

    if (!data) {
      const { getDefaultHomepageAbout } = await import('../models/HomepageAboutSection.js');
      data = await homepageAboutService.createHomepageAbout(getDefaultHomepageAbout(), req.user);
    }

    return successResponse(res, 200, 'Homepage about section retrieved', data);
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};
