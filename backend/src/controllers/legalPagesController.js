import legalPagesService from '../services/legalPagesService.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * @desc    Get legal pages content (Terms & Privacy) - singleton
 * @route   GET /api/legal-pages
 * @access  Public
 */
export const getLegalPages = async (req, res, next) => {
  try {
    const data = await legalPagesService.getLegalPages();
    return successResponse(res, 200, 'Legal pages retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update legal pages content (Terms & Privacy)
 * @route   PUT /api/legal-pages
 * @access  Private (Admin)
 */
export const updateLegalPages = async (req, res, next) => {
  try {
    const data = await legalPagesService.updateLegalPages(req.body);
    return successResponse(res, 200, 'Legal pages updated successfully', data);
  } catch (error) {
    next(error);
  }
};

export default {
  getLegalPages,
  updateLegalPages,
};
