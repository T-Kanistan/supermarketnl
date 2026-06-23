import api, { apiRequest } from './api';

const normalizeStatus = (status) => {
  if (!status) return 'active';
  const lower = String(status).toLowerCase();
  return ['active', 'inactive', 'draft'].includes(lower) ? lower : 'active';
};

const mapAdminToForm = (data) => ({
  id: data.id,
  useAboutUsPageContent: data.useAboutUsPageContent ?? data.useAboutUsContent ?? false,
  useAboutUsContent: data.useAboutUsPageContent ?? data.useAboutUsContent ?? false,
  sectionHeading: data.sectionHeading || '',
  shortDescription: data.shortDescription || '',
  buttonText: data.buttonText || 'Learn More',
  buttonLink: data.buttonLink || '/about',
  aboutImage: data.aboutImage || '',
  status: normalizeStatus(data.status),
  resolvedContent: data.resolvedContent || null,
});

const toPayload = (formData) => ({
  useAboutUsPageContent: formData.useAboutUsPageContent ?? formData.useAboutUsContent ?? false,
  sectionHeading: formData.sectionHeading,
  shortDescription: formData.shortDescription,
  buttonText: formData.buttonText,
  buttonLink: formData.buttonLink,
  aboutImage: formData.aboutImage,
  status: normalizeStatus(formData.status),
});

export const homepageAboutService = {
  getStorefrontAbout: async () => apiRequest(() => api.get('/storefront/homepage-about')),

  getHomepageAbout: async () => homepageAboutService.getStorefrontAbout(),

  getActiveAbout: async () => apiRequest(() => api.get('/homepage-about/active')),

  getAdminHomepageAbout: async () => {
    const data = await apiRequest(() => api.get('/homepage-about/admin'));
    return mapAdminToForm(data);
  },

  getAllSections: async () => apiRequest(() => api.get('/homepage-about')),

  getPreview: async (id) => apiRequest(() => api.get(`/homepage-about/preview/${id}`)),

  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/upload/homepage-about', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.imageUrl;
  },

  createSection: async (formData) => {
    const data = await apiRequest(() => api.post('/homepage-about', toPayload(formData)));
    return mapAdminToForm(data);
  },

  updateHomepageAbout: async (formData) => {
    const payload = toPayload(formData);
    const useAboutUs = payload.useAboutUsPageContent === true;

    if (!useAboutUs) {
      const errors = [];
      if (!payload.sectionHeading?.trim()) errors.push('Section heading is required');
      if (!payload.shortDescription?.trim()) errors.push('Short description is required');
      if (!payload.buttonText?.trim()) errors.push('Button text is required');
      if (!payload.buttonLink?.trim()) errors.push('Button link is required');
      if (!payload.aboutImage?.trim()) errors.push('About image is required');
      if (errors.length) {
        const error = new Error(errors.join('. '));
        error.validationErrors = errors;
        throw error;
      }
    }

    let aboutImage = payload.aboutImage || '';
    if (aboutImage.startsWith('blob:')) {
      throw new Error('Please wait for image upload to finish');
    }

    if (formData.id) {
      const data = await apiRequest(() => api.put(`/homepage-about/${formData.id}`, payload));
      return mapAdminToForm(data);
    }

    const data = await apiRequest(() => api.put('/homepage-about', payload));
    return mapAdminToForm(data);
  },

  deleteSection: async (id) => apiRequest(() => api.delete(`/homepage-about/${id}`)),
};

export default homepageAboutService;
