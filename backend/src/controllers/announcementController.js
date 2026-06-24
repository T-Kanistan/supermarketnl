import * as announcementService from '../services/announcementService.js';
import { persistUploadedFile } from '../services/uploadService.js';

export const getStorefrontAnnouncements = async (req, res, next) => {
  try {
    const data = await announcementService.getStorefrontAnnouncements();
    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getAnnouncements = async (req, res, next) => {
  try {
    const result = await announcementService.listAnnouncements(req.query);
    return res.status(200).json({
      success: true,
      count: result.data.length,
      pagination: result.pagination,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicAnnouncements = async (req, res, next) => {
  try {
    const data = await announcementService.getPublicAnnouncements();
    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllAnnouncements = getAnnouncements;

export const searchAnnouncements = async (req, res, next) => {
  try {
    const result = await announcementService.searchAnnouncements(
      req.query.q || req.query.search
    );
    return res.status(200).json({
      success: true,
      count: result.data.length,
      pagination: result.pagination,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

export const getAnnouncementById = async (req, res, next) => {
  try {
    const data = await announcementService.getAnnouncementById(req.params.id);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const createAnnouncement = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (req.file) {
      body.bannerImage = await persistUploadedFile(req.file);
    }

    const data = await announcementService.createAnnouncement(body, req.user);
    return res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const updateAnnouncement = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (req.file) {
      body.bannerImage = await persistUploadedFile(req.file);
    }

    const data = await announcementService.updateAnnouncement(req.params.id, body, req.user);
    return res.status(200).json({
      success: true,
      message: 'Announcement updated successfully',
      data,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const deleteAnnouncement = async (req, res, next) => {
  try {
    await announcementService.softDeleteAnnouncement(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully',
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const uploadAnnouncementBanner = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Banner image file is required',
      });
    }

    return res.status(200).json({
      success: true,
      imageUrl: await persistUploadedFile(req.file),
    });
  } catch (error) {
    next(error);
  }
};
