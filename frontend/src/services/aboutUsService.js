import api, { apiRequest } from './api';

const isMongoId = (id) => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id);

const mapTimeline = (items = []) =>
  items.map((item) => ({
    id: String(item.id),
    marker: item.marker || '',
    title: item.title || '',
    description: item.description || '',
    icon: item.icon || 'FiCalendar',
    displayOrder: item.displayOrder ?? 0,
    isActive: item.isActive !== false,
    isDeleted: item.isDeleted === true,
  }));

const mapMvpCards = (cards = []) =>
  cards.map((card) => ({
    id: String(card.id),
    title: card.title || '',
    icon: card.icon || 'FiTarget',
    description: card.description || '',
    displayOrder: card.displayOrder ?? 0,
    isActive: card.isActive !== false,
    isDeleted: card.isDeleted === true,
  }));

const mapOffers = (offers = []) =>
  offers.map((o) => ({
    id: String(o.id),
    title: o.categoryName,
    description: o.description,
    image: o.imageUrl || '',
    displayOrder: o.displayOrder ?? 0,
    isActive: o.isActive !== false,
    isDeleted: o.isDeleted === true,
  }));

const mapStats = (stats = []) =>
  stats.map((s) => ({
    id: String(s.id),
    value: s.value,
    suffix: s.suffix,
    label: s.label,
    icon: s.icon || 'FiUsers',
    displayOrder: s.displayOrder ?? 0,
    isActive: s.isActive !== false,
    isDeleted: s.isDeleted === true,
  }));

export const mapApiToFrontend = (data) => {
  if (!data) return null;

  const hero = data.heroSection || {};
  const story = data.storySection || {};
  const mvp = data.missionVisionPromise || {};
  const owner = data.ownerDetails || {};

  return {
    aboutUs: data.homepageShortDescription || '',
    aboutSection: {
      buttonText: data.homepageAboutSection?.buttonText || '',
      bulletPoints: data.homepageAboutSection?.features || [],
      image: data.homepageAboutSection?.image || '',
    },
    aboutPage: {
      heroEyebrow: hero.eyebrowTag || '',
      heroHeading: hero.pageHeading || '',
      heroHighlight: hero.highlightedWord || '',
      heroDescription: hero.description || '',
      heroParagraphs: hero.descriptionParagraphs?.length ? hero.descriptionParagraphs : [],
      heroBadge: hero.imageBadgeText || '',
      heroImage: hero.heroImage || '',
      button1Text: hero.button1Text || 'Explore Products',
      button1Url: hero.button1Url || '/products',
      button2Text: hero.button2Text || 'Contact Us',
      button2Url: hero.button2Url || '/contact',
      heroDisplayOrder: hero.displayOrder ?? 1,
      heroIsActive: hero.isActive !== false,
      storyTitle: story.title || '',
      storyDescription: story.description || '',
      storyImage: story.image || '',
      storyTimeline: mapTimeline(data.storyTimeline),
      missionTitle: mvp.missionTitle || '',
      missionDescription: mvp.missionDescription || '',
      visionTitle: mvp.visionTitle || '',
      visionDescription: mvp.visionDescription || '',
      promiseTitle: mvp.promiseTitle || '',
      promiseDescription: mvp.promiseDescription || '',
      mvpCards: mapMvpCards(data.mvpCards),
      stats: mapStats(data.statistics),
      offerings: mapOffers(data.whatWeOffer),
      owner: {
        name: owner.ownerName || '',
        designation: owner.designation || '',
        phone: owner.phoneNumber || '',
        location: owner.location || '',
        badge: owner.badgeText || '',
        quote: owner.ownerQuote || '',
        photo: owner.ownerPhoto || '',
        sinceYear: owner.sinceYear || '2022',
        yearsServing: owner.experienceText || '',
        isActive: owner.isActive !== false,
      },
    },
    raw: data,
  };
};

const dataUrlToFile = async (dataUrl, filename) => {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || 'image/png' });
};

