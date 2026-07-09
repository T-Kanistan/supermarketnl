import api, { apiRequest } from './api';

const normalizeParagraphSlots = (paragraphs = []) => {
  const slots = Array.isArray(paragraphs) ? [...paragraphs] : [];
  while (slots.length < 4) slots.push('');
  return slots.slice(0, 4);
};

const mapIntroduction = (intro) => {
  if (!intro) {
    return {
      heroEyebrow: '',
      heroHeading: '',
      heroHighlight: '',
      heroParagraphs: normalizeParagraphSlots(),
      heroDescription: '',
      heroBadge: '',
      heroImage: '',
      button1Text: '',
      button1Url: '',
      button2Text: '',
      button2Url: '',
      heroDisplayOrder: 1,
      heroIsActive: false,
    };
  }

  const paragraphs = normalizeParagraphSlots([
    intro.description_1,
    intro.description_2,
    intro.description_3,
    intro.description_4,
  ]);

  return {
    heroEyebrow: intro.badge_text || intro.badgeText || intro.eyebrowTag || '',
    heroHeading: intro.main_heading || intro.mainHeading || intro.pageHeading || '',
    heroHighlight: intro.highlight_heading || intro.highlightHeading || intro.highlightedWord || '',
    heroParagraphs: paragraphs,
    heroDescription: paragraphs.filter(Boolean).join('\n\n') || intro.description || '',
    heroBadge: intro.serving_badge_text || intro.servingBadgeText || intro.imageBadgeText || '',
    heroImage: intro.image || intro.heroImage || '',
    button1Text: intro.button1_text || intro.button1Text || '',
    button1Url: intro.button1_url || intro.button1Url || '',
    button2Text: intro.button2_text || intro.button2Text || '',
    button2Url: intro.button2_url || intro.button2Url || '',
    heroDisplayOrder: intro.display_order ?? intro.displayOrder ?? 1,
    heroIsActive: intro.is_active !== false,
  };
};

const mapStory = (story) => {
  if (!story) {
    return {
      storyTitle: '',
      storyDescription: '',
      storyImage: '',
      storyIsActive: false,
    };
  }

  return {
    storyTitle: story.title || '',
    storyDescription: story.description || '',
    storyImage: story.image || '',
    storyIsActive: story.is_active !== false,
  };
};

const mapTimeline = (items = []) =>
  items.map((item) => ({
    id: String(item.id || item._id || ''),
    marker: item.subtitle || '',
    title: item.title || '',
    description: item.description || '',
    icon: item.icon || 'FiCalendar',
    displayOrder: item.display_order ?? 0,
    isActive: item.is_active !== false,
  }));

const mapValues = (items = []) =>
  items.map((item) => ({
    id: String(item.id || item._id || ''),
    title: item.title || '',
    icon: item.icon || 'FiTarget',
    description: item.description || '',
    displayOrder: item.display_order ?? 0,
    isActive: item.is_active !== false,
  }));

const mapOffers = (items = []) =>
  items.map((item) => ({
    id: String(item.id || item._id || ''),
    title: item.title || '',
    description: item.description || '',
    image: item.image || '',
    displayOrder: item.display_order ?? 0,
    isActive: item.is_active !== false,
  }));

const mapStatistics = (items = []) =>
  items.map((item) => ({
    id: String(item.id || item._id || ''),
    label: item.title || '',
    value: item.value ?? 0,
    suffix: item.suffix || '',
    icon: item.icon || 'FiUsers',
    displayOrder: item.display_order ?? 0,
    isActive: item.is_active !== false,
  }));

const mapOwner = (owner) => {
  if (!owner) {
    return {
      name: '',
      designation: '',
      phone: '',
      location: '',
      badge: '',
      quote: '',
      photo: '',
      sinceYear: '',
      yearsServing: '',
      isActive: false,
    };
  }

  return {
    name: owner.owner_name || owner.ownerName || '',
    designation: owner.designation || '',
    phone: owner.phone || owner.phoneNumber || '',
    location: owner.address || owner.location || '',
    badge: owner.badge_text || owner.badgeText || '',
    quote: owner.quote || owner.ownerQuote || '',
    photo: owner.profile_photo || owner.ownerPhoto || '',
    sinceYear: owner.since_year || owner.sinceYear || '',
    yearsServing: owner.experience_text || owner.experienceText || '',
    isActive: owner.is_active !== false,
  };
};

