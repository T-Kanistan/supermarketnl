import footerService from '../services/footerService.js';
import { successResponse } from '../utils/apiResponse.js';

export const getSettings = async (req, res, next) => {
  try {
    const includeAll = req.query.full === 'true';
    if (includeAll) {
      const data = await footerService.getFooterFull(false);
      return successResponse(res, 200, 'Footer data retrieved successfully', data);
    }
    const data = await footerService.getFooterFull(true);
    return successResponse(res, 200, 'Footer data retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const data = await footerService.updateFooterSettings(req.body);
    return successResponse(res, 200, 'Footer settings updated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const uploadLogo = async (req, res, next) => {
  try {
    const data = await footerService.uploadFooterLogo(req.file);
    return successResponse(res, 200, 'Footer logo uploaded successfully', data);
  } catch (error) {
    next(error);
  }
};

export const deleteLogo = async (req, res, next) => {
  try {
    const data = await footerService.deleteFooterLogo();
    return successResponse(res, 200, 'Footer logo deleted successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getQuickLinks = async (req, res, next) => {
  try {
    const visibleOnly = req.query.all !== 'true';
    const data = await footerService.listQuickLinks(visibleOnly);
    return successResponse(res, 200, 'Quick links retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const createQuickLink = async (req, res, next) => {
  try {
    const data = await footerService.createQuickLink(req.body);
    return successResponse(res, 201, 'Quick link created successfully', data);
  } catch (error) {
    next(error);
  }
};

export const updateQuickLink = async (req, res, next) => {
  try {
    const data = await footerService.updateQuickLink(req.params.id, req.body);
    return successResponse(res, 200, 'Quick link updated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const deleteQuickLink = async (req, res, next) => {
  try {
    await footerService.deleteQuickLink(req.params.id);
    return successResponse(res, 200, 'Quick link deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getCategoryLinks = async (req, res, next) => {
  try {
    const visibleOnly = req.query.all !== 'true';
    const data = await footerService.listCategoryLinks(visibleOnly);
    return successResponse(res, 200, 'Category links retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const createCategoryLink = async (req, res, next) => {
  try {
    const data = await footerService.createCategoryLink(req.body);
    return successResponse(res, 201, 'Category link created successfully', data);
  } catch (error) {
    next(error);
  }
};

export const updateCategoryLink = async (req, res, next) => {
  try {
    const data = await footerService.updateCategoryLink(req.params.id, req.body);
    return successResponse(res, 200, 'Category link updated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const deleteCategoryLink = async (req, res, next) => {
  try {
    await footerService.deleteCategoryLink(req.params.id);
    return successResponse(res, 200, 'Category link deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getLegalLinks = async (req, res, next) => {
  try {
    const visibleOnly = req.query.all !== 'true';
    const data = await footerService.listLegalLinks(visibleOnly);
    return successResponse(res, 200, 'Legal links retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const createLegalLink = async (req, res, next) => {
  try {
    const data = await footerService.createLegalLink(req.body);
    return successResponse(res, 201, 'Legal link created successfully', data);
  } catch (error) {
    next(error);
  }
};

export const updateLegalLink = async (req, res, next) => {
  try {
    const data = await footerService.updateLegalLink(req.params.id, req.body);
    return successResponse(res, 200, 'Legal link updated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const deleteLegalLink = async (req, res, next) => {
  try {
    await footerService.deleteLegalLink(req.params.id);
    return successResponse(res, 200, 'Legal link deleted successfully');
  } catch (error) {
    next(error);
  }
};

export default {
  getSettings,
  updateSettings,
  uploadLogo,
  deleteLogo,
  getQuickLinks,
  createQuickLink,
  updateQuickLink,
  deleteQuickLink,
  getCategoryLinks,
  createCategoryLink,
  updateCategoryLink,
  deleteCategoryLink,
  getLegalLinks,
  createLegalLink,
  updateLegalLink,
  deleteLegalLink,
};