const uploadImageIfNeeded = async (endpoint, value, filename) => {
  if (!value || !value.startsWith('data:image')) return value || '';
  const file = await dataUrlToFile(value, filename);
  const formData = new FormData();
  formData.append('image', file);
  const result = await apiRequest(() =>
    api.post(endpoint, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
  );
  return result.imageUrl || value;
};

export const buildUpdatePayload = (ap = {}, imageUrls = {}) => {
  const owner = ap.owner || {};
  return {
    heroSection: {
      eyebrowTag: ap.heroEyebrow || '',
      pageHeading: ap.heroHeading || '',
      highlightedWord: ap.heroHighlight || '',
      description: ap.heroDescription || '',
      descriptionParagraphs: ap.heroParagraphs || [],
      button1Text: ap.button1Text || 'Explore Products',
      button1Url: ap.button1Url || '/products',
      button2Text: ap.button2Text || 'Contact Us',
      button2Url: ap.button2Url || '/contact',
      imageBadgeText: ap.heroBadge || '',
      heroImage: imageUrls.hero || ap.heroImage || '',
      displayOrder: ap.heroDisplayOrder ?? 1,
      isActive: ap.heroIsActive !== false,
    },
    storySection: {
      title: ap.storyTitle || '',
      description: ap.storyDescription || '',
      image: imageUrls.story || ap.storyImage || '',
    },
    storyTimeline: (ap.storyTimeline || []).map((item, index) => ({
      ...(isMongoId(item.id) ? { id: item.id } : {}),
      marker: item.marker || '',
      title: item.title || '',
      description: item.description || '',
      icon: item.icon || 'FiCalendar',
      displayOrder: item.displayOrder ?? index + 1,
      isActive: item.isActive !== false,
      isDeleted: item.isDeleted === true,
    })),
    mvpCards: (ap.mvpCards || []).map((card, index) => ({
      ...(isMongoId(card.id) ? { id: card.id } : {}),
      title: card.title || '',
      icon: card.icon || 'FiTarget',
      description: card.description || '',
      displayOrder: card.displayOrder ?? index + 1,
      isActive: card.isActive !== false,
      isDeleted: card.isDeleted === true,
    })),
    missionVisionPromise: {
      missionTitle: ap.missionTitle || '',
      missionDescription: ap.missionDescription || '',
      visionTitle: ap.visionTitle || '',
      visionDescription: ap.visionDescription || '',
      promiseTitle: ap.promiseTitle || '',
      promiseDescription: ap.promiseDescription || '',
    },
    whatWeOffer: (ap.offerings || []).map((item, index) => ({
      ...(isMongoId(item.id) ? { id: item.id } : {}),
      categoryName: item.title || '',
      description: item.description || '',
      imageUrl: item.image || '',
      displayOrder: item.displayOrder ?? index + 1,
      isActive: item.isActive !== false,
      isDeleted: item.isDeleted === true,
    })),
    statistics: (ap.stats || []).map((stat, index) => ({
      ...(isMongoId(stat.id) ? { id: stat.id } : {}),
      value: Number(stat.value) || 0,
      suffix: stat.suffix || '',
      label: stat.label || '',
      icon: stat.icon || 'FiUsers',
      displayOrder: stat.displayOrder ?? index + 1,
      isActive: stat.isActive !== false,
      isDeleted: stat.isDeleted === true,
    })),
    ownerDetails: {
      ownerName: owner.name || '',
      designation: owner.designation || '',
      phoneNumber: owner.phone || '',
      location: owner.location || '',
      badgeText: owner.badge || '',
      ownerQuote: owner.quote || '',
      ownerPhoto: imageUrls.owner || owner.photo || '',
      sinceYear: owner.sinceYear || '2022',
      experienceText: owner.yearsServing || '',
      isActive: owner.isActive !== false,
    },
  };
};

export const aboutUsService = {
  getAboutUs: async () => {
    const data = await apiRequest(() => api.get('/about-us'));
    return mapApiToFrontend(data);
  },

  getAboutUsAdmin: async () => {
    const data = await apiRequest(() => api.get('/about-us/admin'));
    return mapApiToFrontend(data);
  },

  updateAboutUs: async (formDataOrPage, imageUrls = {}) => {
    const aboutPage = formDataOrPage?.aboutPage || formDataOrPage;
    const data = await apiRequest(() => api.put('/about-us', buildUpdatePayload(aboutPage, imageUrls)));
    return mapApiToFrontend(data);
  },

  uploadHeroImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const result = await apiRequest(() =>
      api.post('/about-us/upload/hero-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    );
    return result.imageUrl;
  },

  uploadStoryImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const result = await apiRequest(() =>
      api.post('/about-us/upload/story-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    );
    return result.imageUrl;
  },

  uploadOwnerPhoto: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const result = await apiRequest(() =>
      api.post('/about-us/upload/owner-photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    );
    return result.imageUrl;
  },

  uploadOfferImage: async (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiRequest(() =>
      api.post(`/about-us/offers/${id}/image`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    );
  },

  reorderOffers: async (orders) =>
    apiRequest(() => api.put('/about-us/offers/reorder', { orders })),

  reorderStatistics: async (orders) =>
    apiRequest(() => api.put('/about-us/statistics/reorder', { orders })),

  reorderTimeline: async (orders) =>
    apiRequest(() => api.put('/about-us/timeline/reorder', { orders })),

  reorderMvpCards: async (orders) =>
    apiRequest(() => api.put('/about-us/mvp-cards/reorder', { orders })),

  createOffer: async (body) => apiRequest(() => api.post('/about-us/offers', body)),
  updateOffer: async (id, body) => apiRequest(() => api.put(`/about-us/offers/${id}`, body)),
  deleteOffer: async (id) => apiRequest(() => api.delete(`/about-us/offers/${id}`)),

  createStatistic: async (body) => apiRequest(() => api.post('/about-us/statistics', body)),
  updateStatistic: async (id, body) => apiRequest(() => api.put(`/about-us/statistics/${id}`, body)),
  deleteStatistic: async (id) => apiRequest(() => api.delete(`/about-us/statistics/${id}`)),

  createTimelineItem: async (body) => apiRequest(() => api.post('/about-us/timeline', body)),
  updateTimelineItem: async (id, body) => apiRequest(() => api.put(`/about-us/timeline/${id}`, body)),
  deleteTimelineItem: async (id) => apiRequest(() => api.delete(`/about-us/timeline/${id}`)),

  createMvpCard: async (body) => apiRequest(() => api.post('/about-us/mvp-cards', body)),
  updateMvpCard: async (id, body) => apiRequest(() => api.put(`/about-us/mvp-cards/${id}`, body)),
  deleteMvpCard: async (id) => apiRequest(() => api.delete(`/about-us/mvp-cards/${id}`)),
};

export default aboutUsService;
