export const FOOD_CORNER_CATEGORY_ICON_MAX_BYTES = 2 * 1024 * 1024;

export const FOOD_CORNER_CATEGORY_ICON_ACCEPT =
  '.png,.jpg,.jpeg,.svg,.webp,image/png,image/jpeg,image/jpg,image/svg+xml,image/webp';

export const FOOD_CORNER_CATEGORY_ICON_REQUIRED = 'Please upload a category icon.';

export const FOOD_CORNER_CATEGORY_ICON_SIZE_ERROR =
  'Category icon must be less than or equal to 2 MB.';

export const FOOD_CORNER_CATEGORY_ICON_INVALID_TYPE =
  'Only PNG, JPG, JPEG, SVG, and WEBP images are allowed.';

export const isFoodCornerCategoryIconUrl = (icon) => {
  const value = String(icon || '').trim();
  if (!value) return false;
  if (value.startsWith('blob:')) return true;
  if (value.startsWith('data:image/')) return true;
  if (value.startsWith('/uploads/') || value.startsWith('http://') || value.startsWith('https://')) {
    return /\.(png|jpe?g|webp|svg)(\?.*)?$/i.test(value);
  }
  return false;
};

export const isValidFoodCornerCategoryIconFile = (file) => {
  if (!file) return false;
  const name = (file.name || '').toLowerCase();
  const mime = (file.type || '').toLowerCase();
  const validExt = /\.(png|jpe?g|webp|svg)$/.test(name);
  const validMime = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/svg+xml',
  ].includes(mime);
  return validExt && (!mime || validMime);
};

export const validateFoodCornerCategoryIconFile = (file) => {
  if (!file) {
    return { valid: false, error: FOOD_CORNER_CATEGORY_ICON_REQUIRED };
  }
  if (!isValidFoodCornerCategoryIconFile(file)) {
    return { valid: false, error: FOOD_CORNER_CATEGORY_ICON_INVALID_TYPE };
  }
  if (file.size > FOOD_CORNER_CATEGORY_ICON_MAX_BYTES) {
    return { valid: false, error: FOOD_CORNER_CATEGORY_ICON_SIZE_ERROR };
  }
  return { valid: true, error: '' };
};

export const validateFoodCornerCategoryIcon = (
  icon,
  { isEdit = false, existingIcon = '' } = {}
) => {
  const value = String(icon || '').trim();
  const existing = String(existingIcon || '').trim();

  if (!value) {
    if (isEdit && isFoodCornerCategoryIconUrl(existing)) return '';
    return FOOD_CORNER_CATEGORY_ICON_REQUIRED;
  }

  if (value.startsWith('blob:')) {
    return FOOD_CORNER_CATEGORY_ICON_REQUIRED;
  }

  if (isFoodCornerCategoryIconUrl(value)) {
    return '';
  }

  return FOOD_CORNER_CATEGORY_ICON_INVALID_TYPE;
};
