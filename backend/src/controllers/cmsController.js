import HomeCMS, { getDefaultHomeCMS } from '../models/HomeCMS.js';
import { handleImageUpload, handleBase64Upload } from '../middlewares/uploadMiddleware.js';

const uploadIfBase64 = async (value) => {
  if (!value || typeof value !== 'string' || !value.startsWith('data:image')) return value;
  return (await handleBase64Upload(value)) || value;
};

/**
 * @desc    Get Home CMS Settings (Singleton)
 * @route   GET /api/cms/settings
 * @access  Public
 */
export const getCMS = async (req, res, next) => {
  try {
    let home = await HomeCMS.findOne();
    if (!home) {
      home = await HomeCMS.create(getDefaultHomeCMS());
    }
    res.status(200).json({
      success: true,
      data: home,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Home CMS Settings
 * @route   PUT /api/cms/settings
 * @access  Private (Admin / Manager)
 */
export const updateCMS = async (req, res, next) => {
  try {
    let home = await HomeCMS.findOne();
    if (!home) {
      home = new HomeCMS(getDefaultHomeCMS());
    }

    const fieldsToUpdate = ['storeName', 'supermarketTimings', 'foodCornerTimings'];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        home[field] = req.body[field];
      }
    });

    if (req.file) {
      const logoUrl = await handleImageUpload(req.file);
      if (logoUrl) home.logo = logoUrl;
    } else if (req.body.logo !== undefined) {
      home.logo = await uploadIfBase64(req.body.logo);
    }

    if (req.body.featuresSection !== undefined) {
      let featuresSection = req.body.featuresSection;
      if (typeof featuresSection === 'string') {
        try {
          featuresSection = JSON.parse(featuresSection);
        } catch {
          return res.status(400).json({ success: false, message: 'Invalid featuresSection JSON payload' });
        }
      }
      home.featuresSection = featuresSection;
      home.markModified('featuresSection');
    }

    if (req.body.aboutSection !== undefined) {
      let aboutSection = req.body.aboutSection;
      if (typeof aboutSection === 'string') {
        try {
          aboutSection = JSON.parse(aboutSection);
        } catch {
          return res.status(400).json({ success: false, message: 'Invalid aboutSection JSON payload' });
        }
      }
      if (aboutSection.image?.startsWith?.('data:image')) {
        aboutSection.image = await uploadIfBase64(aboutSection.image);
      }
      home.aboutSection = aboutSection;
      home.markModified('aboutSection');
    }

    if (req.body.foodCornerPromo !== undefined) {
      let foodCornerPromo = req.body.foodCornerPromo;
      if (typeof foodCornerPromo === 'string') {
        try {
          foodCornerPromo = JSON.parse(foodCornerPromo);
        } catch {
          return res.status(400).json({ success: false, message: 'Invalid foodCornerPromo JSON payload' });
        }
      }
      if (foodCornerPromo.image?.startsWith?.('data:image')) {
        foodCornerPromo.image = await uploadIfBase64(foodCornerPromo.image);
      }
      home.foodCornerPromo = foodCornerPromo;
      home.markModified('foodCornerPromo');
    }

    home.updatedBy = req.user._id;
    await home.save();

    res.status(200).json({
      success: true,
      message: 'Home CMS settings updated successfully',
      data: home,
    });
  } catch (error) {
    next(error);
  }
};
