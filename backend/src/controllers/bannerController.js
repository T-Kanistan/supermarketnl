import Banner from '../models/Banner.js';
import { handleImageUpload, handleBase64Upload } from '../middlewares/uploadMiddleware.js';

/**
 * @desc    Get Active Banners (Public)
 * @route   GET /api/banners
 * @access  Public
 */
export const getBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find({ status: 'active' }).sort({ sortOrder: 1 });
    res.status(200).json({
      success: true,
      count: banners.length,
      data: banners,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get All Banners (Admin/Manager)
 * @route   GET /api/banners/all
 * @access  Private (Admin / Manager)
 */
export const getAllBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find().sort({ sortOrder: 1 });
    res.status(200).json({
      success: true,
      count: banners.length,
      data: banners,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Single Banner By ID
 * @route   GET /api/banners/:id
 * @access  Private (Admin / Manager)
 */
export const getBannerById = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found',
      });
    }
    res.status(200).json({
      success: true,
      data: banner,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create Banner
 * @route   POST /api/banners
 * @access  Private (Admin / Manager)
 */
export const createBanner = async (req, res, next) => {
  try {
    const {
      title,
      highlightText,
      titleLine2,
      subtitle,
      buttonText,
      buttonLink,
      buttonText2,
      buttonLink2,
      showOpenTime,
      openTimeTitle,
      supermarketLabel,
      supermarketTimings,
      foodCornerLabel,
      foodCornerTimings,
      status,
      sortOrder,
    } = req.body;

    let imageUrl = '';
    if (req.file) {
      imageUrl = await handleImageUpload(req.file);
    } else if (req.body.image) {
      imageUrl = await handleBase64Upload(req.body.image);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Banner image is required',
      });
    }

    const banner = await Banner.create({
      title,
      highlightText,
      titleLine2,
      subtitle,
      image: imageUrl,
      buttonText,
      buttonLink,
      buttonText2,
      buttonLink2,
      showOpenTime: showOpenTime !== false && showOpenTime !== 'false',
      openTimeTitle,
      supermarketLabel,
      supermarketTimings,
      foodCornerLabel,
      foodCornerTimings,
      status,
      sortOrder,
    });

    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: banner,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Banner
 * @route   PUT /api/banners/:id
 * @access  Private (Admin / Manager)
 */
export const updateBanner = async (req, res, next) => {
  try {
    const {
      title,
      highlightText,
      titleLine2,
      subtitle,
      buttonText,
      buttonLink,
      buttonText2,
      buttonLink2,
      showOpenTime,
      openTimeTitle,
      supermarketLabel,
      supermarketTimings,
      foodCornerLabel,
      foodCornerTimings,
      status,
      sortOrder,
    } = req.body;
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found',
      });
    }

    if (title !== undefined) banner.title = title;
    if (highlightText !== undefined) banner.highlightText = highlightText;
    if (titleLine2 !== undefined) banner.titleLine2 = titleLine2;
    if (subtitle !== undefined) banner.subtitle = subtitle;
    if (buttonText !== undefined) banner.buttonText = buttonText;
    if (buttonLink !== undefined) banner.buttonLink = buttonLink;
    if (buttonText2 !== undefined) banner.buttonText2 = buttonText2;
    if (buttonLink2 !== undefined) banner.buttonLink2 = buttonLink2;
    if (showOpenTime !== undefined) {
      banner.showOpenTime = showOpenTime !== false && showOpenTime !== 'false';
    }
    if (openTimeTitle !== undefined) banner.openTimeTitle = openTimeTitle;
    if (supermarketLabel !== undefined) banner.supermarketLabel = supermarketLabel;
    if (supermarketTimings !== undefined) banner.supermarketTimings = supermarketTimings;
    if (foodCornerLabel !== undefined) banner.foodCornerLabel = foodCornerLabel;
    if (foodCornerTimings !== undefined) banner.foodCornerTimings = foodCornerTimings;
    if (status !== undefined) banner.status = status;
    if (sortOrder !== undefined) banner.sortOrder = sortOrder;

    if (req.file) {
      const imageUrl = await handleImageUpload(req.file);
      if (imageUrl) {
        banner.image = imageUrl;
      }
    } else if (req.body.image !== undefined) {
      banner.image = await handleBase64Upload(req.body.image);
    }

    await banner.save();

    res.status(200).json({
      success: true,
      message: 'Banner updated successfully',
      data: banner,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete Banner
 * @route   DELETE /api/banners/:id
 * @access  Private (Admin / Manager)
 */
export const deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Banner deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
