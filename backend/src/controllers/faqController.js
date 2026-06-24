import * as faqService from '../services/faqService.js';

const handleServiceError = (error, res, next) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  return next(error);
};

export const getStorefrontFaqs = async (req, res, next) => {
  try {
    const data = await faqService.getStorefrontFaqs();
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    return next(error);
  }
};

export const getFaqs = async (req, res, next) => {
  try {
    const [data, limitMeta] = await Promise.all([
      faqService.listFaqs(),
      faqService.getFaqLimitMeta(),
    ]);
    return res.status(200).json({
      success: true,
      count: data.length,
      maxFaqs: limitMeta.max,
      limitReached: limitMeta.limitReached,
      data,
    });
  } catch (error) {
    return next(error);
  }
};

export const getAllFaqs = getFaqs;

export const searchFaqs = async (req, res, next) => {
  try {
    const data = await faqService.searchFaqs(req.query.q || req.query.search);
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    return next(error);
  }
};

export const getFaqById = async (req, res, next) => {
  try {
    const data = await faqService.getFaqById(req.params.id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const createFaq = async (req, res, next) => {
  try {
    const data = await faqService.createFaq(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      data,
    });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const updateFaq = async (req, res, next) => {
  try {
    const data = await faqService.updateFaq(req.params.id, req.body, req.user);
    return res.status(200).json({
      success: true,
      message: 'FAQ updated successfully',
      data,
    });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const deleteFaq = async (req, res, next) => {
  try {
    await faqService.softDeleteFaq(req.params.id, req.user);
    return res.status(200).json({ success: true, message: 'FAQ deleted successfully' });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const moveFaqUp = async (req, res, next) => {
  try {
    const data = await faqService.moveFaqUp(req.params.id, req.user);
    return res.status(200).json({ success: true, message: 'FAQ moved up', data });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const moveFaqDown = async (req, res, next) => {
  try {
    const data = await faqService.moveFaqDown(req.params.id, req.user);
    return res.status(200).json({ success: true, message: 'FAQ moved down', data });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const saveFaqOrder = async (req, res, next) => {
  try {
    const { faqIds, orders } = req.body;
    const data = Array.isArray(orders) && orders.length
      ? await faqService.saveFaqOrderValues(orders, req.user)
      : await faqService.saveFaqOrder(faqIds || req.body, req.user);
    return res.status(200).json({
      success: true,
      message: 'FAQ order saved successfully',
      data,
    });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

// Legacy reorder endpoint
export const reorderFaqs = async (req, res, next) => {
  try {
    const orders = req.body;
    if (!Array.isArray(orders)) {
      return res.status(400).json({ success: false, message: 'Request body must be an array' });
    }
    const faqIds = orders
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((item) => item.id);
    const data = await faqService.saveFaqOrder(faqIds, req.user);
    return res.status(200).json({
      success: true,
      message: 'FAQs reordered successfully',
      data,
    });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const getPublicFaqs = async (req, res, next) => {
  try {
    const data = await faqService.getStorefrontFaqs();
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    return next(error);
  }
};
