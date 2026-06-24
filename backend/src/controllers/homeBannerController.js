import * as homeBannerService from '../services/homeBannerService.js';
import { persistUploadedFile } from '../services/uploadService.js';

const handleServiceError = (error, res, next) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  return next(error);
};

export const getStorefrontHomeBanner = async (req, res, next) => {
  try {
    const data = await homeBannerService.getStorefrontHomeBanner();
    return res.status(200).json({
      success: true,
      data: data || null,
      message: data ? undefined : 'No active homepage banner found',
    });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const getActiveHomeBanner = async (req, res, next) => {
  try {
    const data = await homeBannerService.getActiveHomeBanner();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const getHomeBanners = async (req, res, next) => {
  try {
    const data = await homeBannerService.listHomeBanners();
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    return next(error);
  }
};

export const getHomeBannerById = async (req, res, next) => {
  try {
    const data = await homeBannerService.getHomeBannerById(req.params.id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const getHomeBannerPreview = async (req, res, next) => {
  try {
    const data = await homeBannerService.getHomeBannerPreview(req.params.id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const createHomeBanner = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (req.file) {
      body.backgroundImage = await persistUploadedFile(req.file);
    }

    const data = await homeBannerService.createHomeBanner(body, req.user);
    return res.status(201).json({
      success: true,
      message: 'Homepage banner created successfully',
      data,
    });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const updateHomeBanner = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (req.file) {
      body.backgroundImage = await persistUploadedFile(req.file);
    }

    const data = await homeBannerService.updateHomeBanner(req.params.id, body, req.user);
    return res.status(200).json({
      success: true,
      message: 'Homepage banner updated successfully',
      data,
    });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const deleteHomeBanner = async (req, res, next) => {
  try {
    await homeBannerService.softDeleteHomeBanner(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Homepage banner deleted successfully',
    });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const uploadHomeBannerImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Banner image file is required',
      });
    }

    return res.status(200).json({
      success: true,
      imageUrl: await persistUploadedFile(req.file),
    });
  } catch (error) {
    return next(error);
  }
};

// Legacy /api/banners compatibility
export const getBanners = async (req, res, next) => {
  try {
    const data = await homeBannerService.getStorefrontHomeBanner();
    return res.status(200).json({
      success: true,
      count: data ? 1 : 0,
      data: data ? [data] : [],
    });
  } catch (error) {
    return next(error);
  }
};

export const getAllBanners = getHomeBanners;
export const getBannerById = getHomeBannerById;
export const createBanner = createHomeBanner;
export const updateBanner = updateHomeBanner;
export const deleteBanner = deleteHomeBanner;
