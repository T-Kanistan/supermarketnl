import FAQ from '../models/FAQ.js';
import {
  getFaqsInDisplayOrder,
  getNextFaqOrder,
  normalizeFaqOrdersByCreatedAt,
  normalizeFaqOrdersByLeadingNumber,
  renumberFaqsAfterDelete,
} from '../services/faqService.js';

export const getFaqs = async (req, res, next) => {
  try {
    const faqs = await getFaqsInDisplayOrder({ status: 'active' });
    res.status(200).json({
      success: true,
      count: faqs.length,
      data: faqs,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllFaqs = async (req, res, next) => {
  try {
    const faqs = await getFaqsInDisplayOrder();
    res.status(200).json({
      success: true,
      count: faqs.length,
      data: faqs,
    });
  } catch (error) {
    next(error);
  }
};

export const getFaqById = async (req, res, next) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }
    res.status(200).json({ success: true, data: faq });
  } catch (error) {
    next(error);
  }
};

export const createFaq = async (req, res, next) => {
  try {
    const { question, answer, status } = req.body;
    const order = await getNextFaqOrder();

    const faq = await FAQ.create({
      question,
      answer,
      status,
      order,
    });

    res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      data: faq,
    });
  } catch (error) {
    next(error);
  }
};

export const updateFaq = async (req, res, next) => {
  try {
    const { question, answer, status, order } = req.body;
    const faq = await FAQ.findById(req.params.id);

    if (!faq) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }

    if (question !== undefined) faq.question = question;
    if (answer !== undefined) faq.answer = answer;
    if (status !== undefined) faq.status = status;
    if (order !== undefined) faq.order = order;

    await faq.save();

    res.status(200).json({
      success: true,
      message: 'FAQ updated successfully',
      data: faq,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFaq = async (req, res, next) => {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id);
    if (!faq) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }

    await renumberFaqsAfterDelete();

    res.status(200).json({ success: true, message: 'FAQ deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const reorderFaqs = async (req, res, next) => {
  try {
    const orders = req.body;
    if (!Array.isArray(orders) || !orders.length) {
      return res.status(400).json({ success: false, message: 'Request body must be a non-empty array' });
    }

    for (const item of orders) {
      if (!item.id || !/^[a-f\d]{24}$/i.test(String(item.id))) {
        return res.status(400).json({ success: false, message: 'Each item requires a valid id' });
      }
      if (item.order === undefined || Number(item.order) < 1) {
        return res.status(400).json({ success: false, message: 'Each item requires a valid order (starting at 1)' });
      }
    }

    await Promise.all(
      orders.map(({ id, order }) => FAQ.findByIdAndUpdate(id, { order }, { new: true }))
    );

    const faqs = await getFaqsInDisplayOrder();
    res.status(200).json({
      success: true,
      message: 'FAQs reordered successfully',
      data: faqs,
    });
  } catch (error) {
    next(error);
  }
};

export const normalizeFaqs = async (req, res, next) => {
  try {
    const byNumber = await normalizeFaqOrdersByLeadingNumber();
    const faqs = byNumber || (await normalizeFaqOrdersByCreatedAt());
    res.status(200).json({
      success: true,
      message: byNumber
        ? 'FAQ order normalized by question number (1 first)'
        : 'FAQ order normalized by creation date (oldest first)',
      data: faqs,
    });
  } catch (error) {
    next(error);
  }
};
