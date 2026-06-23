import mongoose from 'mongoose';
import AboutUsCMS, { getDefaultAboutCMS } from '../models/AboutCMS.js';
import {
  AboutIntroduction,
  AboutStory,
  AboutStoryTimeline,
  AboutValues,
  AboutOffers,
  AboutStatistics,
  AboutOwner,
} from '../models/aboutModels.js';
import { deleteLocalImage, toPublicUrl } from '../middleware/upload.js';
import { logManagerActivity } from './activityLogService.js';

const sortByOrder = (items) =>
  [...items].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

const mapDoc = (doc) => {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: o._id,
    ...o,
    created_at: o.createdAt,
    updated_at: o.updatedAt,
  };
};

const filterSearch = (items, search, fields) => {
  const q = (search || '').trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) =>
    fields.some((f) => String(item[f] || '').toLowerCase().includes(q))
  );
};

const replaceImage = async (doc, field, file) => {
  const prev = doc[field];
  if (prev?.startsWith('/uploads/')) deleteLocalImage(prev);
  doc[field] = toPublicUrl(file);
  await doc.save();
  return doc[field];
};

const logAbout = async (user, description, module = 'ABOUT') => {
  await logManagerActivity({
    user,
    action: 'UPDATE',
    module,
    description,
  });
};

const seedDefaults = () => {
  const d = getDefaultAboutCMS();
  const hero = d.heroSection;
  const story = d.storySection;
  const owner = d.ownerDetails;

  return {
    introduction: {
      badge_text: hero.eyebrowTag,
      main_heading: hero.pageHeading,
      highlight_heading: hero.highlightedWord,
      description_1: hero.descriptionParagraphs?.[0] || '',
      description_2: hero.descriptionParagraphs?.[1] || '',
      description_3: hero.descriptionParagraphs?.[2] || '',
      description_4: hero.descriptionParagraphs?.[3] || '',
      button1_text: hero.button1Text,
      button1_url: hero.button1Url,
      button2_text: hero.button2Text,
      button2_url: hero.button2Url,
      serving_badge_text: hero.imageBadgeText,
      image: hero.heroImage,
      display_order: 1,
      is_active: true,
    },
    story: {
      title: story.title,
      description: story.description,
      image: story.image,
      is_active: true,
    },
    timeline: (d.storyTimeline || []).map((t, i) => ({
      title: t.title,
      subtitle: t.marker,
      description: t.description,
      icon: t.icon || 'FiCalendar',
      display_order: i + 1,
      is_active: true,
    })),
    values: (d.mvpCards || []).map((c, i) => ({
      title: c.title,
      description: c.description,
      icon: c.icon,
      display_order: i + 1,
      is_active: true,
    })),
    offers: (d.whatWeOffer || []).map((o, i) => ({
      title: o.categoryName,
      description: o.description,
      image: o.imageUrl,
      display_order: i + 1,
      is_active: o.isActive !== false,
    })),
    statistics: (d.statistics || []).map((s, i) => ({
      title: s.label,
      value: s.value,
      suffix: s.suffix,
      icon: s.icon || 'FiUsers',
      display_order: i + 1,
      is_active: true,
    })),
    owner: {
      owner_name: owner.ownerName,
      designation: owner.designation,
      quote: owner.ownerQuote,
      phone: owner.phoneNumber,
      address: owner.location,
      since_year: owner.sinceYear || '2022',
      experience_text: owner.experienceText,
      badge_text: owner.badgeText,
      profile_photo: owner.ownerPhoto,
      is_active: true,
    },
  };
};

