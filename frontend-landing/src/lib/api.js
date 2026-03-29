import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'https://equestrian-platform-production.up.railway.app/api/v1';

const api = axios.create({ baseURL: API_BASE });

// Auth
export const verifyFirebaseToken = (data) => api.post('/auth/firebase/verify', data).then(r => r.data);
export const bypassOtp = (data) => api.post('/auth/firebase/bypass-otp', data).then(r => r.data);
export const sendMagicLink = (data) => api.post('/auth/magic-link/send', data).then(r => r.data);

// Onboarding
export const onboardStable = (token, data) =>
  api.post('/onboarding/stable', data, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data);
export const stableSetupWizard = (token, data) =>
  api.put('/onboarding/stable/setup', data, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data);
export const onboardCoach = (token, data) =>
  api.post('/onboarding/coach', data, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data);

// Invitations
export const acceptInvitation = (token, data) => api.post(`/invitations/accept/${token}`, data).then(r => r.data);

export default api;
