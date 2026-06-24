/**
 * Strip HTML tags and trim user-provided text fields.
 */
import { parseVacancyDate } from './vacancyDate.js';

export const sanitizeText = (value) => {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:/gi, '')
    .trim();
};

export const sanitizeContactMessage = ({ name, email, phone, subject, message }) => ({
  name: sanitizeText(name),
  email: sanitizeText(email).toLowerCase(),
  phone: sanitizeText(phone),
  subject: sanitizeText(subject),
  message: sanitizeText(message),
});

export const sanitizeEnquiryInput = (body = {}) => ({
  senderName: sanitizeText(body.senderName || body.fullName || body.name),
  email: sanitizeText(body.email).toLowerCase(),
  phone: sanitizeText(body.phone || body.phoneNumber),
  subject: sanitizeText(body.subject || body.enquiryType),
  message: sanitizeText(body.message),
  productName: sanitizeText(body.productName),
  quantityRequired: sanitizeText(body.quantityRequired || body.quantity),
  attachment: sanitizeText(body.attachment),
  adminNotes: sanitizeText(body.adminNotes),
});

export const sanitizeJobApplicationInput = (body = {}) => ({
  jobId: sanitizeText(body.jobId || body.vacancyId),
  jobTitle: sanitizeText(body.jobTitle || body.vacancyTitle),
  department: sanitizeText(body.department),
  employmentType: sanitizeText(body.employmentType),
  location: sanitizeText(body.location),
  firstName: sanitizeText(body.firstName),
  lastName: sanitizeText(body.lastName),
  email: sanitizeText(body.email).toLowerCase(),
  phoneNumber: sanitizeText(body.phoneNumber),
  address: sanitizeText(body.address),
});

export const sanitizeVacancyInput = (body = {}) => {
  const closingDate =
    body.closingDate !== undefined || body.closeDate !== undefined
      ? parseVacancyDate(body.closingDate ?? body.closeDate)
      : undefined;

  const openDate =
    body.openDate !== undefined ? parseVacancyDate(body.openDate) : undefined;

  return {
    title: sanitizeText(body.jobTitle || body.title),
    department: sanitizeText(body.department),
    employmentType: sanitizeText(body.employmentType),
    status: sanitizeText(body.status),
    location: sanitizeText(body.location),
    workingDays: sanitizeText(body.workingDays),
    workingHours: sanitizeText(body.workingHours),
    summary: sanitizeText(body.summary),
    description: sanitizeText(body.jobDescription || body.description),
    icon: sanitizeText(body.icon),
    legacyId: sanitizeText(body.legacyId),
    ...(closingDate !== undefined ? { closingDate } : {}),
    ...(openDate !== undefined ? { openDate } : {}),
  };
};

export default { sanitizeText, sanitizeContactMessage, sanitizeEnquiryInput, sanitizeJobApplicationInput, sanitizeVacancyInput };
