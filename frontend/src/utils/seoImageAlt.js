import { SITE_NAME } from '../seo/siteConfig';
import { formatCategoryName } from './formatCategoryName';

export const buildProductAlt = (productName) =>
  productName
    ? `${productName} at ${SITE_NAME}`
    : `Product at ${SITE_NAME}`;

export const buildFoodAlt = (itemName) =>
  itemName
    ? `${itemName} takeaway meal at ${SITE_NAME} Food Corner`
    : `Fresh takeaway meal at ${SITE_NAME} Food Corner`;

export const buildCategoryAlt = (categoryName) =>
  categoryName
    ? `${formatCategoryName(categoryName)} at ${SITE_NAME}`
    : `Grocery category at ${SITE_NAME}`;

export const buildStoreLogoAlt = () => `${SITE_NAME} logo`;

export const buildPromoAlt = (label = 'Weekly grocery deals') =>
  `${label} at ${SITE_NAME}`;

export const buildHeroAlt = () =>
  `Fresh groceries and supermarket products at ${SITE_NAME}, Hilversum`;
