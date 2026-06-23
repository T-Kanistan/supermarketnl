import testimonialService from './testimonialService';

/** @deprecated Use testimonialService instead */
export const feedbackService = {
  getTestimonials: testimonialService.getAllTestimonials,
  createTestimonial: testimonialService.createTestimonial,
  updateTestimonial: testimonialService.updateTestimonial,
  deleteTestimonial: testimonialService.deleteTestimonial,
};

export default feedbackService;
