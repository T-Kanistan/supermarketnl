import ContactMessage from '../models/ContactMessage.js';
import { sanitizeContactMessage } from '../utils/sanitize.js';

const formatMessage = (message) => ({
  id: message._id,
  name: message.name,
  email: message.email,
  phone: message.phone,
  subject: message.subject,
  message: message.message,
  isRead: message.isRead,
  date: message.createdAt,
});

/**
 * @desc    Get all contact messages
 * @route   GET /api/cms/messages | GET /api/enquiries
 * @access  Private (Admin / Manager)
 */
export const getMessages = async (req, res, next) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages.map(formatMessage),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit a contact message / enquiry
 * @route   POST /api/cms/messages | POST /api/enquiries
 * @access  Public
 */
export const submitMessage = async (req, res, next) => {
  try {
    const sanitized = sanitizeContactMessage(req.body);

    const contactMessage = await ContactMessage.create({
      name: sanitized.name,
      email: sanitized.email,
      phone: sanitized.phone || '',
      subject: sanitized.subject,
      message: sanitized.message,
      isRead: false,
    });

    res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully',
      data: formatMessage(contactMessage),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark message as read or unread
 * @route   PUT /api/cms/messages/:id/read | PUT /api/enquiries/:id/read
 * @access  Private (Admin / Manager)
 */
export const markMessageRead = async (req, res, next) => {
  try {
    const contactMessage = await ContactMessage.findById(req.params.id);

    if (!contactMessage) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    contactMessage.isRead = req.body.isRead;
    await contactMessage.save();

    res.status(200).json({
      success: true,
      message: contactMessage.isRead ? 'Message marked as read' : 'Message marked as unread',
      data: formatMessage(contactMessage),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a contact message
 * @route   DELETE /api/cms/messages/:id | DELETE /api/enquiries/:id
 * @access  Private (Admin / Manager)
 */
export const deleteMessage = async (req, res, next) => {
  try {
    const contactMessage = await ContactMessage.findByIdAndDelete(req.params.id);

    if (!contactMessage) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
