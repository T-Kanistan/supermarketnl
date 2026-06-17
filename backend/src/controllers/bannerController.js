import Banner from '../models/Banner.js';
import { handleImageUpload } from '../middlewares/uploadMiddleware.js';

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
    const { title, highlightText, subtitle, buttonText, buttonLink, status, sortOrder } = req.body;

    let imageUrl = '';
    if (req.file) {
      imageUrl = await handleImageUpload(req.file);
    } else if (req.body.image) {
      imageUrl = req.body.image;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Banner image is required',
      });
    }

    const banner = await Banner.create({
      title,
      highlightText,
      subtitle,
      image: imageUrl,
      buttonText,
      buttonLink,
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
    const { title, highlightText, subtitle, buttonText, buttonLink, status, sortOrder } = req.body;
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found',
      });
    }

    if (title !== undefined) banner.title = title;
    if (highlightText !== undefined) banner.highlightText = highlightText;
    if (subtitle !== undefined) banner.subtitle = subtitle;
    if (buttonText !== undefined) banner.buttonText = buttonText;
    if (buttonLink !== undefined) banner.buttonLink = buttonLink;
    if (status !== undefined) banner.status = status;
    if (sortOrder !== undefined) banner.sortOrder = sortOrder;

    if (req.file) {
      const imageUrl = await handleImageUpload(req.file);
      if (imageUrl) {
        banner.image = imageUrl;
      }
    } else if (req.body.image !== undefined) {
      banner.image = req.body.image;
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
