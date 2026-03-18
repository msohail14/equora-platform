import axiosInstance from '../../lib/axiosInstance';

export const loginAdminApi = (payload) =>
  axiosInstance.post('/admin/login', payload);

export const forgotPasswordAdminApi = (payload) =>
  axiosInstance.post('/admin/forgot-password', payload);

export const resendResetTokenAdminApi = (payload) =>
  axiosInstance.post('/admin/resend-reset-token', payload);

export const resetPasswordAdminApi = (payload) =>
  axiosInstance.post('/admin/reset-password', payload);

export const changePasswordAdminApi = (payload) =>
  axiosInstance.post('/admin/change-password', payload);

export const changeProfileAdminApi = (payload) =>
  axiosInstance.put('/admin/change-profile', payload);

export const submitStableRegistrationApi = (payload) =>
  axiosInstance.post('/admin/stable-registrations', payload);
