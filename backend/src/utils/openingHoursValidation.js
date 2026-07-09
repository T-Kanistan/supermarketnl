export const SUPERMARKET_HOURS_REQUIRED = 'Supermarket opening hours are required.';
export const FOOD_CORNER_HOURS_REQUIRED = 'Food Corner opening hours are required.';
export const OPENING_HOURS_INVALID = 'Please enter valid opening hours.';

const MIN_LENGTH = 5;
const MAX_LENGTH = 150;

const trim = (value) => String(value ?? '').trim();

export const validateOpeningHoursValue = (value, field) => {
  const normalized = trim(value);

  if (!normalized) {
    return field === 'foodCornerOpeningHours'
      ? FOOD_CORNER_HOURS_REQUIRED
      : SUPERMARKET_HOURS_REQUIRED;
  }

  if (normalized.length < MIN_LENGTH || normalized.length > MAX_LENGTH) {
    return OPENING_HOURS_INVALID;
  }

  return null;
};

export const validateOpeningHoursPair = (supermarketHours, foodCornerHours) => {
  const errors = [];

  const supermarketError = validateOpeningHoursValue(
    supermarketHours,
    'supermarketOpeningHours'
  );
  if (supermarketError) {
    errors.push({ field: 'supermarketOpeningHours', message: supermarketError });
  }

  const foodCornerError = validateOpeningHoursValue(
    foodCornerHours,
    'foodCornerOpeningHours'
  );
  if (foodCornerError) {
    errors.push({ field: 'foodCornerOpeningHours', message: foodCornerError });
  }

  return errors;
};

export const assertOpeningHoursValid = (supermarketHours, foodCornerHours) => {
  const errors = validateOpeningHoursPair(supermarketHours, foodCornerHours);
  if (!errors.length) return;

  const error = new Error(errors[0].message);
  error.statusCode = 400;
  error.errors = errors;
  throw error;
};
