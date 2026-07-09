import { getImageUrl } from '../services/api';
import { isFoodCornerCategoryIconUrl } from '../utils/foodCornerCategoryIconValidation';

const FoodCornerCategoryIcon = ({
  icon,
  className = '',
  imgClassName = '',
  alt = '',
  fallback = null,
}) => {
  const value = String(icon || '').trim();
  if (!value) {
    if (fallback) {
      return (
        <span className={className} aria-hidden={alt ? undefined : true}>
          {fallback}
        </span>
      );
    }
    return null;
  }

  if (isFoodCornerCategoryIconUrl(value)) {
    const src = value.startsWith('blob:') || value.startsWith('data:')
      ? value
      : getImageUrl(value);

    return (
      <img
        src={src}
        alt={alt}
        className={imgClassName || className}
      />
    );
  }

  return (
    <span className={className} aria-hidden={alt ? undefined : true}>
      {value}
    </span>
  );
};

export default FoodCornerCategoryIcon;
