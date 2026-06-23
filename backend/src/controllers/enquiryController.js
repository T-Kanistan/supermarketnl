import * as enquiryService from '../services/enquiryService.js';
import { getUnreadEnquiryNotificationCount } from '../services/notificationService.js';

const handleServiceError = (error, res, next) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  return next(error);
};

const mapLegacyBody = (body) => ({
  senderName: body.senderName || body.fullName || body.name,
  email: body.email,
  phone: body.phone || body.phoneNumber,
  subject: body.subject || body.enquiryType,
  message: body.message,
  productName: body.productName,
  quantityRequired: body.quantityRequired || body.quantity,
});

export const submitContactEnquiry = async (req, res, next) => {
  try {
    const data = await enquiryService.createEnquiry(mapLegacyBody(req.body), 'contact-us');
    return res.status(201).json({
      success: true,
      message: 'Your enquiry has been submitted successfully',
      data,
    });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const submitProductEnquiry = async (req, res, next) => {
  try {
    const data = await enquiryService.createEnquiry(mapLegacyBody(req.body), 'product-enquiry');
    return res.status(201).json({
      success: true,
      message: 'Your product enquiry has been submitted successfully',
      data,
    });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const submitFoodCornerEnquiry = async (req, res, next) => {
  try {
    const data = await enquiryService.createEnquiry(mapLegacyBody(req.body), 'food-corner-enquiry');
    return res.status(201).json({
      success: true,
      message: 'Your food corner enquiry has been submitted successfully',
      data,
    });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const getEnquiries = async (req, res, next) => {
  try {
    const result = await enquiryService.listEnquiries(req.query);
    return res.status(200).json({
      success: true,
      count: result.data.length,
      pagination: result.pagination,
      data: result.data,
    });
  } catch (error) {
    return next(error);
  }
};

export const getEnquiryById = async (req, res, next) => {
  try {
    const data = await enquiryService.getEnquiryById(req.params.id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const markEnquiryRead = async (req, res, next) => {
  try {
    const data = await enquiryService.markEnquiryRead(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Enquiry marked as read',
      data,
    });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const markEnquiryReplied = async (req, res, next) => {
  try {
    const data = await enquiryService.markEnquiryReplied(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Enquiry marked as replied',
      data,
    });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const closeEnquiry = async (req, res, next) => {
  try {
    const data = await enquiryService.closeEnquiry(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Enquiry closed successfully',
      data,
    });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const replyToEnquiry = async (req, res, next) => {
  try {
    const data = await enquiryService.replyToEnquiry(
      req.params.id,
      req.body.replyMessage,
      req.user
    );
    return res.status(200).json({
      success: true,
      message: 'Reply sent successfully',
      data,
    });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const deleteEnquiry = async (req, res, next) => {
  try {
    await enquiryService.softDeleteEnquiry(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Enquiry deleted successfully',
    });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const getEnquiryStats = async (req, res, next) => {
  try {
    const stats = await enquiryService.getEnquiryStats();
    const unreadNotifications = await getUnreadEnquiryNotificationCount();
    return res.status(200).json({
      success: true,
      data: {
        ...stats,
        unreadNotifications,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// CMS backward compatibility
export const getMessages = getEnquiries;
export const submitMessage = submitContactEnquiry;

export const markMessageRead = async (req, res, next) => {
  try {
    const enquiry = await enquiryService.getEnquiryById(req.params.id);
    if (req.body.isRead === false) {
      return res.status(200).json({
        success: true,
        message: 'Enquiry marked as unread',
        data: enquiry,
      });
    }
    const data = await enquiryService.markEnquiryRead(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Message marked as read',
      data,
    });
  } catch (error) {
    return handleServiceError(error, res, next);
  }
};

export const deleteMessage = deleteEnquiry;
