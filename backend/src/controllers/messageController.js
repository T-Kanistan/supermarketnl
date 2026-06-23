import {
  getMessages,
  submitMessage,
  markMessageRead,
  deleteMessage,
} from '../controllers/enquiryController.js';

const formatMessage = (enquiry) => ({
  id: enquiry.id,
  name: enquiry.senderName || enquiry.name,
  email: enquiry.email,
  phone: enquiry.phone,
  subject: enquiry.subject,
  message: enquiry.message,
  isRead: enquiry.isRead,
  status: enquiry.status,
  enquiryType: enquiry.enquiryType,
  date: enquiry.createdAt || enquiry.date,
});

export { getMessages, submitMessage, markMessageRead, deleteMessage, formatMessage };
