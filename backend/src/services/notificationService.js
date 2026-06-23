import Notification from '../models/Notification.js';

export const createEnquiryNotification = async (enquiry) => {
  try {
    await Notification.create({
      module: 'ENQUIRY',
      title: 'New Customer Enquiry',
      status: 'unread',
      enquiryId: enquiry._id,
      metadata: {
        enquiryType: enquiry.enquiryType,
        senderName: enquiry.senderName,
        subject: enquiry.subject,
      },
    });
  } catch (error) {
    console.error('Notification create failed:', error.message);
  }
};

export const getUnreadEnquiryNotificationCount = async () =>
  Notification.countDocuments({ module: 'ENQUIRY', status: 'unread' });

export const markEnquiryNotificationsRead = async (enquiryId) => {
  try {
    await Notification.updateMany(
      { module: 'ENQUIRY', enquiryId, status: 'unread' },
      { $set: { status: 'read' } }
    );
  } catch (error) {
    console.error('Notification update failed:', error.message);
  }
};

export default {
  createEnquiryNotification,
  getUnreadEnquiryNotificationCount,
  markEnquiryNotificationsRead,
};