export const migrateFromLegacyIfNeeded = async () => {
  const introCount = await AboutIntroduction.countDocuments();
  if (introCount > 0) return;

  let legacy = null;
  try {
    legacy = await AboutUsCMS.findOne();
  } catch {
    /* ignore */
  }

  const seed = seedDefaults();
  if (legacy) {
    const h = legacy.heroSection || {};
    const s = legacy.storySection || {};
    const o = legacy.ownerDetails || {};
    seed.introduction = {
      badge_text: h.eyebrowTag || seed.introduction.badge_text,
      main_heading: h.pageHeading || seed.introduction.main_heading,
      highlight_heading: h.highlightedWord || seed.introduction.highlight_heading,
      description_1: h.descriptionParagraphs?.[0] || h.description || seed.introduction.description_1,
      description_2: h.descriptionParagraphs?.[1] || seed.introduction.description_2,
      description_3: h.descriptionParagraphs?.[2] || seed.introduction.description_3,
      description_4: h.descriptionParagraphs?.[3] || seed.introduction.description_4,
      button1_text: h.button1Text || seed.introduction.button1_text,
      button1_url: h.button1Url || seed.introduction.button1_url,
      button2_text: h.button2Text || seed.introduction.button2_text,
      button2_url: h.button2Url || seed.introduction.button2_url,
      serving_badge_text: h.imageBadgeText || seed.introduction.serving_badge_text,
      image: h.heroImage || seed.introduction.image,
      display_order: h.displayOrder ?? 1,
      is_active: h.isActive !== false,
    };
    seed.story = {
      title: s.title || seed.story.title,
      description: s.description || seed.story.description,
      image: s.image || seed.story.image,
      is_active: true,
    };
    if (legacy.storyTimeline?.length) {
      seed.timeline = legacy.storyTimeline.map((t, i) => ({
        title: t.title,
        subtitle: t.marker,
        description: t.description,
        icon: t.icon || 'FiCalendar',
        display_order: t.displayOrder ?? i + 1,
        is_active: t.isActive !== false,
      }));
    }
    if (legacy.mvpCards?.length) {
      seed.values = legacy.mvpCards.map((c, i) => ({
        title: c.title,
        description: c.description,
        icon: c.icon,
        display_order: c.displayOrder ?? i + 1,
        is_active: c.isActive !== false,
      }));
    }
    if (legacy.whatWeOffer?.length) {
      seed.offers = legacy.whatWeOffer.map((item, i) => ({
        title: item.categoryName,
        description: item.description,
        image: item.imageUrl,
        display_order: item.displayOrder ?? i + 1,
        is_active: item.isActive !== false,
      }));
    }
    if (legacy.statistics?.length) {
      seed.statistics = legacy.statistics.map((item, i) => ({
        title: item.label,
        value: item.value,
        suffix: item.suffix,
        icon: item.icon || 'FiUsers',
        display_order: item.displayOrder ?? i + 1,
        is_active: item.isActive !== false,
      }));
    }
    seed.owner = {
      owner_name: o.ownerName || seed.owner.owner_name,
      designation: o.designation || seed.owner.designation,
      quote: o.ownerQuote || seed.owner.quote,
      phone: o.phoneNumber || seed.owner.phone,
      address: o.location || seed.owner.address,
      since_year: o.sinceYear || seed.owner.since_year,
      experience_text: o.experienceText || seed.owner.experience_text,
      badge_text: o.badgeText || seed.owner.badge_text,
      profile_photo: o.ownerPhoto || seed.owner.profile_photo,
      is_active: o.isActive !== false,
    };
  }

  await AboutIntroduction.create(seed.introduction);
  await AboutStory.create(seed.story);
  if (seed.timeline.length) await AboutStoryTimeline.insertMany(seed.timeline);
  if (seed.values.length) await AboutValues.insertMany(seed.values);
  if (seed.offers.length) await AboutOffers.insertMany(seed.offers);
  if (seed.statistics.length) await AboutStatistics.insertMany(seed.statistics);
  await AboutOwner.create(seed.owner);
};

const ensureSingleton = async (Model, defaults) => {
  let doc = await Model.findOne();
  if (!doc) doc = await Model.create(defaults);
  return doc;
};

