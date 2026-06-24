import siteSettingsService from '../services/siteSettingsService.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * @desc    Get unified site settings (singleton)
 * @route   GET /api/settings
 * @access  Public
 */
export const getSettings = async (req, res, next) => {
  try {
    const settings = await siteSettingsService.getSiteSettings();
    return successResponse(res, 200, 'Site settings retrieved successfully', settings);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update unified site settings
 * @route   PUT /api/settings
 * @access  Private (Admin)
 */
export const updateSettings = async (req, res, next) => {
  try {
    console.log('Saving Settings:', req.body);
    const settings = await siteSettingsService.updateSiteSettings(req.body, req.file, req.user);
    return successResponse(res, 200, 'Settings updated successfully', settings);
  } catch (error) {
    next(error);
  }
};

export default {
  getSettings,
  updateSettings,
};
