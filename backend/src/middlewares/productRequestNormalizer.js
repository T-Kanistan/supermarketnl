const parseOptionalBoolean = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 1 || value === '1') return true;
  if (value === 'false' || value === 0 || value === '0') return false;
  return value;
};

export const normalizeProductRequestBody = (req, _res, next) => {
  const body = req.body || {};

  if (body.productCatalogType !== undefined && body.productType === undefined && body.type === undefined) {
    body.productType = body.productCatalogType;
  }

  if (body.weightUnitSize !== undefined && body.weightUnit === undefined && body.weight === undefined) {
    body.weightUnit = body.weightUnitSize;
  }

  if (body.featured !== undefined && body.featuredProduct === undefined && body.isFeatured === undefined) {
    body.featuredProduct = parseOptionalBoolean(body.featured);
  }

  if (body.isFeatured !== undefined && body.featuredProduct === undefined) {
    body.featuredProduct = parseOptionalBoolean(body.isFeatured);
  }

  if (body.featuredProduct !== undefined) {
    body.featuredProduct = parseOptionalBoolean(body.featuredProduct);
  }

  if (body.category !== undefined && body.categoryId === undefined && body.categoryName === undefined) {
    body.categoryId = body.category;
  }

  if (body.categoryName !== undefined && body.categoryId === undefined) {
    body.categoryId = body.categoryName;
  }

  if (body.image !== undefined && body.imageUrl === undefined) {
    body.imageUrl = body.image;
  }

  if (body.description !== undefined && body.shortDescription === undefined) {
    body.shortDescription = body.description;
  }

  req.body = body;
  next();
};