// ─── Aggregated ───
export const getPublicPage = async () => {
  await migrateFromLegacyIfNeeded();
  const [introduction, story, owner] = await Promise.all([
    AboutIntroduction.findOne({ is_active: true }),
    AboutStory.findOne({ is_active: true }),
    AboutOwner.findOne({ is_active: true }),
  ]);
  const [timeline, values, offers, statistics] = await Promise.all([
    AboutStoryTimeline.find({ is_active: true }).sort({ display_order: 1 }),
    AboutValues.find({ is_active: true }).sort({ display_order: 1 }),
    AboutOffers.find({ is_active: true }).sort({ display_order: 1 }),
    AboutStatistics.find({ is_active: true }).sort({ display_order: 1 }),
  ]);
  return {
    introduction: mapDoc(introduction),
    story: mapDoc(story),
    storyTimeline: timeline.map(mapDoc),
    values: values.map(mapDoc),
    offers: offers.map(mapDoc),
    statistics: statistics.map(mapDoc),
    owner: mapDoc(owner),
  };
};

export const getAdminPage = async () => {
  await migrateFromLegacyIfNeeded();
  const seed = seedDefaults();
  const [introduction, story, owner] = await Promise.all([
    ensureSingleton(AboutIntroduction, seed.introduction),
    ensureSingleton(AboutStory, seed.story),
    ensureSingleton(AboutOwner, seed.owner),
  ]);
  const [timeline, values, offers, statistics] = await Promise.all([
    AboutStoryTimeline.find().sort({ display_order: 1 }),
    AboutValues.find().sort({ display_order: 1 }),
    AboutOffers.find().sort({ display_order: 1 }),
    AboutStatistics.find().sort({ display_order: 1 }),
  ]);
  return {
    introduction: mapDoc(introduction),
    story: mapDoc(story),
    storyTimeline: timeline.map(mapDoc),
    values: values.map(mapDoc),
    offers: offers.map(mapDoc),
    statistics: statistics.map(mapDoc),
    owner: mapDoc(owner),
  };
};

// ─── Introduction ───
export const getIntroduction = async (activeOnly = false) => {
  await migrateFromLegacyIfNeeded();
  const seed = seedDefaults();
  const query = activeOnly ? { is_active: true } : {};
  const doc = await AboutIntroduction.findOne(query) || await ensureSingleton(AboutIntroduction, seed.introduction);
  return mapDoc(doc);
};

export const updateIntroduction = async (body, user) => {
  const seed = seedDefaults();
  const doc = await ensureSingleton(AboutIntroduction, seed.introduction);
  Object.assign(doc, body);
  await doc.save();
  await logAbout(user, 'Updated About Introduction', 'ABOUT_INTRODUCTION');
  return mapDoc(doc);
};

export const uploadIntroductionImage = async (file, user) => {
  const seed = seedDefaults();
  const doc = await ensureSingleton(AboutIntroduction, seed.introduction);
  const url = await replaceImage(doc, 'image', file);
  await logAbout(user, 'Updated About Introduction image', 'ABOUT_INTRODUCTION');
  return { image: url, introduction: mapDoc(doc) };
};

// ─── Story ───
export const getStory = async (activeOnly = false) => {
  await migrateFromLegacyIfNeeded();
  const seed = seedDefaults();
  const query = activeOnly ? { is_active: true } : {};
  const doc = await AboutStory.findOne(query) || await ensureSingleton(AboutStory, seed.story);
  return mapDoc(doc);
};

export const updateStory = async (body, user) => {
  const seed = seedDefaults();
  const doc = await ensureSingleton(AboutStory, seed.story);
  Object.assign(doc, body);
  await doc.save();
  await logAbout(user, 'Updated About Story', 'ABOUT_STORY');
  return mapDoc(doc);
};

export const uploadStoryImage = async (file, user) => {
  const seed = seedDefaults();
  const doc = await ensureSingleton(AboutStory, seed.story);
  const url = await replaceImage(doc, 'image', file);
  await logAbout(user, 'Updated About Story image', 'ABOUT_STORY');
  return { image: url, story: mapDoc(doc) };
};

// ─── Timeline ───
export const listTimeline = async (search = '', activeOnly = false) => {
  await migrateFromLegacyIfNeeded();
  const query = activeOnly ? { is_active: true } : {};
  let items = await AboutStoryTimeline.find(query).sort({ display_order: 1 });
  items = filterSearch(items.map((d) => d.toObject()), search, ['title', 'subtitle', 'description']);
  return sortByOrder(items).map((o) => ({ id: o._id, ...o, created_at: o.createdAt, updated_at: o.updatedAt }));
};

