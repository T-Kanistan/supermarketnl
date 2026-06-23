import HomepageAboutSection, {
  getDefaultHomepageAbout,
} from '../models/HomepageAboutSection.js';
import AboutUsCMS, { getDefaultAboutCMS } from '../models/AboutCMS.js';
import HomeCMS from '../models/HomeCMS.js';
import { handleBase64Upload } from '../middlewares/uploadMiddleware.js';
import { logManagerActivity } from './activityLogService.js';

const parseBoolean = (value) => {
  if (value === true || value === false) return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

const normalizeStatus = (status) => {
  if (!status) return 'active';
  const lower = String(status).toLowerCase();
  if (['active', 'inactive', 'draft', 'deleted'].includes(lower)) return lower;
  return 'active';
};

const activeStatusFilter = { status: { $in: ['active', 'Active'] } };
const notDeletedFilter = { status: { $nin: ['deleted', 'Deleted'] } };

const sanitizeButtonLink = (link) => {
  const raw = (link || '').trim();
  if (!raw) return '/about';
  const lower = raw.toLowerCase();
  if (lower === '#footer' || lower === '#contact' || lower === '/footer' || lower === '/contact') {
    return '/about';
  }
  if (lower === '/about-us') return '/about';
  return raw;
};

const mapIncomingFields = (body = {}) => ({
  useAboutUsPageContent:
    parseBoolean(body.useAboutUsPageContent ?? body.useAboutUsContent),
  sectionHeading: body.sectionHeading,
  shortDescription: body.shortDescription,
  buttonText: body.buttonText,
  buttonLink: body.buttonLink,
  aboutImage: body.aboutImage,
  status: body.status !== undefined ? normalizeStatus(body.status) : undefined,
});

const resolveImage = async (value) => {
  if (!value) return '';
  if (typeof value === 'string' && value.startsWith('data:image')) {
    return (await handleBase64Upload(value)) || value;
  }
  return value;
};

const getAboutUsCmsDoc = async () => {
  let doc = await AboutUsCMS.findOne();
  if (!doc) doc = await AboutUsCMS.create(getDefaultAboutCMS());
  return doc;
};

const mapFromAboutUsCms = async () => {
  const about = await getAboutUsCmsDoc();
  const hero = about.heroSection || {};
  const homepage = about.homepageAboutSection || {};
  const homeCms = await HomeCMS.findOne();
  const storeName = homeCms?.storeName || 'Ins Wereld Winkel';

  const sectionHeading =
    [hero.pageHeading, hero.highlightedWord].filter(Boolean).join(' ').trim() ||
    `About ${storeName}`;

  const shortDescription =
    hero.description?.trim() ||
    about.homepageShortDescription?.trim() ||
    about.storySection?.description?.trim() ||
    '';

  const aboutImage =
    hero.heroImage || homepage.image || about.storySection?.image || '';

  return {
    sectionHeading,
    shortDescription,
    buttonText: homepage.buttonText || 'Learn More',
    buttonLink: '/about',
    aboutImage,
  };
};

const resolveCustomContent = (doc) => ({
  sectionHeading: doc.sectionHeading || '',
  shortDescription: doc.shortDescription || '',
  buttonText: doc.buttonText || 'Learn More',
  buttonLink: doc.buttonLink || '/about',
  aboutImage: doc.aboutImage || '',
});

const isCustomHomepageImage = (imagePath) =>
  Boolean(imagePath?.trim() && imagePath.includes('/uploads/homepage-about/'));

const resolveContent = async (doc) => {
  const useAboutUs = doc.useAboutUsPageContent ?? doc.useAboutUsContent;
  const resolved = useAboutUs ? await mapFromAboutUsCms() : resolveCustomContent(doc);

  if (isCustomHomepageImage(doc.aboutImage)) {
    resolved.aboutImage = doc.aboutImage;
  }

  return resolved;
};

export const formatHomepageAbout = (doc, resolved = null) => {
  if (!doc) return null;
  const plain = doc.toObject ? doc.toObject() : { ...doc };
  const useAboutUs = plain.useAboutUsPageContent ?? plain.useAboutUsContent ?? false;

  return {
    ...plain,
    id: plain._id?.toString?.() ?? plain.id,
    useAboutUsPageContent: useAboutUs,
    useAboutUsContent: useAboutUs,
    status: normalizeStatus(plain.status),
    resolvedContent: resolved,
  };
};

export const formatStorefrontAbout = (resolved) => ({
  sectionHeading: resolved.sectionHeading || '',
  shortDescription: resolved.shortDescription || '',
  buttonText: resolved.buttonText || 'Learn More',
  buttonLink: sanitizeButtonLink(resolved.buttonLink),
  aboutImage: resolved.aboutImage || '',
});

export const formatPreview = (doc, resolved) => ({
  sectionHeading: resolved.sectionHeading || '',
  shortDescription: resolved.shortDescription || '',
  buttonText: resolved.buttonText || 'Learn More',
  buttonLink: sanitizeButtonLink(resolved.buttonLink),
  aboutImage: resolved.aboutImage || '',
  status: normalizeStatus(doc.status),
  useAboutUsPageContent: doc.useAboutUsPageContent ?? doc.useAboutUsContent ?? false,
});

const validateCustomPayload = (fields, { isUpdate = false } = {}) => {
  const useAboutUs = fields.useAboutUsPageContent === true;
  if (useAboutUs) return;

  const errors = [];
  const heading = (fields.sectionHeading || '').trim();
  const description = (fields.shortDescription || '').trim();
  const buttonText = (fields.buttonText || '').trim();
  const buttonLink = (fields.buttonLink || '').trim();
  const image = (fields.aboutImage || '').trim();

  if (!isUpdate || fields.sectionHeading !== undefined) {
    if (!heading) errors.push('Section heading is required');
    else if (heading.length > 100) errors.push('Section heading must not exceed 100 characters');
  }
  if (!isUpdate || fields.shortDescription !== undefined) {
    if (!description) errors.push('Short description is required');
    else if (description.length > 1000) {
      errors.push('Short description must not exceed 1000 characters');
    }
  }
  if (!isUpdate || fields.buttonText !== undefined) {
    if (!buttonText) errors.push('Button text is required');
    else if (buttonText.length > 50) errors.push('Button text must not exceed 50 characters');
  }
  if (!isUpdate || fields.buttonLink !== undefined) {
    if (!buttonLink) errors.push('Button link is required');
  }
  if (!isUpdate && !image) {
    errors.push('About image is required');
  }

  if (errors.length) {
    const error = new Error(errors[0]);
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }
};

const buildPayload = async (body, { isUpdate = false, existing = null } = {}) => {
  const fields = mapIncomingFields(body);
  const useAboutUs =
    fields.useAboutUsPageContent !== undefined
      ? fields.useAboutUsPageContent
      : existing
        ? existing.useAboutUsPageContent ?? existing.useAboutUsContent
        : false;

  const payload = {};
  if (fields.useAboutUsPageContent !== undefined) {
    payload.useAboutUsPageContent = useAboutUs;
    payload.useAboutUsContent = useAboutUs;
  }

  if (fields.sectionHeading !== undefined) payload.sectionHeading = fields.sectionHeading.trim();
  if (fields.shortDescription !== undefined) payload.shortDescription = fields.shortDescription.trim();
  if (fields.buttonText !== undefined) payload.buttonText = fields.buttonText.trim();
  if (fields.buttonLink !== undefined) payload.buttonLink = fields.buttonLink.trim();
  if (fields.status !== undefined) payload.status = fields.status;

  if (fields.aboutImage !== undefined) {
    payload.aboutImage = await resolveImage(fields.aboutImage);
  }

  validateCustomPayload(
    {
      useAboutUsPageContent: useAboutUs,
      sectionHeading: payload.sectionHeading ?? existing?.sectionHeading,
      shortDescription: payload.shortDescription ?? existing?.shortDescription,
      buttonText: payload.buttonText ?? existing?.buttonText,
      buttonLink: payload.buttonLink ?? existing?.buttonLink,
      aboutImage: payload.aboutImage ?? existing?.aboutImage,
    },
    { isUpdate }
  );

  if (!isUpdate && !fields.status) {
    const error = new Error('Status is required');
    error.statusCode = 400;
    throw error;
  }

  return payload;
};

export const listHomepageAboutSections = async () => {
  const items = await HomepageAboutSection.find(notDeletedFilter).sort({
    updatedAt: -1,
  });
  return Promise.all(
    items.map(async (item) => formatHomepageAbout(item, await resolveContent(item)))
  );
};

export const getActiveHomepageAbout = async () => {
  const doc = await HomepageAboutSection.findOne(activeStatusFilter).sort({ updatedAt: -1 });
  if (!doc) {
    const error = new Error('No active homepage about section found');
    error.statusCode = 404;
    throw error;
  }
  const resolved = await resolveContent(doc);
  return formatHomepageAbout(doc, resolved);
};

export const getStorefrontHomepageAbout = async () => {
  const doc = await HomepageAboutSection.findOne(activeStatusFilter).sort({ updatedAt: -1 });
  if (!doc) return null;
  const resolved = await resolveContent(doc);
  return formatStorefrontAbout(resolved);
};

export const getHomepageAboutById = async (id) => {
  const doc = await HomepageAboutSection.findOne({ _id: id, ...notDeletedFilter });
  if (!doc) {
    const error = new Error('Homepage about section not found');
    error.statusCode = 404;
    throw error;
  }
  const resolved = await resolveContent(doc);
  return formatHomepageAbout(doc, resolved);
};

export const getHomepageAboutPreview = async (id) => {
  const doc = await HomepageAboutSection.findOne({ _id: id, ...notDeletedFilter });
  if (!doc) {
    const error = new Error('Homepage about section not found');
    error.statusCode = 404;
    throw error;
  }
  const resolved = await resolveContent(doc);
  return formatPreview(doc, resolved);
};

export const createHomepageAbout = async (body, user) => {
  const payload = await buildPayload(body);
  payload.createdBy = user?._id || null;
  payload.updatedBy = user?._id || null;

  const doc = await HomepageAboutSection.create(payload);
  const resolved = await resolveContent(doc);

  await logManagerActivity({
    user,
    action: 'CREATE',
    module: 'HOMEPAGE_ABOUT',
    description: 'Homepage About section created',
  });

  return formatHomepageAbout(doc, resolved);
};

export const updateHomepageAbout = async (id, body, user) => {
  const doc = await HomepageAboutSection.findOne({ _id: id, ...notDeletedFilter });
  if (!doc) {
    const error = new Error('Homepage about section not found');
    error.statusCode = 404;
    throw error;
  }

  const payload = await buildPayload(body, { isUpdate: true, existing: doc });
  Object.assign(doc, payload);
  if (payload.status !== undefined) {
    doc.status = normalizeStatus(payload.status);
  }
  doc.updatedBy = user?._id || null;
  await doc.save();

  const resolved = await resolveContent(doc);

  await logManagerActivity({
    user,
    action: 'UPDATE',
    module: 'HOMEPAGE_ABOUT',
    description: 'Homepage About section updated',
  });

  return formatHomepageAbout(doc, resolved);
};

export const updateActiveHomepageAbout = async (body, user) => {
  let doc = await HomepageAboutSection.findOne(activeStatusFilter).sort({ updatedAt: -1 });
  if (!doc) {
    doc = await HomepageAboutSection.findOne(notDeletedFilter).sort({ updatedAt: -1 });
  }
  if (!doc) {
    return createHomepageAbout(body, user);
  }
  return updateHomepageAbout(doc._id, body, user);
};

export const softDeleteHomepageAbout = async (id, user) => {
  const doc = await HomepageAboutSection.findOne({ _id: id, ...notDeletedFilter });
  if (!doc) {
    const error = new Error('Homepage about section not found');
    error.statusCode = 404;
    throw error;
  }

  doc.status = 'deleted';
  doc.updatedBy = user?._id || null;
  await doc.save();

  await logManagerActivity({
    user,
    action: 'DELETE',
    module: 'HOMEPAGE_ABOUT',
    description: 'Homepage About section deleted',
  });

  return { success: true };
};

export const ensureDefaultSection = async () => {
  const existing = await HomepageAboutSection.findOne(notDeletedFilter);
  if (existing) return existing;

  const defaults = getDefaultHomepageAbout();
  const aboutCms = await getAboutUsCmsDoc();
  defaults.shortDescription =
    aboutCms.homepageShortDescription || defaults.shortDescription;
  defaults.aboutImage =
    aboutCms.homepageAboutSection?.image ||
    aboutCms.heroSection?.heroImage ||
    defaults.aboutImage;

  return HomepageAboutSection.create(defaults);
};

export const countActiveHomepageAbout = async () =>
  HomepageAboutSection.countDocuments(activeStatusFilter);
