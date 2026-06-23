import {
  createJobEnquiry,
  listJobEnquiries,
  getJobEnquiryById,
  markJobEnquiryReplied,
  deleteJobEnquiry,
} from '../services/jobEnquiryService.js';

export const submitJobEnquiry = async (req, res, next) => {
  try {
    const enquiry = await createJobEnquiry({
      vacancyId: req.body.vacancyId,
      vacancyTitle: req.body.vacancyTitle,
      fullName: req.body.fullName,
      email: req.body.email,
      phone: req.body.phone || req.body.phoneNumber,
      message: req.body.message,
    });

    res.status(201).json({
      success: true,
      message: 'Enquiry Submitted Successfully. Our team will contact you soon.',
      data: enquiry,
    });
  } catch (error) {
    next(error);
  }
};

export const getJobEnquiries = async (req, res, next) => {
  try {
    const data = await listJobEnquiries({
      status: req.query.status,
      search: req.query.search,
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getJobEnquiry = async (req, res, next) => {
  try {
    const enquiry = await getJobEnquiryById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }
    res.json({ success: true, data: enquiry });
  } catch (error) {
    next(error);
  }
};

export const markEnquiryReplied = async (req, res, next) => {
  try {
    const enquiry = await markJobEnquiryReplied(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }
    res.json({
      success: true,
      message: 'Enquiry marked as replied',
      data: enquiry,
    });
  } catch (error) {
    next(error);
  }
};

export const removeJobEnquiry = async (req, res, next) => {
  try {
    const enquiry = await deleteJobEnquiry(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }
    res.json({ success: true, message: 'Enquiry deleted', data: enquiry });
  } catch (error) {
    next(error);
  }
};