export const mapModulePageToFrontend = (data) => {
  if (!data) return null;
  const intro = mapIntroduction(data.introduction);
  const story = mapStory(data.story);
  return {
    aboutPage: {
      ...intro,
      ...story,
      storyTimeline: mapTimeline(data.storyTimeline),
      mvpCards: mapValues(data.values),
      offerings: mapOffers(data.offers),
      stats: mapStatistics(data.statistics),
      owner: mapOwner(data.owner),
    },
    raw: data,
  };
};

const isValidMongoId = (id) => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id);

const mapListItem = (item, index, mapper) => {
  const payload = mapper(item, index);
  if (isValidMongoId(item.id)) {
    payload.id = item.id;
  }
  return payload;
};

const buildSyncPayload = (ap = {}) => ({
  introduction: {
    badge_text: ap.heroEyebrow || '',
    main_heading: ap.heroHeading || '',
    highlight_heading: ap.heroHighlight || '',
    description_1: ap.heroParagraphs?.[0] || '',
    description_2: ap.heroParagraphs?.[1] || '',
    description_3: ap.heroParagraphs?.[2] || '',
    description_4: ap.heroParagraphs?.[3] || '',
    button1_text: ap.button1Text || '',
    button1_url: ap.button1Url || '',
    button2_text: ap.button2Text || '',
    button2_url: ap.button2Url || '',
    serving_badge_text: ap.heroBadge || '',
    image: ap.heroImage || '',
    display_order: ap.heroDisplayOrder ?? 1,
    is_active: ap.heroIsActive !== false,
  },
  story: {
    title: ap.storyTitle || '',
    description: ap.storyDescription || '',
    image: ap.storyImage || '',
    is_active: ap.storyIsActive !== false,
  },
  storyTimeline: (ap.storyTimeline || [])
    .filter((item) => !item.isDeleted)
    .map((item, index) =>
      mapListItem(item, index, (entry, orderIndex) => ({
        title: entry.title || '',
        subtitle: entry.marker || '',
        description: entry.description || '',
        icon: entry.icon || 'FiCalendar',
        display_order: entry.displayOrder ?? orderIndex + 1,
        is_active: entry.isActive !== false,
      }))
    ),
  values: (ap.mvpCards || [])
    .filter((item) => !item.isDeleted)
    .map((card, index) =>
      mapListItem(card, index, (entry, orderIndex) => ({
        title: entry.title || '',
        description: entry.description || '',
        icon: entry.icon || 'FiTarget',
        display_order: entry.displayOrder ?? orderIndex + 1,
        is_active: entry.isActive !== false,
      }))
    ),
  offers: (ap.offerings || [])
    .filter((item) => !item.isDeleted)
    .map((item, index) =>
      mapListItem(item, index, (entry, orderIndex) => ({
        title: entry.title || '',
        description: entry.description || '',
        image: entry.image || '',
        display_order: entry.displayOrder ?? orderIndex + 1,
        is_active: entry.isActive !== false,
      }))
    ),
  statistics: (ap.stats || [])
    .filter((item) => !item.isDeleted)
    .map((stat, index) =>
      mapListItem(stat, index, (entry, orderIndex) => ({
        title: entry.label || '',
        value: Number(entry.value) || 0,
        suffix: entry.suffix || '',
        icon: entry.icon || 'FiUsers',
        display_order: entry.displayOrder ?? orderIndex + 1,
        is_active: entry.isActive !== false,
      }))
    ),
  owner: {
    owner_name: ap.owner?.name || '',
    designation: ap.owner?.designation || '',
    quote: ap.owner?.quote || '',
    phone: ap.owner?.phone || '',
    address: ap.owner?.location || '',
    since_year: ap.owner?.sinceYear || '',
    experience_text: ap.owner?.yearsServing || '',
    badge_text: ap.owner?.badge || '',
    profile_photo: ap.owner?.photo || '',
    is_active: ap.owner?.isActive !== false,
  },
});

const uploadFile = async (endpoint, file) => {
  const formData = new FormData();
  formData.append('image', file);
  const result = await apiRequest(() =>
    api.post(endpoint, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
  );
  return result.imageUrl || result.image || result.profile_photo || result.story?.image || result.introduction?.image;
};

const dataUrlToFile = async (dataUrl, filename) => {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || 'image/png' });
};

export const mapApiToFrontend = mapModulePageToFrontend;

