import Testimonial from '../models/Testimonial.js';
import { handleImageUpload, handleBase64Upload } from '../middlewares/uploadMiddleware.js';

/**
 * @desc    Get Active Testimonials (Public)
 * @route   GET /api/testimonials
 * @access  Public
 */
export const getTestimonials = async (req, res, next) => {
  try {
    const testimonials = await Testimonial.find({ status: 'active' }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: testimonials.length,
      data: testimonials,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get All Testimonials (Admin/Manager)
 * @route   GET /api/testimonials/all
 * @access  Private (Admin / Manager)
 */
export const getAllTestimonials = async (req, res, next) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: testimonials.length,
      data: testimonials,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Single Testimonial By ID
 * @route   GET /api/testimonials/:id
 * @access  Private (Admin / Manager)
 */
export const getTestimonialById = async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found',
      });
    }
    res.status(200).json({
      success: true,
      data: testimonial,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create Testimonial
 * @route   POST /api/testimonials
 * @access  Private (Admin / Manager)
 */
export const createTestimonial = async (req, res, next) => {
  try {
    const { customerName, rating, review, status } = req.body;

    let imageUrl = '';
    if (req.file) {
      imageUrl = await handleImageUpload(req.file);
    } else if (req.body.image) {
      imageUrl = await handleBase64Upload(req.body.image);
    }

    const testimonial = await Testimonial.create({
      customerName,
      image: imageUrl,
      rating,
      review,
      status,
    });

    res.status(201).json({
      success: true,
      message: 'Testimonial created successfully',
      data: testimonial,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Testimonial
 * @route   PUT /api/testimonials/:id
 * @access  Private (Admin / Manager)
 */
export const updateTestimonial = async (req, res, next) => {
  try {
    const { customerName, rating, review, status } = req.body;
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found',
      });
    }

    if (customerName !== undefined) testimonial.customerName = customerName;
    if (rating !== undefined) testimonial.rating = rating;
    if (review !== undefined) testimonial.review = review;
    if (status !== undefined) testimonial.status = status;

    if (req.file) {
      const imageUrl = await handleImageUpload(req.file);
      if (imageUrl) {
        testimonial.image = imageUrl;
      }
    } else if (req.body.image !== undefined) {
      testimonial.image = await handleBase64Upload(req.body.image);
    }

    await testimonial.save();

    res.status(200).json({
      success: true,
      message: 'Testimonial updated successfully',
      data: testimonial,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete Testimonial
 * @route   DELETE /api/testimonials/:id
 * @access  Private (Admin / Manager)
 */
export const deleteTestimonial = async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Testimonial deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
