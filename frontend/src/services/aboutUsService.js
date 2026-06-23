import api, { apiRequest } from './api';

const mapIntroduction = (intro = {}) => ({
  heroEyebrow: intro.badge_text || '',
  heroHeading: intro.main_heading || '',
  heroHighlight: intro.highlight_heading || '',
  heroParagraphs: [
    intro.description_1,
    intro.description_2,
    intro.description_3,
    intro.description_4,
  ].filter(Boolean),
  heroDescription: [intro.description_1, intro.description_2].filter(Boolean).join('\n\n'),
  heroBadge: intro.serving_badge_text || '',
  heroImage: intro.image || '',
  button1Text: intro.button1_text || 'Explore Products',
  button1Url: intro.button1_url || '/products',
  button2Text: intro.button2_text || 'Contact Us',
  button2Url: intro.button2_url || '/contact',
  heroDisplayOrder: intro.display_order ?? 1,
  heroIsActive: intro.is_active !== false,
});

const mapStory = (story = {}) => ({
  storyTitle: story.title || '',
  storyDescription: story.description || '',
  storyImage: story.image || '',
});

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

const mapOwner = (owner = {}) => ({
  name: owner.owner_name || '',
  designation: owner.designation || '',
  phone: owner.phone || '',
  location: owner.address || '',
  badge: owner.badge_text || '',
  quote: owner.quote || '',
  photo: owner.profile_photo || '',
  sinceYear: owner.since_year || '2022',
  yearsServing: owner.experience_text || '',
  isActive: owner.is_active !== false,
});

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
    is_active: true,
  },
  storyTimeline: (ap.storyTimeline || []).map((item, index) => ({
    id: item.id,
    title: item.title || '',
    subtitle: item.marker || '',
    description: item.description || '',
    icon: item.icon || 'FiCalendar',
    display_order: item.displayOrder ?? index + 1,
    is_active: item.isActive !== false,
  })),
  values: (ap.mvpCards || []).map((card, index) => ({
    id: card.id,
    title: card.title || '',
    description: card.description || '',
    icon: card.icon || 'FiTarget',
    display_order: card.displayOrder ?? index + 1,
    is_active: card.isActive !== false,
  })),
  offers: (ap.offerings || []).map((item, index) => ({
    id: item.id,
    title: item.title || '',
    description: item.description || '',
    image: item.image || '',
    display_order: item.displayOrder ?? index + 1,
    is_active: item.isActive !== false,
  })),
  statistics: (ap.stats || []).map((stat, index) => ({
    id: stat.id,
    title: stat.label || '',
    value: Number(stat.value) || 0,
    suffix: stat.suffix || '',
    icon: stat.icon || 'FiUsers',
    display_order: stat.displayOrder ?? index + 1,
    is_active: stat.isActive !== false,
  })),
  owner: {
    owner_name: ap.owner?.name || '',
    designation: ap.owner?.designation || '',
    quote: ap.owner?.quote || '',
    phone: ap.owner?.phone || '',
    address: ap.owner?.location || '',
    since_year: ap.owner?.sinceYear || '2022',
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
    const data = await apiRequest(() => api.get('/about'));
    return mapModulePageToFrontend(data);
  },

  getAboutUsAdmin: async () => {
    const data = await apiRequest(() => api.get('/about/admin'));
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