export const createTimeline = async (body, user) => {
  const max = await AboutStoryTimeline.findOne().sort({ display_order: -1 });
  const doc = await AboutStoryTimeline.create({
    ...body,
    display_order: body.display_order ?? (max?.display_order || 0) + 1,
  });
  await logAbout(user, 'Added Story Timeline item', 'ABOUT_STORY');
  return mapDoc(doc);
};

export const updateTimeline = async (id, body, user) => {
  const doc = await AboutStoryTimeline.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  if (!doc) {
    const err = new Error('Timeline item not found');
    err.statusCode = 404;
    throw err;
  }
  await logAbout(user, 'Updated Story Timeline item', 'ABOUT_STORY');
  return mapDoc(doc);
};

export const deleteTimeline = async (id, user) => {
  const doc = await AboutStoryTimeline.findByIdAndDelete(id);
  if (!doc) {
    const err = new Error('Timeline item not found');
    err.statusCode = 404;
    throw err;
  }
  await logAbout(user, 'Deleted Story Timeline item', 'ABOUT_STORY');
};

export const reorderTimeline = async (orders, user) => {
  await Promise.all(
    orders.map(({ id, display_order }) =>
      AboutStoryTimeline.findByIdAndUpdate(id, { display_order })
    )
  );
  await logAbout(user, 'Reordered Story Timeline', 'ABOUT_STORY');
  return listTimeline();
};

// ─── Values ───
export const listValues = async (search = '', activeOnly = false) => {
  await migrateFromLegacyIfNeeded();
  const query = activeOnly ? { is_active: true } : {};
  let items = await AboutValues.find(query).sort({ display_order: 1 });
  items = filterSearch(items.map((d) => d.toObject()), search, ['title', 'description']);
  return sortByOrder(items).map((o) => ({ id: o._id, ...o, created_at: o.createdAt, updated_at: o.updatedAt }));
};

export const createValue = async (body, user) => {
  const max = await AboutValues.findOne().sort({ display_order: -1 });
  const doc = await AboutValues.create({
    ...body,
    display_order: body.display_order ?? (max?.display_order || 0) + 1,
  });
  await logAbout(user, 'Added Mission/Vision/Promise card', 'ABOUT_VALUES');
  return mapDoc(doc);
};

export const updateValue = async (id, body, user) => {
  const doc = await AboutValues.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  if (!doc) {
    const err = new Error('Value card not found');
    err.statusCode = 404;
    throw err;
  }
  await logAbout(user, 'Updated Mission/Vision/Promise card', 'ABOUT_VALUES');
  return mapDoc(doc);
};

export const deleteValue = async (id, user) => {
  const doc = await AboutValues.findByIdAndDelete(id);
  if (!doc) {
    const err = new Error('Value card not found');
    err.statusCode = 404;
    throw err;
  }
  await logAbout(user, 'Deleted Mission/Vision/Promise card', 'ABOUT_VALUES');
};

export const reorderValues = async (orders, user) => {
  await Promise.all(
    orders.map(({ id, display_order }) => AboutValues.findByIdAndUpdate(id, { display_order }))
  );
  await logAbout(user, 'Reordered Mission/Vision/Promise cards', 'ABOUT_VALUES');
  return listValues();
};

// ─── Offers ───
export const listOffers = async (search = '', activeOnly = false) => {
  await migrateFromLegacyIfNeeded();
  const query = activeOnly ? { is_active: true } : {};
  let items = await AboutOffers.find(query).sort({ display_order: 1 });
  items = filterSearch(items.map((d) => d.toObject()), search, ['title', 'description']);
  return sortByOrder(items).map((o) => ({ id: o._id, ...o, created_at: o.createdAt, updated_at: o.updatedAt }));
};

export const createOffer = async (body, user) => {
  const max = await AboutOffers.findOne().sort({ display_order: -1 });
  const doc = await AboutOffers.create({
    ...body,
    display_order: body.display_order ?? (max?.display_order || 0) + 1,
  });
  await logAbout(user, 'Added New Offer', 'ABOUT_OFFERS');
  return mapDoc(doc);
};

