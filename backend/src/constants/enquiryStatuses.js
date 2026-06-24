export const ENQUIRY_PUBLIC_STATUSES = ['New', 'Read', 'Replied', 'Closed'];

export const ENQUIRY_STATUS_TYPES = [...ENQUIRY_PUBLIC_STATUSES, 'deleted'];

const STATUS_ALIASES = {
  new: 'New',
  read: 'Read',
  replied: 'Replied',
  closed: 'Closed',
  deleted: 'deleted',
};

export const normalizeEnquiryStatus = (status) => {
  if (!status) return 'New';
  const trimmed = String(status).trim();
  if (ENQUIRY_PUBLIC_STATUSES.includes(trimmed)) return trimmed;
  return STATUS_ALIASES[trimmed.toLowerCase()] || 'New';
};

export const statusMatchesFilter = (filterStatus) => {
  const normalized = normalizeEnquiryStatus(filterStatus);
  if (normalized === 'deleted') return ['deleted'];
  const legacy = normalized.toLowerCase();
  return normalized === legacy ? [normalized] : [normalized, legacy];
};
