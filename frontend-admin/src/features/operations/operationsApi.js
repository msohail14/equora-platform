import axiosInstance from '../../lib/axiosInstance';

const buildListQuery = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });
  return query.toString();
};

const toFormData = (payload, fileFieldName, file) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, value);
    }
  });
  if (file) {
    formData.append(fileFieldName, file);
  }
  return formData;
};

export const getStablesApi = ({ include_inactive = true, page = 1, limit = 10, search } = {}) => {
  const query = buildListQuery({ include_inactive, page, limit, search });
  return axiosInstance.get(`/stables?${query}`);
};
export const getStableByIdApi = (stableId) => axiosInstance.get(`/stables/${stableId}`);
export const createStableApi = ({ payload, logoFile }) =>
  axiosInstance.post('/stables', toFormData(payload, 'logo_image', logoFile), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const updateStableApi = ({ stableId, payload, logoFile }) =>
  axiosInstance.put(`/stables/${stableId}`, toFormData(payload, 'logo_image', logoFile), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const deleteStableApi = (stableId) => axiosInstance.delete(`/stables/${stableId}`);

export const getArenasByStableApi = (stableId, { page = 1, limit = 10, search } = {}) => {
  const query = buildListQuery({ stable_id: stableId, page, limit, search });
  return axiosInstance.get(`/arenas?${query}`);
};
export const getAllArenasApi = ({ page = 1, limit = 10, search } = {}) => {
  const query = buildListQuery({ page, limit, search });
  return axiosInstance.get(`/arenas/all?${query}`);
};
export const createArenaApi = ({ payload, imageFile }) =>
  axiosInstance.post('/arenas', toFormData(payload, 'image', imageFile), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const updateArenaApi = ({ arenaId, payload, imageFile }) =>
  axiosInstance.put(`/arenas/${arenaId}`, toFormData(payload, 'image', imageFile), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const deleteArenaApi = (arenaId) => axiosInstance.delete(`/arenas/${arenaId}`);

export const getHorsesByStableApi = (stableId, { page = 1, limit = 10, search } = {}) => {
  const query = buildListQuery({ stable_id: stableId, page, limit, search });
  return axiosInstance.get(`/horses?${query}`);
};
export const getAllHorsesApi = ({ page = 1, limit = 10, search } = {}) => {
  const query = buildListQuery({ page, limit, search });
  return axiosInstance.get(`/horses/all?${query}`);
};
export const createHorseApi = ({ payload, imageFile }) =>
  axiosInstance.post('/horses', toFormData(payload, 'profile_image', imageFile), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const updateHorseApi = ({ horseId, payload, imageFile }) =>
  axiosInstance.put(`/horses/${horseId}`, toFormData(payload, 'profile_image', imageFile), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const deleteHorseApi = (horseId) => axiosInstance.delete(`/horses/${horseId}`);

export const getDisciplinesApi = ({ include_inactive = true, page = 1, limit = 10, search } = {}) => {
  const query = buildListQuery({ include_inactive, page, limit, search });
  return axiosInstance.get(`/disciplines?${query}`);
};
export const getDisciplineByIdApi = (disciplineId) => axiosInstance.get(`/disciplines/${disciplineId}`);
export const createDisciplineApi = ({ payload, iconFile }) =>
  axiosInstance.post('/disciplines', toFormData(payload, 'icon_image', iconFile), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const updateDisciplineApi = ({ disciplineId, payload, iconFile }) =>
  axiosInstance.put(`/disciplines/${disciplineId}`, toFormData(payload, 'icon_image', iconFile), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const deleteDisciplineApi = (disciplineId) => axiosInstance.delete(`/disciplines/${disciplineId}`);

export const getCoachesApi = ({ include_inactive = true, page = 1, limit = 10, search } = {}) => {
  const query = buildListQuery({ include_inactive, page, limit, search });
  return axiosInstance.get(`/coaches?${query}`);
};
export const getCoachByIdApi = (coachId) => axiosInstance.get(`/coaches/${coachId}`);
export const getCoachDetailsApi = (coachId, { page = 1, limit = 10 } = {}) =>
  axiosInstance.get(`/coaches/${coachId}/details?page=${page}&limit=${limit}`);
export const getCoachSummaryApi = (coachId) => axiosInstance.get(`/coaches/${coachId}/summary`);
export const getCoachCoursesApi = (coachId) => axiosInstance.get(`/coaches/${coachId}/courses`);
export const getCoachSessionsApi = (coachId, { page = 1, limit = 10 } = {}) =>
  axiosInstance.get(`/coaches/${coachId}/sessions?page=${page}&limit=${limit}`);
export const getCoachWeeklyAvailabilityByAdminApi = (coachId, { include_inactive = true } = {}) =>
  axiosInstance.get(`/coaches/${coachId}/weekly-availability?include_inactive=${include_inactive}`);
export const getCoachUpcomingAvailabilityApi = (coachId, { days = 7, from_date } = {}) => {
  const query = buildListQuery({ days, from_date });
  return axiosInstance.get(`/coaches/${coachId}/upcoming-availability?${query}`);
};
export const createCoachApi = (payload) => axiosInstance.post('/coaches', payload);
export const updateCoachApi = ({ coachId, payload }) => axiosInstance.put(`/coaches/${coachId}`, payload);
export const createCoachWeeklyAvailabilityByAdminApi = ({ coachId, payload }) =>
  axiosInstance.post(`/coaches/${coachId}/weekly-availability`, payload);
export const updateCoachWeeklyAvailabilityByAdminApi = ({ coachId, availabilityId, payload }) =>
  axiosInstance.put(`/coaches/${coachId}/weekly-availability/${availabilityId}`, payload);
export const deleteCoachWeeklyAvailabilityByAdminApi = ({ coachId, availabilityId }) =>
  axiosInstance.delete(`/coaches/${coachId}/weekly-availability/${availabilityId}`);
export const getCoachReviewsApi = (coachId, { page = 1, limit = 20 } = {}) =>
  axiosInstance.get(`/coach-reviews/coach/${coachId}?page=${page}&limit=${limit}`);
export const createCoachReviewApi = (payload) => axiosInstance.post('/coach-reviews', payload);
export const updateCoachReviewApi = ({ reviewId, payload }) => axiosInstance.put(`/coach-reviews/${reviewId}`, payload);
export const deleteCoachReviewApi = (reviewId) => axiosInstance.delete(`/coach-reviews/${reviewId}`);

export const getCoursesApi = ({ include_inactive = true, page = 1, limit = 10, search, coach_id, status } = {}) => {
  const query = buildListQuery({ include_inactive, page, limit, search, coach_id, status });
  return axiosInstance.get(`/courses?${query}`);
};
export const getCourseByIdApi = (courseId) => axiosInstance.get(`/courses/${courseId}`);
export const createCourseByAdminApi = ({ payload, imageFile }) =>
  axiosInstance.post('/courses/admin', toFormData(payload, 'thumbnail_image', imageFile), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const updateCourseByAdminApi = ({ courseId, payload, imageFile }) =>
  axiosInstance.put(`/courses/admin/${courseId}`, toFormData(payload, 'thumbnail_image', imageFile), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const getCourseEnrollmentsApi = (courseId) => axiosInstance.get(`/enrollments/course/${courseId}`);
export const getAllEnrollmentsApi = () => axiosInstance.get('/enrollments/all');
export const bulkEnrollRidersByAdminApi = ({ course_id, rider_ids }) =>
  axiosInstance.post('/enrollments/admin/bulk', { course_id, rider_ids });
export const getCourseSessionsApi = (courseId, { page = 1, limit = 10, rider_id, status } = {}) => {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (rider_id) query.set('rider_id', String(rider_id));
  if (status) query.set('status', String(status));
  return axiosInstance.get(`/sessions/course/${courseId}?${query.toString()}`);
};
export const createCourseSessionApi = (payload) => axiosInstance.post('/sessions', payload);
export const updateCourseSessionApi = ({ sessionId, payload }) => axiosInstance.put(`/sessions/${sessionId}`, payload);
export const cancelCourseSessionApi = ({ sessionId, cancel_reason }) =>
  axiosInstance.patch(`/sessions/${sessionId}/cancel`, { cancel_reason });

export const getRidersApi = ({ page = 1, limit = 10, search } = {}) => {
  const query = buildListQuery({ page, limit, search });
  return axiosInstance.get(`/riders?${query}`);
};
export const createRiderApi = (payload) => axiosInstance.post('/riders', payload);
export const getRiderDetailsApi = (riderId) => axiosInstance.get(`/riders/${riderId}`);
export const getRiderStatsApi = (riderId) => axiosInstance.get(`/riders/${riderId}/stats`);
export const getRiderSessionsApi = (riderId, { page = 1, limit = 10 } = {}) =>
  axiosInstance.get(`/riders/${riderId}/sessions?page=${page}&limit=${limit}`);
export const updateRiderApi = ({ riderId, payload }) => axiosInstance.put(`/riders/${riderId}`, payload);
export const updateRiderStatusApi = ({ riderId, is_active }) =>
  axiosInstance.put(`/riders/${riderId}/status`, { is_active });

export const getAdminDashboardApi = () => axiosInstance.get('/admin/dashboard');
