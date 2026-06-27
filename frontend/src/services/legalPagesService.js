import api, { apiRequest } from './api';
import { mergeLegalPages } from '../constants/legalPageDefaults';

export const legalPagesService = {
  getLegalPages: async () => {
    const data = await apiRequest(() => api.get('/legal-pages'));
    return mergeLegalPages(data);
  },

  getLegalPage: async (slug) => {
    const pages = await legalPagesService.getLegalPages();
    return slug === 'privacy' ? pages.privacy : pages.terms;
  },

  updateLegalPages: async (formData) => {
    const payload = {
      terms: {
        title: formData.terms.title,
        lastUpdated: formData.terms.lastUpdated,
        sections: formData.terms.sections,
      },
      privacy: {
        title: formData.privacy.title,
        lastUpdated: formData.privacy.lastUpdated,
        sections: formData.privacy.sections,
      },
    };
    const data = await apiRequest(() => api.put('/legal-pages', payload));
    return mergeLegalPages(data);
  },
};

export default legalPagesService;
