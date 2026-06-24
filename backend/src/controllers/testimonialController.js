import * as testimonialService from '../services/testimonialService.js';
import { persistUploadedFile } from '../services/uploadService.js';

const handleServiceError = (error, res, next) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  return next(error);
};

export const getStorefrontTestimonials = async (req, res, next) => {
  try {
    const data = await testimonialService.getStorefrontTestimonials();
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    return next(error);
  }
};

export const getTestimonials = async (req, res, next) => {
  try {
    const data = await testimonialService.listTestimonials();
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    return next(error);
  }
};

export const getAllTestimonials = getTestimonials;

export const searchTestimonials = async (req, res, next) => {
  try {
    const data = await testimonialService.searchTestimonials(req.query.q || req.query.search);
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    return next(error);
  }
};

export const getTestimonialById = async (req, res, next) => {
  try {
    const data = await testimonialService.getTestimonialById(req.params.id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const createTestimonial = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (req.file) {
      body.avatarImage = await persistUploadedFile(req.file);
    }

    const data = await testimonialService.createTestimonial(body, req.user);
    return res.status(201).json({
      success: true,
      message: 'Testimonial created successfully',
      data,
    });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const updateTestimonial = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (req.file) {
      body.avatarImage = await persistUploadedFile(req.file);
    }

    const data = await testimonialService.updateTestimonial(req.params.id, body, req.user);
    return res.status(200).json({
      success: true,
      message: 'Testimonial updated successfully',
      data,
    });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const deleteTestimonial = async (req, res, next) => {
  try {
    await testimonialService.softDeleteTestimonial(req.params.id, req.user);
    return res.status(200).json({ success: true, message: 'Testimonial deleted successfully' });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const uploadTestimonialAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Avatar image file is required' });
    }

    return res.status(200).json({
      success: true,
      imageUrl: await persistUploadedFile(req.file),
    });
  } catch (error) {
    return next(error);
  }
};

// Legacy public endpoint
export const getPublicTestimonials = getStorefrontTestimonials;
