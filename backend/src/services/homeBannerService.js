import HomepageBanner from '../models/HomepageBanner.js';
import { handleBase64Upload } from '../middlewares/uploadMiddleware.js';
import { logManagerActivity } from './activityLogService.js';

const mapIncomingFields = (body = {}) => ({
  headingLine1: body.headingLine1 ?? body.title,
  headingLine2: body.headingLine2 ?? body.highlightText,
  headingLine3: body.headingLine3 ?? body.titleLine2,
  subtitle: body.subtitle,
  primaryButtonLabel: body.primaryButtonLabel ?? body.buttonText,
  primaryButtonLink: body.primaryButtonLink ?? body.buttonLink,
  secondaryButtonLabel: body.secondaryButtonLabel ?? body.buttonText2,
  secondaryButtonLink: body.secondaryButtonLink ?? body.buttonLink2,
  backgroundImage: body.backgroundImage ?? body.image,
  status: body.status,
  showOpenTimeCard:
    body.showOpenTimeCard !== undefined
      ? body.showOpenTimeCard !== false && body.showOpenTimeCard !== 'false'
      : body.showOpenTime !== undefined
        ? body.showOpenTime !== false && body.showOpenTime !== 'false'
        : undefined,
  cardTitle: body.cardTitle ?? body.openTimeTitle,
  supermarketLabel: body.supermarketLabel,
  supermarketHours: body.supermarketHours ?? body.supermarketTimings,
  foodCornerLabel: body.foodCornerLabel,
  foodCornerHours: body.foodCornerHours ?? body.foodCornerTimings,
});

export const formatHomeBanner = (doc) => {
  if (!doc) return null;
  const plain = doc.toObject ? doc.toObject() : { ...doc };

  return {
    ...plain,
    id: plain._id?.toString?.() ?? plain.id,
    // Legacy aliases for existing frontend components
    title: plain.headingLine1,
    highlightText: plain.headingLine2,
    titleLine2: plain.headingLine3,
    image: plain.backgroundImage,
    buttonText: plain.primaryButtonLabel,
    buttonLink: plain.primaryButtonLink,
    buttonText2: plain.secondaryButtonLabel,
    buttonLink2: plain.secondaryButtonLink,
    showOpenTime: plain.showOpenTimeCard,
    openTimeTitle: plain.cardTitle,
    supermarketTimings: plain.supermarketHours,
    foodCornerTimings: plain.foodCornerHours,
  };
};

export const formatStorefrontHomeBanner = (doc) => {
  const formatted = formatHomeBanner(doc);
  if (!formatted) return null;

  return {
    headingLine1: formatted.headingLine1,
    headingLine2: formatted.headingLine2,
    headingLine3: formatted.headingLine3,
    subtitle: formatted.subtitle,
    primaryButtonLabel: formatted.primaryButtonLabel,
    primaryButtonLink: formatted.primaryButtonLink,
    secondaryButtonLabel: formatted.secondaryButtonLabel,
    secondaryButtonLink: formatted.secondaryButtonLink,
    backgroundImage: formatted.backgroundImage,
    showOpenTimeCard: formatted.showOpenTimeCard,
    cardTitle: formatted.cardTitle,
    supermarketLabel: formatted.supermarketLabel,
    supermarketHours: formatted.supermarketHours,
    foodCornerLabel: formatted.foodCornerLabel,
    foodCornerHours: formatted.foodCornerHours,
    // Legacy aliases
    title: formatted.headingLine1,
    highlightText: formatted.headingLine2,
    titleLine2: formatted.headingLine3,
    image: formatted.backgroundImage,
    buttonText: formatted.primaryButtonLabel,
    buttonLink: formatted.primaryButtonLink,
    buttonText2: formatted.secondaryButtonLabel,
    buttonLink2: formatted.secondaryButtonLink,
    showOpenTime: formatted.showOpenTimeCard,
    openTimeTitle: formatted.cardTitle,
    supermarketTimings: formatted.supermarketHours,
    foodCornerTimings: formatted.foodCornerHours,
  };
};

const resolveImage = async (value) => {
  if (!value) return '';
  if (typeof value === 'string' && value.startsWith('data:image')) {
    return (await handleBase64Upload(value)) || value;
  }
  return value;
};

