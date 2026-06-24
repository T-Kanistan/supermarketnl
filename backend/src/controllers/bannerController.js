import * as pageBannerService from '../services/pageBannerService.js';
import { persistUploadedFile } from '../services/uploadService.js';

const handleServiceError = (error, res, next) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  return next(error);
};

export const listBanners = async (req, res, next) => {
  try {
    const { pageType, pageName, q, page, limit, includeInactive } = req.query;
    const result = await pageBannerService.listBanners({
      pageType: pageType || pageName,
      q,
      page,
      limit,
      includeInactive: includeInactive !== 'false',
    });
    return res.status(200).json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
};

export const getBannerByPage = async (req, res, next) => {
  try {
    const data = await pageBannerService.getActiveBannerByPage(req.params.pageType);
    return res.status(200).json({
      success: true,
      data: data || null,
      message: data ? undefined : 'No active banner found for this page',
    });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const getBannerById = async (req, res, next) => {
  try {
    const data = await pageBannerService.getBannerById(req.params.id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const createBanner = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (req.file) {
      body.backgroundImage = await persistUploadedFile(req.file);
    }
    const data = await pageBannerService.createBanner(body, req.user);
    return res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data,
    });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const updateBanner = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (req.file) {
      body.backgroundImage = await persistUploadedFile(req.file);
    }
    const data = await pageBannerService.updateBanner(req.params.id, body, req.user);
    return res.status(200).json({
      success: true,
      message: 'Banner updated successfully',
      data,
    });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const deleteBanner = async (req, res, next) => {
  try {
    await pageBannerService.softDeleteBanner(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Banner deleted successfully',
    });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const updateBannerStatus = async (req, res, next) => {
  try {
    const data = await pageBannerService.updateBannerStatus(
      req.params.id,
      req.body.isActive,
      req.user
    );
    return res.status(200).json({
      success: true,
      message: `Banner ${data.isActive ? 'activated' : 'deactivated'} successfully`,
      data,
    });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const uploadBannerImage = async (req, res, next) => {
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

// Legacy storefront home banner
export const getBanners = async (req, res, next) => {
  try {
    const data = await pageBannerService.getActiveBannerByPage('home');
    return res.status(200).json({
      success: true,
      count: data ? 1 : 0,
      data: data ? [data] : [],
    });
  } catch (error) {
    return next(error);
  }
};

export const getAllBanners = listBanners;
export const getStorefrontHomeBanner = async (req, res, next) => {
  try {
    const data = await pageBannerService.getActiveBannerByPage('home');
    return res.status(200).json({
      success: true,
      data: data || null,
    });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};
