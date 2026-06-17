import Announcement from '../models/Announcement.js';
import { handleImageUpload } from '../middlewares/uploadMiddleware.js';

/**
 * @desc    Get Active Announcements (Public with date checking)
 * @route   GET /api/announcements
 * @access  Public
 */
export const getAnnouncements = async (req, res, next) => {
  try {
    const now = new Date();
    // Fetch active announcements that are either not scheduled or currently within range
    const announcements = await Announcement.find({
      status: 'active',
      $or: [
        { startDate: null, endDate: null },
        { startDate: { $lte: now }, endDate: { $gte: now } },
        { startDate: null, endDate: { $gte: now } },
        { startDate: { $lte: now }, endDate: null },
      ],
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get All Announcements (Admin/Manager)
 * @route   GET /api/announcements/all
 * @access  Private (Admin / Manager)
 */
export const getAllAnnouncements = async (req, res, next) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Single Announcement By ID
 * @route   GET /api/announcements/:id
 * @access  Private (Admin / Manager)
 */
export const getAnnouncementById = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }
    res.status(200).json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create Announcement
 * @route   POST /api/announcements
 * @access  Private (Admin / Manager)
 */
export const createAnnouncement = async (req, res, next) => {
  try {
    const { title, description, offerPercentage, startDate, endDate, status } = req.body;

    let imageUrl = '';
    if (req.file) {
      imageUrl = await handleImageUpload(req.file);
    } else if (req.body.image) {
      imageUrl = req.body.image;
    }

    const announcement = await Announcement.create({
      title,
      description,
      image: imageUrl,
      offerPercentage,
      startDate: startDate || null,
      endDate: endDate || null,
      status,
    });

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: announcement,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Announcement
 * @route   PUT /api/announcements/:id
 * @access  Private (Admin / Manager)
 */
export const updateAnnouncement = async (req, res, next) => {
  try {
    const { title, description, offerPercentage, startDate, endDate, status } = req.body;
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    if (title !== undefined) announcement.title = title;
    if (description !== undefined) announcement.description = description;
    if (offerPercentage !== undefined) announcement.offerPercentage = offerPercentage;
    if (startDate !== undefined) announcement.startDate = startDate || null;
    if (endDate !== undefined) announcement.endDate = endDate || null;
    if (status !== undefined) announcement.status = status;

    if (req.file) {
      const imageUrl = await handleImageUpload(req.file);
      if (imageUrl) {
        announcement.image = imageUrl;
      }
    } else if (req.body.image !== undefined) {
      announcement.image = req.body.image;
    }

    await announcement.save();

    res.status(200).json({
      success: true,
      message: 'Announcement updated successfully',
      data: announcement,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete Announcement
 * @route   DELETE /api/announcements/:id
 * @access  Private (Admin / Manager)
 */
export const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
