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

    const payload = {
      storeName: req.body.storeName,
      storeLogo: req.body.storeLogo ?? req.body.logo,
      physicalAddress: req.body.physicalAddress ?? req.body.address,
      supermarketOpeningHours: req.body.supermarketOpeningHours ?? req.body.supermarketTimings,
      foodCornerOpeningHours: req.body.foodCornerOpeningHours ?? req.body.foodCornerTimings,
    };

    const settings = await siteSettingsService.updateSiteSettings(payload, req.file, req.user);
    return successResponse(res, 200, 'Settings updated successfully', settings);
  } catch (error) {
    next(error);
  }
};

export default {
  getSettings,
  updateSettings,
};
