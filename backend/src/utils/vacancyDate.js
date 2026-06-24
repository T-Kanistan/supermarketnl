/**
 * Parse vacancy date fields (YYYY-MM-DD or ISO) into a Date at local noon to avoid timezone shifts.
 */
export const parseVacancyDate = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      const error = new Error('Invalid date');
      error.statusCode = 400;
      throw error;
    }
    return value;
  }

  const raw = String(value).trim();
  const isoDateMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0, 0);
    if (Number.isNaN(date.getTime())) {
      const error = new Error('Invalid date');
      error.statusCode = 400;
      throw error;
    }
    return date;
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    const error = new Error('Invalid date');
    error.statusCode = 400;
    throw error;
  }
  return date;
};

export const isClosingDatePassed = (closingDate) => {
  if (!closingDate) return false;

  const close = new Date(closingDate);
  if (Number.isNaN(close.getTime())) return false;

  close.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return today > close;
};

export const assertClosingDateNotInPast = (closingDate) => {
  if (!closingDate) return;

  const parsed = parseVacancyDate(closingDate);
  if (isClosingDatePassed(parsed)) {
    const error = new Error('Closing date cannot be earlier than today');
    error.statusCode = 400;
    throw error;
  }
};

export default { parseVacancyDate, isClosingDatePassed, assertClosingDateNotInPast };