export const updateOffer = async (id, body, user) => {
  const doc = await AboutOffers.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  if (!doc) {
    const err = new Error('Offer not found');
    err.statusCode = 404;
    throw err;
  }
  await logAbout(user, 'Updated Offer', 'ABOUT_OFFERS');
  return mapDoc(doc);
};

export const deleteOffer = async (id, user) => {
  const doc = await AboutOffers.findByIdAndDelete(id);
  if (!doc) {
    const err = new Error('Offer not found');
    err.statusCode = 404;
    throw err;
  }
  if (doc.image?.startsWith('/uploads/')) deleteLocalImage(doc.image);
  await logAbout(user, 'Deleted Offer', 'ABOUT_OFFERS');
};

export const uploadOfferImage = async (id, file, user) => {
  const doc = await AboutOffers.findById(id);
  if (!doc) {
    const err = new Error('Offer not found');
    err.statusCode = 404;
    throw err;
  }
  const url = await replaceImage(doc, 'image', file);
  await logAbout(user, 'Updated Offer image', 'ABOUT_OFFERS');
  return { image: url, offer: mapDoc(doc) };
};

export const reorderOffers = async (orders, user) => {
  await Promise.all(
    orders.map(({ id, display_order }) => AboutOffers.findByIdAndUpdate(id, { display_order }))
  );
  await logAbout(user, 'Reordered Offers', 'ABOUT_OFFERS');
  return listOffers();
};

// ─── Statistics ───
export const listStatistics = async (search = '', activeOnly = false) => {
  await migrateFromLegacyIfNeeded();
  const query = activeOnly ? { is_active: true } : {};
  let items = await AboutStatistics.find(query).sort({ display_order: 1 });
  items = filterSearch(items.map((d) => d.toObject()), search, ['title']);
  return sortByOrder(items).map((o) => ({ id: o._id, ...o, created_at: o.createdAt, updated_at: o.updatedAt }));
};

export const createStatistic = async (body, user) => {
  const max = await AboutStatistics.findOne().sort({ display_order: -1 });
  const doc = await AboutStatistics.create({
    ...body,
    value: Number(body.value) || 0,
    display_order: body.display_order ?? (max?.display_order || 0) + 1,
  });
  await logAbout(user, 'Added Statistics Item', 'ABOUT_STATISTICS');
  return mapDoc(doc);
};

export const updateStatistic = async (id, body, user) => {
  if (body.value !== undefined) body.value = Number(body.value) || 0;
  const doc = await AboutStatistics.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  if (!doc) {
    const err = new Error('Statistic not found');
    err.statusCode = 404;
    throw err;
  }
  await logAbout(user, 'Updated Statistics Item', 'ABOUT_STATISTICS');
  return mapDoc(doc);
};

export const deleteStatistic = async (id, user) => {
  const doc = await AboutStatistics.findByIdAndDelete(id);
  if (!doc) {
    const err = new Error('Statistic not found');
    err.statusCode = 404;
    throw err;
  }
  await logAbout(user, 'Deleted Statistics Item', 'ABOUT_STATISTICS');
};

export const reorderStatistics = async (orders, user) => {
  await Promise.all(
    orders.map(({ id, display_order }) => AboutStatistics.findByIdAndUpdate(id, { display_order }))
  );
  await logAbout(user, 'Reordered Statistics', 'ABOUT_STATISTICS');
  return listStatistics();
};

// ─── Owner ───
export const getOwner = async (activeOnly = false) => {
  await migrateFromLegacyIfNeeded();
  const seed = seedDefaults();
  const query = activeOnly ? { is_active: true } : {};
  const doc = await AboutOwner.findOne(query) || await ensureSingleton(AboutOwner, seed.owner);
  return mapDoc(doc);
};

export const updateOwner = async (body, user) => {
  const seed = seedDefaults();
  const doc = await ensureSingleton(AboutOwner, seed.owner);
  Object.assign(doc, body);
  await doc.save();
  await logAbout(user, 'Updated Owner Information', 'ABOUT_OWNER');
  return mapDoc(doc);
};

