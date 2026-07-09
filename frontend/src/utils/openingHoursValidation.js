export const SUPERMARKET_HOURS_REQUIRED = 'Supermarket opening hours are required.';
export const FOOD_CORNER_HOURS_REQUIRED = 'Food Corner opening hours are required.';
export const OPENING_HOURS_INVALID = 'Please enter valid opening hours.';

const MIN_LENGTH = 5;
const MAX_LENGTH = 150;

const trim = (value) => String(value ?? '').trim();

export const OPENING_HOURS_FIELD_ORDER = ['supermarketTimings', 'foodCornerTimings'];

export const OPENING_HOURS_FIELD_IDS = {
  supermarketTimings: 'opening-hours-supermarket',
  foodCornerTimings: 'opening-hours-food-corner',
};

export const validateOpeningHoursField = (value, fieldName) => {
  const normalized = trim(value);

  if (!normalized) {
    return fieldName === 'foodCornerTimings'
      ? FOOD_CORNER_HOURS_REQUIRED
      : SUPERMARKET_HOURS_REQUIRED;
  }

  if (normalized.length < MIN_LENGTH || normalized.length > MAX_LENGTH) {
    return OPENING_HOURS_INVALID;
  }

  return '';
};

export const validateOpeningHoursForm = (formData) => {
  const supermarketTimings = validateOpeningHoursField(
    formData?.supermarketTimings,
    'supermarketTimings'
  );
  const foodCornerTimings = validateOpeningHoursField(
    formData?.foodCornerTimings,
    'foodCornerTimings'
  );

  const fieldErrors = {};
  if (supermarketTimings) fieldErrors.supermarketTimings = supermarketTimings;
  if (foodCornerTimings) fieldErrors.foodCornerTimings = foodCornerTimings;

  return {
    fieldErrors,
    isValid: Object.keys(fieldErrors).length === 0,
  };
};

export const focusFirstOpeningHoursError = (fieldErrors) => {
  const firstField = OPENING_HOURS_FIELD_ORDER.find((field) => fieldErrors[field]);
  if (!firstField) return;

  const element = document.getElementById(OPENING_HOURS_FIELD_IDS[firstField]);
  element?.focus();
  element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
};
