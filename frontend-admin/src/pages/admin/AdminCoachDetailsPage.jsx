import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Loader2,
  Mail,
  Pencil,
  Plus,
  Star,
  Trash2,
  XCircle,
} from 'lucide-react';
import {
  cancelCourseSessionApi,
  createCoachReviewApi,
  deleteCoachReviewApi,
  getCoachByIdApi,
  getCoachCoursesApi,
  getCoachReviewsApi,
  getCoachSessionsApi,
  getCoachSummaryApi,
  updateCoachReviewApi,
  updateCourseSessionApi,
} from '../../features/operations/operationsApi';
import Modal from '../../components/ui/Modal';
import FormInput from '../../components/ui/FormInput';
import AppButton from '../../components/ui/AppButton';

const CoachWeeklyScheduleCalendar = lazy(() => import('../../components/admin/CoachWeeklyScheduleCalendar'));
const CourseSessionsTable = lazy(() => import('../../components/admin/courses/CourseSessionsTable'));

const AdminCoachDetailsPage = () => {
  const { coachId } = useParams();
  const navigate = useNavigate();
  const [coachDetails, setCoachDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [showEditSessionModal, setShowEditSessionModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editingSessionForm, setEditingSessionForm] = useState({
    session_date: '',
    start_time: '',
    end_time: '',
  });
  const [updatingSession, setUpdatingSession] = useState(false);
  const [showCancelSessionModal, setShowCancelSessionModal] = useState(false);
  const [cancelTargetSession, setCancelTargetSession] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancellingSession, setCancellingSession] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    course_id: '',
    stars: '5',
    comment: '',
  });
  const [savingReview, setSavingReview] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState(null);

  const fetchCoachDetails = async (page = 1) => {
    setLoading(true);
    try {
      const [coach, summary, courses, sessions, reviews] = await Promise.all([
        getCoachByIdApi(coachId),
        getCoachSummaryApi(coachId),
        getCoachCoursesApi(coachId),
        getCoachSessionsApi(coachId, { page, limit: 10 }),
        getCoachReviewsApi(coachId, { page: 1, limit: 20 }),
      ]);
      setCoachDetails({
        coach,
        summary,
        courses,
        sessions,
        reviews,
      });
    } catch (err) {
      toast.error(err.message || 'Failed to load coach details.');
      navigate('/admin/coaches');
    } finally {
      setLoading(false);
    }
  };

  const fetchCoachSessionsPage = async (page = 1) => {
    setSessionsLoading(true);
    try {
      const sessions = await getCoachSessionsApi(coachId, { page, limit: 10 });
      setCoachDetails((prev) => (prev ? { ...prev, sessions } : prev));
    } catch (err) {
      toast.error(err.message || 'Failed to load coach sessions.');
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoachDetails(1);
  }, [coachId]);

  const pagination = coachDetails?.sessions?.pagination;
  const coach = coachDetails?.coach;
  const summary = coachDetails?.summary;
  const initials = coach
    ? (coach.first_name?.[0] || coach.email?.[0] || '?').toUpperCase()
    : '?';
  const currentPage = pagination?.page || 1;
  const fullName = coach
    ? `${coach.first_name || ''} ${coach.last_name || ''}`.trim()
    : '—';

  const onOpenEditSession = useCallback((session) => {
    setEditingSession(session);
    setEditingSessionForm({
      session_date: String(session?.session_date || ''),
      start_time: String(session?.start_time || '').slice(0, 5),
      end_time: String(session?.end_time || '').slice(0, 5),
    });
    setShowEditSessionModal(true);
  }, []);

  const onSubmitEditSession = useCallback(async (event) => {
    event.preventDefault();
    if (!editingSession?.id) return;
    setUpdatingSession(true);
    try {
      await updateCourseSessionApi({
        sessionId: editingSession.id,
        payload: {
          session_date: editingSessionForm.session_date,
          start_time: `${editingSessionForm.start_time}:00`,
          end_time: `${editingSessionForm.end_time}:00`,
        },
      });
      toast.success('Session updated.');
      setShowEditSessionModal(false);
      setEditingSession(null);
      await fetchCoachSessionsPage(currentPage);
    } catch (error) {
      toast.error(error.message || 'Failed to update session.');
    } finally {
      setUpdatingSession(false);
    }
  }, [editingSession, editingSessionForm, currentPage, coachId]);

  const onOpenCancelSession = useCallback((session) => {
    setCancelTargetSession(session);
    setCancelReason('');
    setShowCancelSessionModal(true);
  }, []);

  const onConfirmCancelSession = useCallback(async () => {
    if (!cancelTargetSession?.id) return;
    if (cancelReason.trim().length < 3) {
      toast.error('Please provide a valid cancel reason.');
      return;
    }
    setCancellingSession(true);
    try {
      await cancelCourseSessionApi({
        sessionId: cancelTargetSession.id,
        cancel_reason: cancelReason.trim(),
      });
      toast.success('Session cancelled.');
      setShowCancelSessionModal(false);
      setCancelTargetSession(null);
      await fetchCoachSessionsPage(currentPage);
    } catch (error) {
      toast.error(error.message || 'Failed to cancel session.');
    } finally {
      setCancellingSession(false);
    }
  }, [cancelTargetSession, cancelReason, currentPage, coachId]);

  const openCreateReview = useCallback(() => {
    setEditingReviewId(null);
    setReviewForm({
      course_id: '',
      stars: '5',
      comment: '',
    });
    setShowReviewModal(true);
  }, []);

  const openEditReview = useCallback((review) => {
    setEditingReviewId(review.id);
    setReviewForm({
      course_id: String(review.course_id || ''),
      stars: String(review.stars || '5'),
      comment: review.comment || '',
    });
    setShowReviewModal(true);
  }, []);

  const onSubmitReview = useCallback(async (event) => {
    event.preventDefault();
    if (!reviewForm.course_id) {
      toast.error('Please select a course.');
      return;
    }
    if (String(reviewForm.comment || '').length > 500) {
      toast.error('Comment must be 500 characters or fewer.');
      return;
    }
    setSavingReview(true);
    try {
      const payload = {
        coach_id: Number(coachId),
        course_id: Number(reviewForm.course_id),
        stars: Number(reviewForm.stars),
        comment: reviewForm.comment || null,
      };
      if (editingReviewId) {
        await updateCoachReviewApi({
          reviewId: editingReviewId,
          payload: {
            stars: payload.stars,
            comment: payload.comment,
          },
        });
        toast.success('Review updated.');
      } else {
        await createCoachReviewApi(payload);
        toast.success('Review added.');
      }
      setShowReviewModal(false);
      setEditingReviewId(null);
      await fetchCoachDetails(currentPage);
    } catch (error) {
      toast.error(error.message || 'Failed to save review.');
    } finally {
      setSavingReview(false);
    }
  }, [coachId, currentPage, editingReviewId, reviewForm]);

  const onDeleteReview = useCallback(async (reviewId) => {
    const ok = window.confirm('Delete this review?');
    if (!ok) return;
    setDeletingReviewId(reviewId);
    try {
      await deleteCoachReviewApi(reviewId);
      toast.success('Review deleted.');
      await fetchCoachDetails(currentPage);
    } catch (error) {
      toast.error(error.message || 'Failed to delete review.');
    } finally {
      setDeletingReviewId(null);
    }
  }, [currentPage]);

  const refreshReviews = useCallback(async () => {
    try {
      const reviewsData = await getCoachReviewsApi(coachId, { page: 1, limit: 20 });
      setCoachDetails((prev) =>
        prev
          ? {
              ...prev,
              reviews: reviewsData,
              summary: {
                ...prev.summary,
                average_rating: reviewsData?.summary?.average_rating ?? prev.summary?.average_rating ?? 0,
                total_reviews: reviewsData?.summary?.total_reviews ?? prev.summary?.total_reviews ?? 0,
              },
            }
          : prev
      );
    } catch (_error) {
      // Keep page usable even if review refresh fails.
    }
  }, [coachId]);

  return (
    <div className="grid gap-4">

      {/* ── Top action bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <AppButton
          type="button"
          variant="secondary"
          onClick={() => navigate('/admin/coaches')}
        >
          <ArrowLeft size={14} className="mr-1" />
          Back to Coaches
        </AppButton>
        {!loading && coachDetails && (
          <AppButton type="button" onClick={openCreateReview}>
            <Plus size={14} className="mr-1" />
            Add Review
          </AppButton>
        )}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <section className="flex items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white p-12 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <Loader2 size={20} className="animate-spin text-emerald-500" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Loading coach details…</span>
        </section>
      )}

      {/* ── Main content ── */}
      {!loading && coachDetails && (
        <div className="grid gap-4">

          {/* Coach profile card */}
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

            {/* Gradient header — same emerald/stone as CourseOverviewCard */}
            <div className="relative bg-gradient-to-r from-emerald-500 to-stone-400 px-6 pt-5 pb-10">
              <div
                className="pointer-events-none absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                  backgroundSize: '18px 18px',
                }}
              />
              <div className="relative flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
                    Coach Profile
                  </p>
                  <h2 className="text-2xl font-bold leading-tight tracking-tight text-white drop-shadow-sm">
                    {fullName}
                  </h2>
                  {coach?.coach_type && (
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                      {({ stable_employed: 'Stable Employed', freelancer: 'Freelancer', independent: 'Independent' })[coach.coach_type] || coach.coach_type}
                    </span>
                  )}
                  {coach?.email && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-white/70">
                      <Mail size={13} />
                      {coach.email}
                    </p>
                  )}
                </div>

                {/* Avatar */}
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl font-extrabold text-white backdrop-blur-sm">
                  {initials}
                </div>
              </div>
            </div>

            {/* Floating stat strip — identical pattern to CourseOverviewCard */}
            <div className="relative z-10 mx-5 -mt-6 grid grid-cols-2 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-md sm:grid-cols-4 dark:border-gray-800 dark:bg-gray-900">
              {[
                { icon: GraduationCap, label: 'Courses',    value: summary?.total_courses             ?? 0, color: 'text-emerald-500'   },
                { icon: Clock3,        label: 'Upcoming sessions',   value: summary?.upcoming_sessions          ?? 0, color: 'text-sky-500'     },
                { icon: CheckCircle2,  label: 'Active courses',     value: summary?.active_courses             ?? 0, color: 'text-emerald-500' },
                { icon: Star,       label: 'Rating',  value: `${Number(summary?.average_rating || 0).toFixed(1)} (${summary?.total_reviews || 0})`, color: 'text-violet-500'  },
              ].map(({ icon: Icon, label, value, color }, i, arr) => (
                <div
                  key={label}
                  className={`flex flex-col items-center gap-1 py-4 ${i < arr.length - 1 ? 'border-r border-gray-100 dark:border-gray-800' : ''}`}
                >
                  <Icon size={15} className={color} />
                  <p className="text-xl font-bold leading-none text-gray-900 dark:text-gray-100">{value}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
                </div>
              ))}
            </div>

            {/* bottom padding to breathe after the strip */}
            <div className="pb-2" />
          </section>

          <Suspense
            fallback={
              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Loader2 size={16} className="animate-spin text-emerald-500" />
                  Loading weekly schedule...
                </div>
              </section>
            }
          >
            <CoachWeeklyScheduleCalendar coachId={coachId} />
          </Suspense>

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-4 dark:border-gray-800 dark:bg-gray-800/50">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Reviews</h3>
              <button
                type="button"
                onClick={refreshReviews}
                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                Refresh
              </button>
            </div>
            <div className="grid gap-3 p-4">
              {(coachDetails?.reviews?.data || []).length === 0 ? (
                <p className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  No reviews yet.
                </p>
              ) : (
                (coachDetails?.reviews?.data || []).map((review) => (
                  <div key={review.id} className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {review.reviewer?.type === 'admin' ? 'Admin' : 'Rider'}:{' '}
                          {review.reviewer?.type === 'rider' && review.reviewer?.id ? (
                            <Link
                              to={`/admin/rider/${review.reviewer.id}`}
                              className="cursor-pointer transition hover:text-emerald-600 hover:underline dark:hover:text-emerald-400"
                            >
                              {[review.reviewer?.first_name, review.reviewer?.last_name].filter(Boolean).join(' ') || review.reviewer?.email || 'Unknown'}
                            </Link>
                          ) : (
                            [review.reviewer?.first_name, review.reviewer?.last_name].filter(Boolean).join(' ') || review.reviewer?.email || 'Unknown'
                          )}
                        </p>
                        <p className="text-xs text-gray-400">
                          Course:{' '}
                          {review.course?.id ? (
                            <Link
                              to={`/admin/courses/${review.course.id}`}
                              className="cursor-pointer transition hover:text-emerald-600 hover:underline dark:hover:text-emerald-400"
                            >
                              {review.course?.title || '-'}
                            </Link>
                          ) : (
                            review.course?.title || '-'
                          )}{' '}
                          | {new Date(review.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                          <Star size={12} className="fill-current" />
                          {review.stars}
                        </span>
                        <button
                          type="button"
                          onClick={() => openEditReview(review)}
                          className="rounded-md border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteReview(review.id)}
                          disabled={deletingReviewId === review.id}
                          className="rounded-md border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-900/20"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    {review.comment ? (
                      <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{review.comment}</p>
                    ) : (
                      <p className="mt-2 text-xs italic text-gray-400">No comment</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          <Suspense
            fallback={
              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Loader2 size={16} className="animate-spin text-emerald-500" />
                  Loading sessions table...
                </div>
              </section>
            }
          >
            <CourseSessionsTable
              sessions={coachDetails.sessions?.data || []}
              pagination={pagination}
              loading={sessionsLoading}
              onPrev={() => fetchCoachSessionsPage((pagination?.page || 1) - 1)}
              onNext={() => fetchCoachSessionsPage((pagination?.page || 1) + 1)}
              onEdit={onOpenEditSession}
              onCancel={onOpenCancelSession}
              canManage
              showCourse
            />
          </Suspense>
        </div>
      )}

      {/* ── Edit session modal ── */}
      <Modal
        isOpen={showEditSessionModal}
        title="Edit Session"
        onClose={() => setShowEditSessionModal(false)}
      >
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={onSubmitEditSession}>
          <FormInput
            label="Session Date"
            name="coach_edit_session_date"
            type="date"
            value={editingSessionForm.session_date}
            onChange={(e) =>
              setEditingSessionForm((prev) => ({ ...prev, session_date: e.target.value }))
            }
            required
          />
          <FormInput
            label="Start Time"
            name="coach_edit_session_start_time"
            type="time"
            value={editingSessionForm.start_time}
            onChange={(e) =>
              setEditingSessionForm((prev) => ({ ...prev, start_time: e.target.value }))
            }
            required
          />
          <FormInput
            label="End Time"
            name="coach_edit_session_end_time"
            type="time"
            value={editingSessionForm.end_time}
            onChange={(e) =>
              setEditingSessionForm((prev) => ({ ...prev, end_time: e.target.value }))
            }
            required
          />
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <AppButton type="submit" disabled={updatingSession}>
              {updatingSession ? 'Saving…' : 'Save'}
            </AppButton>
            <AppButton
              type="button"
              variant="secondary"
              onClick={() => setShowEditSessionModal(false)}
            >
              Cancel
            </AppButton>
          </div>
        </form>
      </Modal>

      {/* ── Cancel session modal ── */}
      <Modal
        isOpen={showCancelSessionModal}
        title="Cancel Session"
        onClose={() => setShowCancelSessionModal(false)}
      >
        <div className="grid gap-3">
          <label className="grid gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
              Cancel Reason
            </span>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Add reason for cancellation…"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <AppButton
              type="button"
              onClick={onConfirmCancelSession}
              disabled={cancellingSession}
            >
              {cancellingSession ? 'Cancelling…' : 'Confirm Cancel'}
            </AppButton>
            <AppButton
              type="button"
              variant="secondary"
              onClick={() => setShowCancelSessionModal(false)}
            >
              Close
            </AppButton>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showReviewModal}
        title={editingReviewId ? 'Edit Review' : 'Add Review'}
        onClose={() => setShowReviewModal(false)}
      >
        <form className="grid gap-3" onSubmit={onSubmitReview}>
          <label className="grid gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Course</span>
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={reviewForm.course_id}
              onChange={(e) => setReviewForm((prev) => ({ ...prev, course_id: e.target.value }))}
              required
            >
              <option value="">Select course</option>
              {(coachDetails?.courses || []).map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Stars</span>
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={reviewForm.stars}
              onChange={(e) => setReviewForm((prev) => ({ ...prev, stars: e.target.value }))}
              required
            >
              <option value="5">5</option>
              <option value="4">4</option>
              <option value="3">3</option>
              <option value="2">2</option>
              <option value="1">1</option>
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Comment (optional)</span>
            <textarea
              rows={4}
              maxLength={500}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={reviewForm.comment}
              onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
              placeholder="Share review details..."
            />
            <span className="text-xs text-gray-400">{reviewForm.comment.length}/500</span>
          </label>

          <div className="flex flex-wrap gap-2">
            <AppButton type="submit" disabled={savingReview}>
              {savingReview ? 'Saving…' : editingReviewId ? 'Update Review' : 'Add Review'}
            </AppButton>
            <AppButton type="button" variant="secondary" onClick={() => setShowReviewModal(false)}>
              Cancel
            </AppButton>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminCoachDetailsPage;
