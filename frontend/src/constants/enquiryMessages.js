export const ENQUIRY_STATUSES = ['New', 'Read', 'Replied', 'Closed'];

export const ENQUIRY_SUBMIT_SUCCESS_MESSAGE =
  'Your enquiry has been submitted successfully.';

export const getStatusClassName = (status) => {
  switch (status) {
    case 'New':
      return 'enquiry-status-new';
    case 'Read':
      return 'enquiry-status-read';
    case 'Replied':
      return 'enquiry-status-replied';
    case 'Closed':
      return 'enquiry-status-closed';
    default:
      return 'enquiry-status-new';
  }
};

export const getStatusBadgeLabel = (status) => {
  switch (normalizeStatusLabel(status)) {
    case 'New':
      return '🟢 New';
    case 'Read':
      return '🔵 Read';
    case 'Replied':
      return '🟡 Replied';
    case 'Closed':
      return '⚫ Closed';
    default:
      return '🟢 New';
  }
};

const normalizeStatusLabel = (status) => {
  if (!status) return 'New';
  const value = String(status);
  if (ENQUIRY_STATUSES.includes(value)) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};
