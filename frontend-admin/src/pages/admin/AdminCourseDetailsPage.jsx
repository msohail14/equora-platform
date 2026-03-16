import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ImagePlus, Pencil, Plus, Loader2 } from 'lucide-react';
import AppButton from '../../components/ui/AppButton';
import Modal from '../../components/ui/Modal';
import FormInput from '../../components/ui/FormInput';
import ImageCropperModal from '../../components/ui/ImageCropperModal';
import {
  bulkEnrollRidersByAdminApi,
  cancelCourseSessionApi,
  createCourseSessionApi,
  getCourseByIdApi,
  getCourseEnrollmentsApi,
  getRidersApi,
  getCourseSessionsApi,
  getCoachUpcomingAvailabilityApi,
  getStablesApi,
  updateCourseByAdminApi,
  updateCourseSessionApi,
} from '../../features/operations/operationsApi';
import { API_BASE_URL } from '../../lib/axiosInstance';

const CourseOverviewCard = lazy(() => import('../../components/admin/courses/CourseOverviewCard'));
const CourseEnrollmentsTable = lazy(() => import('../../components/admin/courses/CourseEnrollmentsTable'));
const CourseSessionsTable = lazy(() => import('../../components/admin/courses/CourseSessionsTable'));
const CourseSessionFormModal = lazy(() => import('../../components/admin/courses/CourseSessionFormModal'));

const COURSE_CROP_ASPECT_OPTIONS = [{ key: 'landscape', label: 'Landscape (16:9)', aspect: 16 / 9 }];
const allowedImageTypes = ['image/png', 'image/jpeg', 'image/jpg'];
const maxImageSize = 3 * 1024 * 1024;
const uploadBaseUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

const toImageSrc = (value) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `${uploadBaseUrl}${value}`;
};

const emptySessionForm = {
  rider_id: '',
  session_date: '',
  start_time: '',
  end_time: '',
};

const emptyCourseEditForm = {
  title: '',
  description: '',
  course_type: 'one_to_one',
  duration_days: '',
  max_session_duration: '',
  start_date: '',
  end_date: '',
  start_time: '',
  end_time: '',
  total_sessions: '',
  max_enrollment: '',
  price: '',
  status: 'draft',
  is_active: true,
  stable_id: '',
};

/* ── Shared style helpers ── */
const selectCls =
  'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';
const labelSpanCls =
  'text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500';

/* ── Skeleton card used while lazy chunks load ── */
const SkeletonCard = ({ label }) => (
  <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
    <div className="h-4 w-32 rounded bg-gray-100 dark:bg-gray-800" />
    <p className="mt-2 text-xs text-gray-400">{label}</p>
  </div>
);

const AdminCourseDetailsPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionsPagination, setSessionsPagination] = useState(null);
  const [sessionPage, setSessionPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const [showSessionModal, setShowSessionModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [sessionForm, setSessionForm] = useState(emptySessionForm);
  const [submittingSession, setSubmittingSession] = useState(false);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [savingCourseEdit, setSavingCourseEdit] = useState(false);
  const [courseEditForm, setCourseEditForm] = useState(emptyCourseEditForm);
  const [courseThumbnailFile, setCourseThumbnailFile] = useState(null);
  const [courseThumbnailPreview, setCourseThumbnailPreview] = useState('');
  const [courseCropSourceFile, setCourseCropSourceFile] = useState(null);
  const [isCourseCropperOpen, setIsCourseCropperOpen] = useState(false);

  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [activeRiders, setActiveRiders] = useState([]);
  const [stables, setStables] = useState([]);
  const [selectedRiderIds, setSelectedRiderIds] = useState([]);
  const [enrolling, setEnrolling] = useState(false);

  const isOneToOne = useMemo(() => course?.course_type === 'one_to_one', [course?.course_type]);

  const enrolledRiders = useMemo(
    () => enrollments.filter((item) => item.status === 'active' && item.rider?.id),
    [enrollments]
  );

  const notEnrolledActiveRiders = useMemo(() => {
    const enrolledIds = new Set(enrolledRiders.map((item) => Number(item.rider?.id)));
    return activeRiders.filter((rider) => !enrolledIds.has(Number(rider.id)));
  }, [activeRiders, enrolledRiders]);

  const allSelected =
    notEnrolledActiveRiders.length > 0 &&
    selectedRiderIds.length === notEnrolledActiveRiders.length;

  const fetchSessions = useCallback(
    async (page = 1) => {
      if (!courseId) return;
      setSessionsLoading(true);
      try {
        const data = await getCourseSessionsApi(courseId, { page, limit: 10 });
        setSessions(Array.isArray(data?.sessions) ? data.sessions : []);
        setSessionsPagination(data?.pagination || null);
      } catch (error) {
        toast.error(error.message || 'Failed to load sessions.');
      } finally {
        setSessionsLoading(false);
      }
    },
    [courseId]
  );

  const fetchDetails = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const [courseData, enrollmentData, stableData] = await Promise.all([
        getCourseByIdApi(courseId),
        getCourseEnrollmentsApi(courseId),
        getStablesApi({ include_inactive: true, page: 1, limit: 200 }),
      ]);
      setCourse(courseData || null);
      setEnrollments(Array.isArray(enrollmentData) ? enrollmentData : []);
      setStables(
        Array.isArray(stableData?.data)
          ? stableData.data.filter((item) => item.is_active !== false)
          : []
      );
    } catch (error) {
      toast.error(error.message || 'Failed to load course details.');
      navigate('/admin/courses');
    } finally {
      setLoading(false);
    }
  }, [courseId, navigate]);

  useEffect(() => { fetchDetails(); }, [fetchDetails]);
  useEffect(() => { fetchSessions(sessionPage); }, [fetchSessions, sessionPage]);

  useEffect(() => {
    if (!courseThumbnailFile) { setCourseThumbnailPreview(''); return undefined; }
    const objectUrl = URL.createObjectURL(courseThumbnailFile);
    setCourseThumbnailPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [courseThumbnailFile]);

  const onSessionFormChange = useCallback((field, value) => {
    setSessionForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const openEditCourse = useCallback(() => {
    if (!course) return;
    setCourseEditForm({
      title: course.title || '',
      description: course.description || '',
      course_type: course.course_type || 'one_to_one',
      stable_id: course.stable_id ? String(course.stable_id) : course.stable?.id ? String(course.stable.id) : '',
      duration_days: course.duration_days ?? '',
      max_session_duration: course.max_session_duration ?? '',
      start_date: course.start_date || '',
      end_date: course.end_date || '',
      start_time: course.start_time ? String(course.start_time).slice(0, 5) : '',
      end_time: course.end_time ? String(course.end_time).slice(0, 5) : '',
      total_sessions: course.total_sessions ?? '',
      max_enrollment: course.max_enrollment ?? '',
      price: course.price ?? '',
      status: course.status || 'draft',
      is_active: course.is_active !== false,
    });
    setCourseThumbnailFile(null);
    setCourseThumbnailPreview('');
    setCourseCropSourceFile(null);
    setIsCourseCropperOpen(false);
    setShowEditModal(true);
  }, [course]);

  const onChangeEditCourse = useCallback((key, value) => {
    setCourseEditForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const validateCourseThumbnail = useCallback((file) => {
    if (!file) return null;
    if (!allowedImageTypes.includes(file.type)) return 'Must be PNG, JPG, or JPEG.';
    if (file.size > maxImageSize) return 'Max size is 3 MB.';
    return null;
  }, []);

  const onSelectCourseThumbnail = useCallback((file) => {
    if (!file) { setCourseThumbnailFile(null); setCourseThumbnailPreview(''); return; }
    const err = validateCourseThumbnail(file);
    if (err) { toast.error(err); return; }
    setCourseCropSourceFile(file);
    setIsCourseCropperOpen(true);
  }, [validateCourseThumbnail]);

  const onSubmitEditCourse = useCallback(async (event) => {
    event.preventDefault();
    if (!courseId) return;
    setSavingCourseEdit(true);
    try {
      const payload = {
        title: courseEditForm.title,
        description: courseEditForm.description || '',
        course_type: courseEditForm.course_type,
        stable_id: courseEditForm.stable_id === '' ? null : Number(courseEditForm.stable_id),
        duration_days: courseEditForm.duration_days === '' ? null : Number(courseEditForm.duration_days),
        max_session_duration: courseEditForm.max_session_duration === '' ? null : Number(courseEditForm.max_session_duration),
        start_date: courseEditForm.start_date || null,
        end_date: courseEditForm.end_date || null,
        start_time: courseEditForm.start_time ? `${courseEditForm.start_time}:00` : null,
        end_time: courseEditForm.end_time ? `${courseEditForm.end_time}:00` : null,
        total_sessions: courseEditForm.total_sessions === '' ? null : Number(courseEditForm.total_sessions),
        max_enrollment: courseEditForm.max_enrollment === '' ? null : Number(courseEditForm.max_enrollment),
        price: courseEditForm.price === '' ? null : Number(courseEditForm.price),
        status: courseEditForm.status,
        is_active: Boolean(courseEditForm.is_active),
      };
      await updateCourseByAdminApi({ courseId, payload, imageFile: courseThumbnailFile });
      toast.success('Course updated successfully.');
      setShowEditModal(false);
      setCourseThumbnailFile(null);
      setCourseThumbnailPreview('');
      await fetchDetails();
    } catch (error) {
      toast.error(error.message || 'Failed to update course.');
    } finally {
      setSavingCourseEdit(false);
    }
  }, [courseEditForm, courseId, courseThumbnailFile, fetchDetails]);

  const openCreateSession = useCallback(() => {
    setEditingSession(null);
    setSessionForm(emptySessionForm);
    setShowSessionModal(true);
  }, []);

  const openCreateForRider = useCallback((enrollment) => {
    setEditingSession(null);
    setSessionForm({ ...emptySessionForm, rider_id: String(enrollment?.rider?.id || '') });
    setShowSessionModal(true);
  }, []);

  const openEditSession = useCallback((session) => {
    setEditingSession(session);
    setSessionForm({
      rider_id: session?.rider_id ? String(session.rider_id) : '',
      session_date: String(session.session_date || ''),
      start_time: String(session.start_time || '').slice(0, 5),
      end_time: String(session.end_time || '').slice(0, 5),
    });
    setShowSessionModal(true);
  }, []);

  const handleSubmitSession = useCallback(async (event) => {
    event.preventDefault();
    setSubmittingSession(true);
    try {
      const payload = {
        course_id: Number(courseId),
        session_date: sessionForm.session_date,
        start_time: `${sessionForm.start_time}:00`,
        end_time: `${sessionForm.end_time}:00`,
      };
      if (isOneToOne) payload.rider_id = Number(sessionForm.rider_id);

      if (editingSession?.id) {
        await updateCourseSessionApi({
          sessionId: editingSession.id,
          payload: { session_date: payload.session_date, start_time: payload.start_time, end_time: payload.end_time },
        });
        toast.success('Session updated.');
      } else {
        await createCourseSessionApi(payload);
        toast.success('Session created.');
      }

      setShowSessionModal(false);
      setEditingSession(null);
      setSessionForm(emptySessionForm);
      await fetchSessions(sessionPage);
    } catch (error) {
      toast.error(error.message || 'Failed to save session.');
    } finally {
      setSubmittingSession(false);
    }
  }, [courseId, editingSession, fetchSessions, isOneToOne, sessionForm, sessionPage]);

  const onOpenCancelSession = useCallback((session) => {
    setCancelTarget(session);
    setCancelReason('');
    setShowCancelModal(true);
  }, []);

  const openEnrollModal = useCallback(async () => {
    try {
      const response = await getRidersApi({ page: 1, limit: 200 });
      const riderList = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      setActiveRiders(riderList.filter((item) => item.is_active));
      setSelectedRiderIds([]);
      setShowEnrollModal(true);
    } catch (error) {
      toast.error(error.message || 'Failed to load active riders.');
    }
  }, []);

  const toggleSelectAllRiders = useCallback(() => {
    if (allSelected) { setSelectedRiderIds([]); return; }
    setSelectedRiderIds(notEnrolledActiveRiders.map((r) => r.id));
  }, [allSelected, notEnrolledActiveRiders]);

  const toggleRiderSelection = useCallback((riderId) => {
    setSelectedRiderIds((prev) =>
      prev.includes(riderId) ? prev.filter((id) => id !== riderId) : [...prev, riderId]
    );
  }, []);

  const onSubmitBulkEnroll = useCallback(async () => {
    if (!courseId) return;
    if (!selectedRiderIds.length) { toast.error('Please select at least one rider.'); return; }
    setEnrolling(true);
    try {
      const response = await bulkEnrollRidersByAdminApi({ course_id: Number(courseId), rider_ids: selectedRiderIds });
      const enrolledCount = Array.isArray(response?.enrolled) ? response.enrolled.length : 0;
      const skippedCount = Array.isArray(response?.skipped) ? response.skipped.length : 0;
      toast.success(`Enrollment done. Enrolled: ${enrolledCount}, Skipped: ${skippedCount}`);
      setShowEnrollModal(false);
      setSelectedRiderIds([]);
      await fetchDetails();
    } catch (error) {
      toast.error(error.message || 'Failed to enroll riders.');
    } finally {
      setEnrolling(false);
    }
  }, [courseId, selectedRiderIds, fetchDetails]);

  const onConfirmCancelSession = useCallback(async () => {
    if (!cancelTarget?.id) return;
    if (cancelReason.trim().length < 3) { toast.error('Please add a valid cancel reason.'); return; }
    setCancelling(true);
    try {
      await cancelCourseSessionApi({ sessionId: cancelTarget.id, cancel_reason: cancelReason.trim() });
      toast.success('Session cancelled.');
      setShowCancelModal(false);
      setCancelTarget(null);
      await fetchSessions(sessionPage);
    } catch (error) {
      toast.error(error.message || 'Failed to cancel session.');
    } finally {
      setCancelling(false);
    }
  }, [cancelReason, cancelTarget, fetchSessions, sessionPage]);

  /* ── Full-page loading state ── */
  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm text-gray-400">Loading course details…</p>
        </div>
      </div>
    );
  }

  const thumbnailSrc = courseThumbnailPreview || toImageSrc(course?.thumbnail_url);

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6">

      {/* ── Top action bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AppButton type="button" variant="secondary" onClick={() => navigate('/admin/courses')}>
          <ArrowLeft size={14} className="mr-1.5" />
          Back to Courses
        </AppButton>

        <div className="flex flex-wrap gap-2">
          <AppButton type="button" variant="secondary" onClick={openEditCourse}>
            <Pencil size={13} className="mr-1.5" />
            Edit Course
          </AppButton>
          <AppButton type="button" variant="secondary" onClick={openEnrollModal}>
            <Plus size={13} className="mr-1.5" />
            Enroll Riders
          </AppButton>
          <AppButton type="button" onClick={openCreateSession}>
            <Plus size={13} className="mr-1.5" />
            Create Session
          </AppButton>
        </div>
      </div>

      {/* ── Course overview ── */}
      <Suspense fallback={<SkeletonCard label="Loading course overview…" />}>
        <CourseOverviewCard course={course} />
      </Suspense>

      {/* ── Enrollments ── */}
      <Suspense fallback={<SkeletonCard label="Loading enrollments…" />}>
        <CourseEnrollmentsTable
          enrollments={enrollments}
          isOneToOne={isOneToOne}
          onCreateForRider={openCreateForRider}
        />
      </Suspense>

      {/* ── Sessions ── */}
      <Suspense fallback={<SkeletonCard label="Loading sessions…" />}>
        <CourseSessionsTable
          sessions={sessions}
          pagination={sessionsPagination}
          loading={sessionsLoading}
          onPrev={() => setSessionPage((prev) => Math.max(1, prev - 1))}
          onNext={() => setSessionPage((prev) => prev + 1)}
          onEdit={openEditSession}
          onCancel={onOpenCancelSession}
        />
      </Suspense>

      {/* ── Session form modal ── */}
      <Suspense fallback={null}>
        <CourseSessionFormModal
          isOpen={showSessionModal}
          title={editingSession ? 'Update Session' : 'Create Session'}
          onClose={() => { setShowSessionModal(false); setEditingSession(null); }}
          form={sessionForm}
          onChange={onSessionFormChange}
          onSubmit={handleSubmitSession}
          submitting={submittingSession}
          isOneToOne={isOneToOne}
          riders={enrolledRiders}
          isEdit={Boolean(editingSession)}
          coachId={course?.coach_id || course?.coach?.id}
          loadCoachAvailability={getCoachUpcomingAvailabilityApi}
        />
      </Suspense>

      {/* ── Cancel session modal ── */}
      <Modal isOpen={showCancelModal} title="Cancel Session" onClose={() => setShowCancelModal(false)}>
        <div className="space-y-4">
          <label className="grid gap-1.5">
            <span className={labelSpanCls}>Cancel Reason</span>
            <textarea
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 resize-none"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Add reason for cancellation…"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <AppButton type="button" onClick={onConfirmCancelSession} disabled={cancelling}>
              {cancelling ? (
                <span className="flex items-center gap-1.5"><Loader2 size={13} className="animate-spin" />Cancelling…</span>
              ) : 'Confirm Cancel'}
            </AppButton>
            <AppButton type="button" variant="secondary" onClick={() => setShowCancelModal(false)}>
              Close
            </AppButton>
          </div>
        </div>
      </Modal>

      {/* ── Edit course modal ── */}
      <Modal isOpen={showEditModal} title="Update Course" onClose={() => setShowEditModal(false)}>
        <form className="space-y-5" onSubmit={onSubmitEditCourse}>

          {/* Fields grid */}
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormInput
                label="Title"
                name="course_title_edit"
                value={courseEditForm.title}
                onChange={(e) => onChangeEditCourse('title', e.target.value)}
                required
              />
            </div>

            <label className="grid gap-1.5">
              <span className={labelSpanCls}>Stable</span>
              <select className={selectCls} value={courseEditForm.stable_id}
                onChange={(e) => onChangeEditCourse('stable_id', e.target.value)} required>
                <option value="">Select stable</option>
                {stables.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>

            <label className="grid gap-1.5">
              <span className={labelSpanCls}>Course Type</span>
              <select className={selectCls} value={courseEditForm.course_type}
                onChange={(e) => onChangeEditCourse('course_type', e.target.value)}>
                <option value="one_to_one">One to One</option>
                <option value="group">Group</option>
              </select>
            </label>

            <FormInput label="Start Date" name="start_date_edit" type="date"
              value={courseEditForm.start_date} onChange={(e) => onChangeEditCourse('start_date', e.target.value)} />
            <FormInput label="End Date" name="end_date_edit" type="date"
              value={courseEditForm.end_date} onChange={(e) => onChangeEditCourse('end_date', e.target.value)} />
            <FormInput label="Start Time" name="start_time_edit" type="time"
              value={courseEditForm.start_time} onChange={(e) => onChangeEditCourse('start_time', e.target.value)} />
            <FormInput label="End Time" name="end_time_edit" type="time"
              value={courseEditForm.end_time} onChange={(e) => onChangeEditCourse('end_time', e.target.value)} />
            <FormInput label="Duration Days" name="duration_days_edit" type="number"
              value={courseEditForm.duration_days} onChange={(e) => onChangeEditCourse('duration_days', e.target.value)} />
            <FormInput label="Max Session Duration (min)" name="max_session_duration_edit" type="number"
              value={courseEditForm.max_session_duration} onChange={(e) => onChangeEditCourse('max_session_duration', e.target.value)} />
            <FormInput label="Total Sessions" name="total_sessions_edit" type="number"
              value={courseEditForm.total_sessions} onChange={(e) => onChangeEditCourse('total_sessions', e.target.value)} />
            <FormInput label="Max Enrollment" name="max_enrollment_edit" type="number"
              value={courseEditForm.max_enrollment} onChange={(e) => onChangeEditCourse('max_enrollment', e.target.value)} />
            <FormInput label="Price" name="price_edit" type="number"
              value={courseEditForm.price} onChange={(e) => onChangeEditCourse('price', e.target.value)} />

            <label className="grid gap-1.5">
              <span className={labelSpanCls}>Status</span>
              <select className={selectCls} value={courseEditForm.status}
                onChange={(e) => onChangeEditCourse('status', e.target.value)}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>

            <label className="grid gap-1.5">
              <span className={labelSpanCls}>Visibility</span>
              <select className={selectCls} value={courseEditForm.is_active ? 'true' : 'false'}
                onChange={(e) => onChangeEditCourse('is_active', e.target.value === 'true')}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </label>

            <div className="sm:col-span-2">
              <label className="grid gap-1.5">
                <span className={labelSpanCls}>Description</span>
                <textarea
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 resize-none"
                  value={courseEditForm.description}
                  onChange={(e) => onChangeEditCourse('description', e.target.value)}
                />
              </label>
            </div>
          </div>

          {/* ── Compact thumbnail row ── */}
          <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-gray-50 p-3.5 dark:border-gray-700 dark:bg-gray-800/50">
            {/* Small fixed-size preview */}
            <div className="shrink-0 w-28 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
              {thumbnailSrc ? (
                <img
                  src={thumbnailSrc}
                  alt="Thumbnail"
                  className="aspect-video w-full object-cover"
                />
              ) : (
                <div className="aspect-video flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <ImagePlus size={18} className="text-gray-300 dark:text-gray-600" />
                </div>
              )}
            </div>

            {/* Upload controls */}
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <ImagePlus size={13} className="text-emerald-500 shrink-0" />
                <p className="text-xs font-bold text-gray-700 dark:text-gray-200">Course Thumbnail</p>
              </div>
              <input
                className="w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 file:mr-2 file:cursor-pointer file:rounded file:border-0 file:bg-emerald-50 file:px-2 file:py-0.5 file:text-xs file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:file:bg-emerald-900/30 dark:file:text-emerald-400"
                type="file"
                accept=".png,.jpg,.jpeg"
                onChange={(e) => onSelectCourseThumbnail(e.target.files?.[0] || null)}
              />
              <p className="text-[11px] text-gray-400">PNG/JPG/JPEG · max 3 MB · 16:9. New upload replaces existing thumbnail.</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            <AppButton type="submit" disabled={savingCourseEdit}>
              {savingCourseEdit ? (
                <span className="flex items-center gap-1.5"><Loader2 size={13} className="animate-spin" />Updating…</span>
              ) : 'Update Course'}
            </AppButton>
            <AppButton type="button" variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </AppButton>
          </div>
        </form>
      </Modal>

      {/* ── Course cropper ── */}
      <ImageCropperModal
        isOpen={isCourseCropperOpen}
        sourceFile={courseCropSourceFile}
        onClose={() => { setIsCourseCropperOpen(false); setCourseCropSourceFile(null); }}
        onApply={(croppedFile) => setCourseThumbnailFile(croppedFile)}
        title="Crop Course Thumbnail"
        aspectOptions={COURSE_CROP_ASPECT_OPTIONS}
        lockAspectSelection
      />

      {/* ── Enroll riders modal ── */}
      <Modal isOpen={showEnrollModal} title="Enroll Riders" onClose={() => setShowEnrollModal(false)}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Active riders only · select one or more
            </p>
            <button
              type="button"
              className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              onClick={toggleSelectAllRiders}
            >
              {allSelected ? 'Unselect All' : 'Select All'}
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-800">
            {notEnrolledActiveRiders.length === 0 ? (
              <p className="px-4 py-5 text-center text-sm text-gray-400">
                No active riders available for enrollment.
              </p>
            ) : (
              notEnrolledActiveRiders.map((rider) => (
                <label
                  key={rider.id}
                  className="flex cursor-pointer items-center justify-between gap-3 border-b border-gray-100 px-4 py-2.5 last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                      {`${rider.first_name || ''} ${rider.last_name || ''}`.trim() || '—'}
                    </p>
                    <p className="truncate text-xs text-gray-400">{rider.email}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedRiderIds.includes(rider.id)}
                    onChange={() => toggleRiderSelection(rider.id)}
                    className="h-4 w-4 shrink-0 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                  />
                </label>
              ))
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <AppButton
              type="button"
              onClick={onSubmitBulkEnroll}
              disabled={enrolling || !selectedRiderIds.length}
            >
              {enrolling ? (
                <span className="flex items-center gap-1.5"><Loader2 size={13} className="animate-spin" />Enrolling…</span>
              ) : `Enroll Selected (${selectedRiderIds.length})`}
            </AppButton>
            <AppButton type="button" variant="secondary" onClick={() => setShowEnrollModal(false)}>
              Cancel
            </AppButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminCourseDetailsPage;