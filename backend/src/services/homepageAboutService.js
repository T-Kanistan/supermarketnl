import mongoose from 'mongoose';
import HomepageAboutSection, { getDefaultHomepageAbout } from '../models/HomepageAboutSection.js';
import AboutUsCMS, { getDefaultAboutCMS } from '../models/AboutCMS.js';
import HomeCMS from '../models/HomeCMS.js';
import { deleteLocalImage, toPublicUrl } from '../middleware/upload.js';

const LEGACY_COLLECTION = 'homepage_about_section';

const parseBoolean = (value) => {
  if (value === true || value === false) return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

const sortFeatures = (features = []) =>
  [...features].sort((a, b) => (a.order || 0) - (b.order || 0));

const normalizeFeatureItems = (features = []) => {
  if (!Array.isArray(features)) return [];

  return features
    .map((item, index) => {
      if (typeof item === 'string') {
        const text = item.trim();
        return text ? { text, order: index + 1 } : null;
      }
      if (item && typeof item === 'object') {
        const text = (item.text || '').trim();
        return text
          ? {
              ...(item._id ? { _id: item._id } : {}),
              text,
              order: Number(item.order) || index + 1,
            }
          : null;
      }
      return null;
    })
    .filter(Boolean)
    .map((item, index) => ({ ...item, order: index + 1 }));
};

const mapFeaturesToApi = (features = []) =>
  sortFeatures(features).map((f) => ({
    id: f._id,
    text: f.text || '',
    order: f.order ?? 0,
  }));

const migrateLegacyDocument = (legacy = {}) => {
  const legacyFeatures = legacy.features || [];
  const features = Array.isArray(legacyFeatures)
    ? legacyFeatures.map((text, index) => ({
        text: typeof text === 'string' ? text : text?.text || '',
        order: index + 1,
      }))
    : getDefaultHomepageAbout().features;

  return {
    useAboutUsContent: legacy.useAboutUsContent ?? true,
    sectionHeading: legacy.sectionHeading || legacy.heading || getDefaultHomepageAbout().sectionHeading,
    shortDescription:
      legacy.shortDescription || legacy.description || getDefaultHomepageAbout().shortDescription,
    features: normalizeFeatureItems(features),
    buttonText: legacy.buttonText || 'Learn More',
    buttonLink: legacy.buttonLink || '/about-us',
    aboutImage: legacy.aboutImage || legacy.image || '',
    status:
      legacy.status ||
      (legacy.isActive === false ? 'Inactive' : 'Active'),
  };
};

const buildDefaultsFromAboutCms = async () => {
  const defaults = getDefaultHomepageAbout();
  const aboutDoc = (await AboutUsCMS.findOne()) || getDefaultAboutCMS();
  const homeCms = await HomeCMS.findOne();
  const storeName = homeCms?.storeName || 'Ins Wereld Winkel';

  defaults.sectionHeading = `About ${storeName}`;
  defaults.shortDescription =
    aboutDoc.homepageShortDescription || defaults.shortDescription;
  defaults.buttonText = aboutDoc.homepageAboutSection?.buttonText || defaults.buttonText;
  defaults.aboutImage =
    aboutDoc.homepageAboutSection?.image || defaults.aboutImage;

  if (aboutDoc.homepageAboutSection?.features?.length) {
    defaults.features = normalizeFeatureItems(aboutDoc.homepageAboutSection.features);
  }

  return defaults;
};

const ensureHomepageAbout = async () => {
  let doc = await HomepageAboutSection.findOne();

  if (!doc) {
    const legacyCol = mongoose.connection?.db?.collection(LEGACY_COLLECTION);
    const legacyDoc = legacyCol ? await legacyCol.findOne({}) : null;

    if (legacyDoc) {
      doc = await HomepageAboutSection.create(migrateLegacyDocument(legacyDoc));
    } else {
      const defaults = await buildDefaultsFromAboutCms();
      doc = await HomepageAboutSection.create(defaults);
    }
  }

  return doc;
};

const getAboutUsCmsDoc = async () => {
  let doc = await AboutUsCMS.findOne();
  if (!doc) {
    doc = await AboutUsCMS.create(getDefaultAboutCMS());
  }
  return doc;
};

const mapFromAboutUsCms = async () => {
  const about = await getAboutUsCmsDoc();
  const hero = about.heroSection || {};
  const homepage = about.homepageAboutSection || {};

  const sectionHeading =
    [hero.pageHeading, hero.highlightedWord].filter(Boolean).join(' ').trim() ||
    'About Us';

  const shortDescription =
    hero.description?.trim() ||
    about.homepageShortDescription?.trim() ||
    about.storySection?.description?.trim() ||
    '';

  const aboutImage =
    hero.heroImage ||
    homepage.image ||
    about.storySection?.image ||
    '';

  const features = homepage.features?.length
    ? normalizeFeatureItems(homepage.features)
    : [];

  return {
    sectionHeading,
    shortDescription,
    features: mapFeaturesToApi(features),
    buttonText: homepage.buttonText || 'Learn More',
    buttonLink: '/about-us',
    aboutImage,
  };
};

const mapStoredDocToApi = (doc) => ({
  id: doc._id,
  useAboutUsContent: doc.useAboutUsContent !== false,
  sectionHeading: doc.sectionHeading || '',
  shortDescription: doc.shortDescription || '',
  features: mapFeaturesToApi(doc.features),
  buttonText: doc.buttonText || 'Learn More',
  buttonLink: doc.buttonLink || '/about-us',
  aboutImage: doc.aboutImage || '',
  status: doc.status === 'Inactive' ? 'Inactive' : 'Active',
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

const mapResolvedToPublic = (doc, resolved) => ({
  status: doc.status === 'Inactive' ? 'Inactive' : 'Active',
  useAboutUsContent: doc.useAboutUsContent !== false,
  sectionHeading: resolved.sectionHeading || '',
  shortDescription: resolved.shortDescription || '',
  features: [],
  buttonText: resolved.buttonText || 'Learn More',
  buttonLink: resolved.buttonLink || '/about-us',
  aboutImage: resolved.aboutImage || '',
});

const resolveCustomContent = (doc) => ({
  sectionHeading: doc.sectionHeading || '',
  shortDescription: doc.shortDescription || '',
  features: mapFeaturesToApi(doc.features),
  buttonText: doc.buttonText || 'Learn More',
  buttonLink: doc.buttonLink || '/about-us',
  aboutImage: doc.aboutImage || '',
});

const isCustomHomepageImage = (imagePath) =>
  Boolean(imagePath?.trim() && imagePath.includes('/uploads/homepage-about/'));

const resolveContent = async (doc) => {
  const resolved =
    doc.useAboutUsContent !== false
      ? await mapFromAboutUsCms()
      : resolveCustomContent(doc);

  // A homepage-specific upload always wins over synced About Us CMS imagery.
  if (isCustomHomepageImage(doc.aboutImage)) {
    resolved.aboutImage = doc.aboutImage;
  }

  return resolved;
};

const validatePayload = (body, doc) => {
  if (body.useAboutUsContent === true || (body.useAboutUsContent === undefined && doc.useAboutUsContent !== false)) {
    return;
  }

  const errors = [];
  const sectionHeading = body.sectionHeading ?? doc.sectionHeading;
  const shortDescription = body.shortDescription ?? doc.shortDescription;
  const buttonText = body.buttonText ?? doc.buttonText;
  const buttonLink = body.buttonLink ?? doc.buttonLink;

  if (!sectionHeading?.trim()) {
    errors.push({ field: 'sectionHeading', message: 'Section heading is required' });
  }
  if (!shortDescription?.trim()) {
    errors.push({ field: 'shortDescription', message: 'Short description is required' });
  }
  if (!buttonText?.trim()) {
    errors.push({ field: 'buttonText', message: 'Button text is required' });
  }
  if (!buttonLink?.trim()) {
    errors.push({ field: 'buttonLink', message: 'Button link is required' });
  }

  if (errors.length) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }
};

export const getPublicHomepageAbout = async () => {
  const doc = await ensureHomepageAbout();

  if (doc.status === 'Inactive') {
    return { status: 'Inactive' };
  }

  const resolved = await resolveContent(doc);
  return mapResolvedToPublic(doc, resolved);
};

export const getAdminHomepageAbout = async () => {
  const doc = await ensureHomepageAbout();
  const resolved = await resolveContent(doc);

  return {
    ...mapStoredDocToApi(doc),
    resolvedContent: resolved,
  };
};

export const updateHomepageAbout = async (body = {}) => {
  const doc = await ensureHomepageAbout();

  const useAboutUsContent = parseBoolean(body.useAboutUsContent);
  const validateBody = {
    ...body,
    useAboutUsContent:
      useAboutUsContent !== undefined ? useAboutUsContent : doc.useAboutUsContent !== false,
  };

  validatePayload(validateBody, doc);

  if (useAboutUsContent !== undefined) {
    doc.useAboutUsContent = useAboutUsContent;
  }

  if (body.sectionHeading !== undefined) doc.sectionHeading = body.sectionHeading;
  if (body.shortDescription !== undefined) doc.shortDescription = body.shortDescription;
  if (body.features !== undefined) {
    doc.features = normalizeFeatureItems(body.features);
    doc.markModified('features');
  }
  if (body.buttonText !== undefined) doc.buttonText = body.buttonText;
  if (body.buttonLink !== undefined) doc.buttonLink = body.buttonLink;
  if (body.aboutImage !== undefined) {
    doc.aboutImage = body.aboutImage;
    if (isCustomHomepageImage(body.aboutImage)) {
      doc.useAboutUsContent = false;
    }
  }

  if (body.status !== undefined) {
    doc.status = body.status === 'Inactive' ? 'Inactive' : 'Active';
  } else if (body.isActive !== undefined) {
    const active = parseBoolean(body.isActive);
    doc.status = active === false ? 'Inactive' : 'Active';
  }

  await doc.save();

  const resolved = await resolveContent(doc);
  return {
    ...mapStoredDocToApi(doc),
    resolvedContent: resolved,
  };
};

export const uploadHomepageAboutImage = async (file) => {
  const doc = await ensureHomepageAbout();

  if (doc.aboutImage?.startsWith('/uploads/')) {
    deleteLocalImage(doc.aboutImage);
  }

  const imageUrl = toPublicUrl(file);
  doc.aboutImage = imageUrl;
  doc.useAboutUsContent = false;
  await doc.save();

  const resolved = await resolveContent(doc);
  return {
    imageUrl,
    aboutImage: imageUrl,
    section: {
      ...mapStoredDocToApi(doc),
      resolvedContent: resolved,
    },
  };
};

export default {
  getPublicHomepageAbout,
  getAdminHomepageAbout,
  updateHomepageAbout,
  uploadHomepageAboutImage,
};
