import api, { apiRequest } from './api';

const dataUrlToFile = async (dataUrl, filename) => {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || 'image/png' });
};

const mapAdminToForm = (data) => ({
  useAboutUsContent: data.useAboutUsContent !== false,
  sectionHeading: data.sectionHeading || '',
  shortDescription: data.shortDescription || '',
  buttonText: data.buttonText || 'Learn More',
  buttonLink: data.buttonLink || '/about-us',
  aboutImage: data.aboutImage || '',
  status: data.status === 'Inactive' ? 'Inactive' : 'Active',
  resolvedContent: data.resolvedContent || null,
});

export const homepageAboutService = {
  getHomepageAbout: async () => {
    return apiRequest(() => api.get('/homepage-about'));
  },

  getAdminHomepageAbout: async () => {
    const data = await apiRequest(() => api.get('/homepage-about/admin'));
    return mapAdminToForm(data);
  },

  updateHomepageAbout: async (formData) => {
    const hasNewImage = (formData.aboutImage || '').startsWith('data:image');
    const useAboutUsContent = hasNewImage ? false : formData.useAboutUsContent !== false;
    const resolved = formData.resolvedContent || {};

    const sectionHeading =
      formData.sectionHeading?.trim() || resolved.sectionHeading?.trim() || '';
    const shortDescription =
      formData.shortDescription?.trim() || resolved.shortDescription?.trim() || '';
    const buttonText = formData.buttonText?.trim() || resolved.buttonText?.trim() || '';
    const buttonLink = formData.buttonLink?.trim() || resolved.buttonLink?.trim() || '';

    const errors = [];

    if (!useAboutUsContent) {
      if (!sectionHeading) errors.push('Section heading is required');
      if (!shortDescription) errors.push('Short description is required');
      if (!buttonText) errors.push('Button text is required');
      if (!buttonLink) errors.push('Button link is required');
    }

    if (errors.length) {
      const error = new Error(errors.join('. '));
      error.validationErrors = errors;
      throw error;
    }

    let aboutImage = formData.aboutImage || '';

    if (aboutImage.startsWith('data:image')) {
      const file = await dataUrlToFile(aboutImage, 'homepage-about.jpg');
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);
      const uploadResult = await apiRequest(() =>
        api.post('/homepage-about/upload-image', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );
      aboutImage = uploadResult.aboutImage || uploadResult.imageUrl || aboutImage;
    }

    const payload = {
      useAboutUsContent,
      sectionHeading,
      shortDescription,
      features: [],
      buttonText,
      buttonLink,
      aboutImage,
      status: formData.status === 'Inactive' ? 'Inactive' : 'Active',
    };

    const data = await apiRequest(() => api.put('/homepage-about', payload));
    return mapAdminToForm(data);
  },

  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiRequest(() =>
      api.post('/homepage-about/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
  },
};

export default homepageAboutService;