export const aboutUsService = {
  getAboutUs: async () => {
    const data = await apiRequest(() => api.get('/about', { params: { _t: Date.now() } }));
    return mapModulePageToFrontend(data);
  },

  getAboutUsAdmin: async () => {
    const data = await apiRequest(() =>
      api.get('/about/admin', { params: { _t: Date.now() } })
    );
    return mapModulePageToFrontend(data);
  },

  updateAboutUs: async (formDataOrPage, imageUrls = {}) => {
    const ap = { ...(formDataOrPage?.aboutPage || formDataOrPage) };

    if (ap.heroImage?.startsWith('data:image')) {
      const file = await dataUrlToFile(ap.heroImage, 'hero.jpg');
      ap.heroImage = await uploadFile('/about/introduction/image', file);
    } else if (imageUrls.hero) {
      ap.heroImage = imageUrls.hero;
    }

    if (ap.storyImage?.startsWith('data:image')) {
      const file = await dataUrlToFile(ap.storyImage, 'story.jpg');
      ap.storyImage = await uploadFile('/about/story/image', file);
    } else if (imageUrls.story) {
      ap.storyImage = imageUrls.story;
    }

    if (ap.owner?.photo?.startsWith('data:image')) {
      const file = await dataUrlToFile(ap.owner.photo, 'owner.jpg');
      ap.owner.photo = await uploadFile('/about/owner/photo', file);
    } else if (imageUrls.owner) {
      ap.owner.photo = imageUrls.owner;
    }

    const payload = buildSyncPayload(ap);
    const data = await apiRequest(() => api.put('/about/admin/sync', payload));
    return mapModulePageToFrontend(data);
  },

  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const result = await apiRequest(() =>
      api.post('/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    );
    return result.imageUrl;
  },

  getIntroduction: () => apiRequest(() => api.get('/about/introduction')),
  updateIntroduction: (body) => apiRequest(() => api.put('/about/introduction', body)),

  getStory: () => apiRequest(() => api.get('/about/story')),
  updateStory: (body) => apiRequest(() => api.put('/about/story', body)),

  getTimeline: (search = '') =>
    apiRequest(() => api.get('/about/story/timeline', { params: { search } })),
  createTimelineItem: (body) => apiRequest(() => api.post('/about/story/timeline', body)),
  updateTimelineItem: (id, body) => apiRequest(() => api.put(`/about/story/timeline/${id}`, body)),
  deleteTimelineItem: (id) => apiRequest(() => api.delete(`/about/story/timeline/${id}`)),
  reorderTimeline: (orders) => apiRequest(() => api.put('/about/story/timeline/reorder', { orders })),

  getValues: (search = '') => apiRequest(() => api.get('/about/values', { params: { search } })),
  createMvpCard: (body) => apiRequest(() => api.post('/about/values', body)),
  updateMvpCard: (id, body) => apiRequest(() => api.put(`/about/values/${id}`, body)),
  deleteMvpCard: (id) => apiRequest(() => api.delete(`/about/values/${id}`)),
  reorderMvpCards: (orders) => apiRequest(() => api.put('/about/values/reorder', { orders })),

  getOffers: (search = '') => apiRequest(() => api.get('/about/offers', { params: { search } })),
  createOffer: (body) => apiRequest(() => api.post('/about/offers', body)),
  updateOffer: (id, body) => apiRequest(() => api.put(`/about/offers/${id}`, body)),
  deleteOffer: (id) => apiRequest(() => api.delete(`/about/offers/${id}`)),
  uploadOfferImage: (id, file) => uploadFile(`/about/offers/${id}/image`, file),
  reorderOffers: (orders) => apiRequest(() => api.put('/about/offers/reorder', { orders })),

  getStatistics: (search = '') =>
    apiRequest(() => api.get('/about/statistics', { params: { search } })),
  createStatistic: (body) => apiRequest(() => api.post('/about/statistics', body)),
  updateStatistic: (id, body) => apiRequest(() => api.put(`/about/statistics/${id}`, body)),
  deleteStatistic: (id) => apiRequest(() => api.delete(`/about/statistics/${id}`)),
  reorderStatistics: (orders) => apiRequest(() => api.put('/about/statistics/reorder', { orders })),

  getOwner: () => apiRequest(() => api.get('/about/owner')),
  updateOwner: (body) => apiRequest(() => api.put('/about/owner', body)),
};

export default aboutUsService;
