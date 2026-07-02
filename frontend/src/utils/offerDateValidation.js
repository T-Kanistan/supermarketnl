export const OFFER_END_DATE_RANGE_ERROR =
  'End Date must be the same as or later than the Start Date.';

export const validateOfferDates = (startDate, endDate) => {
  const start = String(startDate || '').trim();
  const end = String(endDate || '').trim();

  let startDateError = '';
  let endDateError = '';

  if (!start) {
    startDateError = 'Start Date is required.';
  }
  if (!end) {
    endDateError = 'End Date is required.';
  } else if (start && end < start) {
    endDateError = OFFER_END_DATE_RANGE_ERROR;
  }

  return {
    valid: !startDateError && !endDateError,
    startDateError,
    endDateError,
  };
};
