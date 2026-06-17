import CMS from '../models/CMS.js';
import { handleImageUpload } from '../middlewares/uploadMiddleware.js';

/**
 * @desc    Get Central CMS Settings (Singleton)
 * @route   GET /api/cms
 * @access  Public
 */
export const getCMS = async (req, res, next) => {
  try {
    let cms = await CMS.findOne();
    if (!cms) {
      cms = await CMS.create({});
    }
    res.status(200).json({
      success: true,
      data: cms,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update CMS Settings
 * @route   PUT /api/cms
 * @access  Private (Admin / Manager)
 */
export const updateCMS = async (req, res, next) => {
  try {
    let cms = await CMS.findOne();
    if (!cms) {
      cms = new CMS();
    }

    const fieldsToUpdate = [
      'storeName',
      'contactEmail',
      'contactPhone',
      'address',
      'aboutUs',
      'footerDescription',
      'facebook',
      'instagram',
      'whatsapp',
      'youtube',
      'tiktok',
    ];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        cms[field] = req.body[field];
      }
    });

    // Handle logo image upload if present
    if (req.file) {
      const logoUrl = await handleImageUpload(req.file);
      if (logoUrl) {
        cms.logo = logoUrl;
      }
    } else if (req.body.logo !== undefined) {
      // Allow manually setting the string path if needed
      cms.logo = req.body.logo;
    }

    cms.updatedBy = req.user._id;
    await cms.save();

    res.status(200).json({
      success: true,
      message: 'CMS settings updated successfully',
      data: cms,
    });
  } catch (error) {
    next(error);
  }
};
