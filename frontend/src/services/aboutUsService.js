import api, { apiRequest } from './api';

const isMongoId = (id) => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id);

const mapApiToFrontend = (data) => {
  if (!data) return null;

  const offers = (data.whatWeOffer || []).map((o) => ({
    id: String(o.id),
    title: o.categoryName,
    description: o.description,
    image: o.imageUrl || '',
    order: o.displayOrder,
    isActive: o.isActive !== false,
  }));

  const stats = (data.statistics || []).map((s) => ({
    id: String(s.id),
    value: s.value,
    suffix: s.suffix,
    label: s.label,
    displayOrder: s.displayOrder,
  }));

  return {
    aboutUs: data.homepageShortDescription || '',
    aboutSection: {
      buttonText: data.homepageAboutSection?.buttonText || '',
      bulletPoints: data.homepageAboutSection?.features || [],
      image: data.homepageAboutSection?.image || '',
    },
    aboutPage: {
      heroEyebrow: data.heroSection?.eyebrowTag || '',
      heroHeading: data.heroSection?.pageHeading || '',
      heroHighlight: data.heroSection?.highlightedWord || '',
      heroDescription: data.heroSection?.description || '',
      heroBadge: data.heroSection?.imageBadgeText || '',
      heroImage: data.heroSection?.heroImage || '',
      storyTitle: data.storySection?.title || '',
      storyDescription: data.storySection?.description || '',
      storyImage: data.storySection?.image || '',
      missionTitle: data.missionVisionPromise?.missionTitle || '',
      missionDescription: data.missionVisionPromise?.missionDescription || '',
      visionTitle: data.missionVisionPromise?.visionTitle || '',
      visionDescription: data.missionVisionPromise?.visionDescription || '',
      promiseTitle: data.missionVisionPromise?.promiseTitle || '',
      promiseDescription: data.missionVisionPromise?.promiseDescription || '',
      stats,
      offerings: offers,
      owner: {
        name: data.ownerDetails?.ownerName || '',
        designation: data.ownerDetails?.designation || '',
        phone: data.ownerDetails?.phoneNumber || '',
        location: data.ownerDetails?.location || '',
        badge: data.ownerDetails?.badgeText || '',
        quote: data.ownerDetails?.ownerQuote || '',
        photo: data.ownerDetails?.ownerPhoto || '',
      },
    },
    offersAdmin: data.whatWeOffer || [],
    statisticsAdmin: data.statistics || [],
  };
};

const dataUrlToFile = async (dataUrl, filename) => {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || 'image/png' });
};

const uploadImageIfNeeded = async (endpoint, value, filename) => {
  if (!value || !value.startsWith('data:image')) {
    return value || '';
  }
  const file = await dataUrlToFile(value, filename);
  const formData = new FormData();
  formData.append('image', file);
  const result = await apiRequest(() =>
    api.post(endpoint, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
  );
  return result.imageUrl || value;
};

const buildUpdatePayload = (formData, imageUrls = {}) => {
  const ap = formData.aboutPage || {};
  const owner = ap.owner || {};

  return {
    heroSection: {
      eyebrowTag: ap.heroEyebrow || '',
      pageHeading: ap.heroHeading || '',
      highlightedWord: ap.heroHighlight || '',
      description: ap.heroDescription || '',
      imageBadgeText: ap.heroBadge || '',
      heroImage: imageUrls.hero || ap.heroImage || '',
    },
    storySection: {
      title: ap.storyTitle || '',
      description: ap.storyDescription || '',
      image: imageUrls.story || ap.storyImage || '',
    },
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
      displayOrder: index + 1,
      isActive: item.isActive !== false,
    })),
    statistics: (ap.stats || []).map((stat, index) => ({
      ...(isMongoId(stat.id) ? { id: stat.id } : {}),
      value: Number(stat.value) || 0,
      suffix: stat.suffix || '',
      label: stat.label || '',
      displayOrder: stat.displayOrder ?? index + 1,
    })),
    ownerDetails: {
      ownerName: owner.name || '',
      designation: owner.designation || '',
      phoneNumber: owner.phone || '',
      location: owner.location || '',
      badgeText: owner.badge || '',
      ownerQuote: owner.quote || '',
      ownerPhoto: imageUrls.owner || owner.photo || '',
    },
  };
};

const validateForm = (formData) => {
  const errors = [];
  const ap = formData.aboutPage || {};

  if (!ap.heroHeading?.trim()) errors.push('Page heading is required');
  if (!ap.storyTitle?.trim()) errors.push('Story title is required');
  if (!ap.missionTitle?.trim()) errors.push('Mission title is required');
  if (!ap.visionTitle?.trim()) errors.push('Vision title is required');
  if (!ap.owner?.name?.trim()) errors.push('Owner name is required');
  if (!ap.offerings?.length) errors.push('At least one offer is required');
  if (!ap.stats?.length) errors.push('At least one statistic is required');

  if (errors.length) {
    const error = new Error(errors.join('. '));
    error.validationErrors = errors;
    throw error;
  }
};

export const aboutUsService = {
  getAboutUs: async () => {
    const data = await apiRequest(() => api.get('/about-us'));
    return mapApiToFrontend(data);
  },

  updateAboutUs: async (formData) => {
    validateForm(formData);

    const ap = formData.aboutPage || {};
    const owner = ap.owner || {};

    const [hero, story, ownerPhoto] = await Promise.all([
      uploadImageIfNeeded('/about-us/upload/hero-image', ap.heroImage, 'hero.jpg'),
      uploadImageIfNeeded('/about-us/upload/story-image', ap.storyImage, 'story.jpg'),
      uploadImageIfNeeded('/about-us/upload/owner-photo', owner.photo, 'owner.jpg'),
    ]);

    const payload = buildUpdatePayload(formData, {
      hero,
      story,
      owner: ownerPhoto,
    });

    const data = await apiRequest(() => api.put('/about-us', payload));
    return mapApiToFrontend(data);
  },

  getOffers: async () => apiRequest(() => api.get('/about-us/offers')),

  createOffer: async (body) => apiRequest(() => api.post('/about-us/offers', body)),

  updateOffer: async (id, body) => apiRequest(() => api.put(`/about-us/offers/${id}`, body)),

  deleteOffer: async (id) => apiRequest(() => api.delete(`/about-us/offers/${id}`)),

  reorderOffers: async (orders) =>
    apiRequest(() => api.put('/about-us/offers/reorder', { orders })),

  getStatistics: async () => apiRequest(() => api.get('/about-us/statistics')),

  createStatistic: async (body) => apiRequest(() => api.post('/about-us/statistics', body)),

  updateStatistic: async (id, body) => apiRequest(() => api.put(`/about-us/statistics/${id}`, body)),

  deleteStatistic: async (id) => apiRequest(() => api.delete(`/about-us/statistics/${id}`)),
};

export default aboutUsService;