export const uploadOwnerPhoto = async (file, user) => {
  const seed = seedDefaults();
  const doc = await ensureSingleton(AboutOwner, seed.owner);
  const url = await replaceImage(doc, 'profile_photo', file);
  await logAbout(user, 'Updated Owner profile photo', 'ABOUT_OWNER');
  return { profile_photo: url, owner: mapDoc(doc) };
};

const syncList = async (Model, items = [], user, moduleName) => {
  const existing = await Model.find();
  const incomingIds = new Set(
    items.filter((i) => i.id && mongoose.Types.ObjectId.isValid(i.id)).map((i) => String(i.id))
  );

  for (const old of existing) {
    if (!incomingIds.has(String(old._id))) {
      await Model.findByIdAndDelete(old._id);
      if (old.image?.startsWith('/uploads/')) deleteLocalImage(old.image);
    }
  }

  const results = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const data = { ...item, display_order: item.display_order ?? index + 1 };
    delete data.id;
    delete data.created_at;
    delete data.updated_at;
    delete data._id;

    if (item.id && mongoose.Types.ObjectId.isValid(item.id)) {
      const updated = await Model.findByIdAndUpdate(item.id, data, { new: true, runValidators: true });
      if (updated) results.push(updated);
    } else {
      const created = await Model.create(data);
      results.push(created);
    }
  }

  await logAbout(user, `Synced ${moduleName}`, moduleName);
  return results.map(mapDoc);
};

export const syncAdminPage = async (payload, user) => {
  await migrateFromLegacyIfNeeded();

  if (payload.introduction) {
    await updateIntroduction(payload.introduction, user);
  }
  if (payload.story) {
    await updateStory(payload.story, user);
  }
  if (payload.owner) {
    await updateOwner(payload.owner, user);
  }
  if (Array.isArray(payload.storyTimeline)) {
    const items = payload.storyTimeline.map((t) => ({
      id: t.id,
      title: t.title,
      subtitle: t.subtitle || t.marker,
      description: t.description,
      icon: t.icon || 'FiCalendar',
      display_order: t.display_order,
      is_active: t.is_active !== false,
    }));
    await syncList(AboutStoryTimeline, items, user, 'ABOUT_STORY');
  }
  if (Array.isArray(payload.values)) {
    const items = payload.values.map((v) => ({
      id: v.id,
      title: v.title,
      description: v.description,
      icon: v.icon || 'FiTarget',
      display_order: v.display_order,
      is_active: v.is_active !== false,
    }));
    await syncList(AboutValues, items, user, 'ABOUT_VALUES');
  }
  if (Array.isArray(payload.offers)) {
    const items = payload.offers.map((o) => ({
      id: o.id,
      title: o.title,
      description: o.description,
      image: o.image,
      display_order: o.display_order,
      is_active: o.is_active !== false,
    }));
    await syncList(AboutOffers, items, user, 'ABOUT_OFFERS');
  }
  if (Array.isArray(payload.statistics)) {
    const items = payload.statistics.map((s) => ({
      id: s.id,
      title: s.title || s.label,
      value: Number(s.value) || 0,
      suffix: s.suffix || '',
      icon: s.icon || 'FiUsers',
      display_order: s.display_order,
      is_active: s.is_active !== false,
    }));
    await syncList(AboutStatistics, items, user, 'ABOUT_STATISTICS');
  }

  await logAbout(user, 'Synced About Us page', 'ABOUT');
  return getAdminPage();
};

export default {
  migrateFromLegacyIfNeeded,
  getPublicPage,
  getAdminPage,
  getIntroduction,
  updateIntroduction,
  uploadIntroductionImage,
  getStory,
  updateStory,
  uploadStoryImage,
  listTimeline,
  createTimeline,
  updateTimeline,
  deleteTimeline,
  reorderTimeline,
  listValues,
  createValue,
  updateValue,
  deleteValue,
  reorderValues,
  listOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  uploadOfferImage,
  reorderOffers,
  listStatistics,
  createStatistic,
  updateStatistic,
  deleteStatistic,
  reorderStatistics,
  getOwner,
  updateOwner,
  uploadOwnerPhoto,
  syncAdminPage,
};
