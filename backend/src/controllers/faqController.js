import FAQ from '../models/FAQ.js';

/**
 * @desc    Get Active FAQs (Public)
 * @route   GET /api/faqs
 * @access  Public
 */
export const getFaqs = async (req, res, next) => {
  try {
    const faqs = await FAQ.find({ status: 'active' }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: faqs.length,
      data: faqs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get All FAQs (Admin/Manager)
 * @route   GET /api/faqs/all
 * @access  Private (Admin / Manager)
 */
export const getAllFaqs = async (req, res, next) => {
  try {
    const faqs = await FAQ.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: faqs.length,
      data: faqs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Single FAQ By ID
 * @route   GET /api/faqs/:id
 * @access  Private (Admin / Manager)
 */
export const getFaqById = async (req, res, next) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found',
      });
    }
    res.status(200).json({
      success: true,
      data: faq,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create FAQ
 * @route   POST /api/faqs
 * @access  Private (Admin / Manager)
 */
export const createFaq = async (req, res, next) => {
  try {
    const { question, answer, status } = req.body;

    const faq = await FAQ.create({
      question,
      answer,
      status,
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

/**
 * @desc    Update FAQ
 * @route   PUT /api/faqs/:id
 * @access  Private (Admin / Manager)
 */
export const updateFaq = async (req, res, next) => {
  try {
    const { question, answer, status } = req.body;
    const faq = await FAQ.findById(req.params.id);

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found',
      });
    }

    if (question !== undefined) faq.question = question;
    if (answer !== undefined) faq.answer = answer;
    if (status !== undefined) faq.status = status;

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

/**
 * @desc    Delete FAQ
 * @route   DELETE /api/faqs/:id
 * @access  Private (Admin / Manager)
 */
export const deleteFaq = async (req, res, next) => {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id);

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'FAQ deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
