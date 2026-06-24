import api, { apiRequest } from './api';

export const accountService = {
  getProfile: async () => apiRequest(() => api.get('/account/profile')),

  changePassword: async ({ currentPassword, newPassword, confirmPassword }) =>
    apiRequest(() =>
      api.post('/account/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      })
    ),
};

export default accountService;
