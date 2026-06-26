import api, { apiRequest } from './api';

export const accountService = {
  getProfile: async () => apiRequest(() => api.get('/account/profile')),

  updateProfile: async (profileData) =>
    apiRequest(() => api.put('/account/profile', profileData)),

  requestEmailChange: async (newEmail) =>
    apiRequest(() => api.post('/account/profile/request-email-change', { newEmail })),

  verifyEmailChange: async (otpCode) =>
    apiRequest(() => api.post('/account/profile/verify-email-change', { otpCode })),

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
