import api, { apiRequest } from './api';

const buildVacancyParams = ({ filter, sort } = {}) => {
  const params = {};
  if (filter) params.filter = filter;
  if (sort) params.sort = sort;
  return params;
};

export const vacancyService = {
  getVacancies: async ({ filter = 'all', sort } = {}) =>
    apiRequest(() => api.get('/vacancies', { params: buildVacancyParams({ filter, sort }) })),

  getVacancyById: async (id) => apiRequest(() => api.get(`/vacancies/${id}`)),
};

export default vacancyService;