const validatePayload = (fields, { isUpdate = false } = {}) => {
  const requiredString = (value, label, max) => {
    const text = (value || '').trim();
    if (!isUpdate && !text) {
      const error = new Error(`${label} is required`);
      error.statusCode = 400;
      throw error;
    }
    if (text && max && text.length > max) {
      const error = new Error(`${label} must not exceed ${max} characters`);
      error.statusCode = 400;
      throw error;
    }
    return text;
  };

  const payload = {};
  payload.headingLine1 = requiredString(fields.headingLine1, 'Heading line 1', 100);
  payload.headingLine2 = requiredString(fields.headingLine2, 'Heading line 2', 100);
  payload.headingLine3 = requiredString(fields.headingLine3, 'Heading line 3', 100);
  payload.subtitle = requiredString(fields.subtitle, 'Subtitle', 300);
  payload.primaryButtonLabel = requiredString(fields.primaryButtonLabel, 'Primary button label', 50);
  payload.primaryButtonLink = requiredString(fields.primaryButtonLink, 'Primary button link');

  if (fields.secondaryButtonLabel !== undefined) {
    payload.secondaryButtonLabel = requiredString(fields.secondaryButtonLabel, 'Secondary button label', 50);
  }
  if (fields.secondaryButtonLink !== undefined) {
    payload.secondaryButtonLink = (fields.secondaryButtonLink || '').trim();
  }

  if (!isUpdate) {
    if (!fields.status) {
      const error = new Error('Status is required');
      error.statusCode = 400;
      throw error;
    }
    if (!fields.backgroundImage) {
      const error = new Error('Background image is required');
      error.statusCode = 400;
      throw error;
    }
  }

  if (fields.status !== undefined) payload.status = fields.status;
  if (fields.showOpenTimeCard !== undefined) payload.showOpenTimeCard = fields.showOpenTimeCard;
  if (fields.cardTitle !== undefined) payload.cardTitle = (fields.cardTitle || '').trim();
  if (fields.supermarketLabel !== undefined) payload.supermarketLabel = (fields.supermarketLabel || '').trim();
  if (fields.supermarketHours !== undefined) payload.supermarketHours = (fields.supermarketHours || '').trim();
  if (fields.foodCornerLabel !== undefined) payload.foodCornerLabel = (fields.foodCornerLabel || '').trim();
  if (fields.foodCornerHours !== undefined) payload.foodCornerHours = (fields.foodCornerHours || '').trim();

  return payload;
};

const buildPayload = async (body, { isUpdate = false } = {}) => {
  const fields = mapIncomingFields(body);
  const payload = validatePayload(fields, { isUpdate });

  if (fields.backgroundImage !== undefined) {
    payload.backgroundImage = await resolveImage(fields.backgroundImage);
  }

  return payload;
};

export const listHomeBanners = async () => {
  const items = await HomepageBanner.find({ status: { $ne: 'deleted' } }).sort({ updatedAt: -1 });
  return items.map(formatHomeBanner);
};

export const getActiveHomeBanner = async () => {
  const banner = await HomepageBanner.findOne({ status: 'active' }).sort({ updatedAt: -1 });
  if (!banner) {
    const error = new Error('No active homepage banner found');
    error.statusCode = 404;
    throw error;
  }
  return formatHomeBanner(banner);
};

export const getStorefrontHomeBanner = async () => {
  const banner = await HomepageBanner.findOne({ status: 'active' }).sort({ updatedAt: -1 });
  if (!banner) return null;
  return formatStorefrontHomeBanner(banner);
};

export const getHomeBannerById = async (id, { includeDeleted = false } = {}) => {
  const filter = { _id: id };
  if (!includeDeleted) filter.status = { $ne: 'deleted' };

  const banner = await HomepageBanner.findOne(filter);
  if (!banner) {
    const error = new Error('Homepage banner not found');
    error.statusCode = 404;
    throw error;
  }
  return formatHomeBanner(banner);
};

export const getHomeBannerPreview = async (id) => getHomeBannerById(id);

export const createHomeBanner = async (body, user) => {
  const payload = await buildPayload(body);
  payload.createdBy = user?._id || null;
  payload.updatedBy = user?._id || null;

  const banner = await HomepageBanner.create(payload);

  await logManagerActivity({
    user,
    action: 'CREATE',
    module: 'HOME_BANNER',
    description: 'Homepage banner created',
  });

  return formatHomeBanner(banner);
};

export const updateHomeBanner = async (id, body, user) => {
  const banner = await HomepageBanner.findOne({ _id: id, status: { $ne: 'deleted' } });
  if (!banner) {
    const error = new Error('Homepage banner not found');
    error.statusCode = 404;
    throw error;
  }

  const payload = await buildPayload(
    {
      headingLine1: banner.headingLine1,
      headingLine2: banner.headingLine2,
      headingLine3: banner.headingLine3,
      subtitle: banner.subtitle,
      primaryButtonLabel: banner.primaryButtonLabel,
      primaryButtonLink: banner.primaryButtonLink,
      secondaryButtonLabel: banner.secondaryButtonLabel,
      secondaryButtonLink: banner.secondaryButtonLink,
      backgroundImage: banner.backgroundImage,
      status: banner.status,
      showOpenTimeCard: banner.showOpenTimeCard,
      cardTitle: banner.cardTitle,
      supermarketLabel: banner.supermarketLabel,
      supermarketHours: banner.supermarketHours,
      foodCornerLabel: banner.foodCornerLabel,
      foodCornerHours: banner.foodCornerHours,
      ...mapIncomingFields(body),
    },
    { isUpdate: true }
  );

  Object.assign(banner, payload);
  banner.updatedBy = user?._id || null;
  await banner.save();

  await logManagerActivity({
    user,
    action: 'UPDATE',
    module: 'HOME_BANNER',
    description: 'Homepage banner updated',
  });

  return formatHomeBanner(banner);
};

export const softDeleteHomeBanner = async (id, user) => {
  const banner = await HomepageBanner.findOne({ _id: id, status: { $ne: 'deleted' } });
  if (!banner) {
    const error = new Error('Homepage banner not found');
    error.statusCode = 404;
    throw error;
  }

  banner.status = 'deleted';
  banner.updatedBy = user?._id || null;
  await banner.save();

  await logManagerActivity({
    user,
    action: 'DELETE',
    module: 'HOME_BANNER',
    description: 'Homepage banner deleted',
  });

  return { success: true };
};

export const countActiveHomeBanners = async () =>
  HomepageBanner.countDocuments({ status: 'active' });
