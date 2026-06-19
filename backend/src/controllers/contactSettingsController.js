import contactSettingsService from '../services/contactSettingsService.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * @desc    Get contact page settings (singleton)
 * @route   GET /api/contact-settings
 * @access  Public
 */
export const getContactSettings = async (req, res, next) => {
  try {
    const data = await contactSettingsService.getContactSettings();
    return successResponse(res, 200, 'Contact settings retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update contact page settings
 * @route   PUT /api/contact-settings
 * @access  Private (Admin / Manager)
 */
export const updateContactSettings = async (req, res, next) => {
  try {
    const data = await contactSettingsService.updateContactSettings(req.body);
    return successResponse(res, 200, 'Contact settings updated successfully', data);
  } catch (error) {
    next(error);
  }
};

export default {
  getContactSettings,
  updateContactSettings,
};
