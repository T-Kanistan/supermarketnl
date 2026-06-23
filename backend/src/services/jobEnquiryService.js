import JobEnquiry from '../models/JobEnquiry.js';
import { sendJobEnquiryNotificationEmail } from './emailService.js';

const formatJobEnquiry = (doc) => {
  if (!doc) return null;
  const plain = doc.toObject ? doc.toObject() : doc;
  return {
    id: plain._id?.toString(),
    vacancyId: plain.vacancyId,
    vacancyTitle: plain.vacancyTitle,
    fullName: plain.fullName,
    applicantName: plain.fullName,
    email: plain.email,
    phone: plain.phone,
    phoneNumber: plain.phone,
    message: plain.message,
    submittedAt: plain.submittedAt || plain.createdAt,
    status: plain.status,
    statusLabel: plain.status === 'new' ? 'New' : 'Replied',
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const createJobEnquiry = async (payload) => {
  const enquiry = await JobEnquiry.create({
    vacancyId: payload.vacancyId,
    vacancyTitle: payload.vacancyTitle,
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone || payload.phoneNumber,
    message: payload.message,
    submittedAt: new Date(),
    status: 'new',
  });

  const formatted = formatJobEnquiry(enquiry);

  try {
    await sendJobEnquiryNotificationEmail(formatted);
  } catch (error) {
    console.error('[job-enquiry] Failed to send admin notification email:', error.message);
  }

  return formatted;
};

export const listJobEnquiries = async ({ status, search } = {}) => {
  const filter = {};
  if (status && status !== 'all') {
    filter.status = status;
  }
  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { fullName: regex },
      { email: regex },
      { phone: regex },
      { vacancyTitle: regex },
      { message: regex },
    ];
  }

  const enquiries = await JobEnquiry.find(filter).sort({ submittedAt: -1, createdAt: -1 });
  return enquiries.map(formatJobEnquiry);
};

export const getJobEnquiryById = async (id) => {
  const enquiry = await JobEnquiry.findById(id);
  return formatJobEnquiry(enquiry);
};

export const markJobEnquiryReplied = async (id) => {
  const enquiry = await JobEnquiry.findByIdAndUpdate(
    id,
    { status: 'replied' },
    { new: true, runValidators: true }
  );
  return formatJobEnquiry(enquiry);
};

export const deleteJobEnquiry = async (id) => {
  const enquiry = await JobEnquiry.findByIdAndDelete(id);
  return formatJobEnquiry(enquiry);
};
