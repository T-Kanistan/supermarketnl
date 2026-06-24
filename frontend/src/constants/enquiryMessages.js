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
