import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, KeyRound, Pencil, Plus, UserX } from "lucide-react";
import AppButton from "../../components/ui/AppButton";
import FormInput from "../../components/ui/FormInput";
import Modal from "../../components/ui/Modal";
import {
  User,
  Mail,
  Phone,
  CheckCircle2,
  Calendar,
  MapPin,
  Map,
  Globe,
  Hash,
  Cake,
  Users,
  XCircle,
} from "lucide-react";
import {
  cancelCourseSessionApi,
  createCourseSessionApi,
  getRiderDetailsApi,
  getRiderSessionsApi,
  getRiderStatsApi,
  resetRiderPasswordApi,
  updateCourseSessionApi,
  updateRiderApi,
  updateRiderStatusApi,
} from "../../features/operations/operationsApi";

const CourseSessionsTable = lazy(
  () => import("../../components/admin/courses/CourseSessionsTable"),
);

const emptyCreateSessionForm = {
  course_id: "",
  session_date: "",
  start_time: "",
  end_time: "",
};

const emptyEditRiderForm = {
  first_name: "",
  last_name: "",
  email: "",
  mobile_number: "",
  city: "",
  state: "",
  country: "",
  pincode: "",
  date_of_birth: "",
  gender: "",
};

const AdminRiderDetailsPage = () => {
  const { riderId } = useParams();
  const navigate = useNavigate();

  const [rider, setRider] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [stats, setStats] = useState({
    enrolled_courses: 0,
    sessions_created: 0,
    sessions_cancelled: 0,
  });
  const [sessions, setSessions] = useState([]);
  const [sessionsPagination, setSessionsPagination] = useState(null);
  const [sessionsPage, setSessionsPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const [showEditRiderModal, setShowEditRiderModal] = useState(false);
  const [editRiderForm, setEditRiderForm] = useState(emptyEditRiderForm);
  const [savingRider, setSavingRider] = useState(false);

  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false);
  const [createSessionForm, setCreateSessionForm] = useState(
    emptyCreateSessionForm,
  );
  const [creatingSession, setCreatingSession] = useState(false);

  const [editingSession, setEditingSession] = useState(null);
  const [showEditSessionModal, setShowEditSessionModal] = useState(false);
  const [editingSessionForm, setEditingSessionForm] = useState({
    session_date: "",
    start_time: "",
    end_time: "",
  });
  const [updatingSession, setUpdatingSession] = useState(false);

  const [showCancelSessionModal, setShowCancelSessionModal] = useState(false);
  const [cancelTargetSession, setCancelTargetSession] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancellingSession, setCancellingSession] = useState(false);

  const activeEnrollments = useMemo(
    () =>
      (enrollments || []).filter(
        (item) => item.status === "active" && item.course?.id,
      ),
    [enrollments],
  );

  const selectedCourseForCreate = useMemo(
    () =>
      activeEnrollments.find(
        (item) =>
          String(item.course?.id) === String(createSessionForm.course_id),
      )?.course || null,
    [activeEnrollments, createSessionForm.course_id],
  );

  const fetchRiderDetails = useCallback(async () => {
    if (!riderId) return;
    setLoading(true);
    try {
      const [detailData, statsData] = await Promise.all([
        getRiderDetailsApi(riderId),
        getRiderStatsApi(riderId),
      ]);
      setRider(detailData?.rider || null);
      setEnrollments(
        Array.isArray(detailData?.enrollments) ? detailData.enrollments : [],
      );
      setStats(
        statsData || {
          enrolled_courses: 0,
          sessions_created: 0,
          sessions_cancelled: 0,
        },
      );
    } catch (error) {
      toast.error(error.message || "Failed to load rider details.");
      navigate("/admin/riders");
    } finally {
      setLoading(false);
    }
  }, [riderId, navigate]);

  const fetchSessions = useCallback(
    async (page = 1) => {
      if (!riderId) return;
      setSessionsLoading(true);
      try {
        const data = await getRiderSessionsApi(riderId, { page, limit: 10 });
        setSessions(Array.isArray(data?.sessions) ? data.sessions : []);
        setSessionsPagination(data?.pagination || null);
      } catch (error) {
        toast.error(error.message || "Failed to load rider sessions.");
      } finally {
        setSessionsLoading(false);
      }
    },
    [riderId],
  );

  useEffect(() => {
    fetchRiderDetails();
  }, [fetchRiderDetails]);

  useEffect(() => {
    fetchSessions(sessionsPage);
  }, [fetchSessions, sessionsPage]);

  const onOpenEditRider = useCallback(() => {
    if (!rider) return;
    setEditRiderForm({
      first_name: rider.first_name || "",
      last_name: rider.last_name || "",
      email: rider.email || "",
      mobile_number: rider.mobile_number || "",
      city: rider.city || "",
      state: rider.state || "",
      country: rider.country || "",
      pincode: rider.pincode || "",
      date_of_birth: rider.date_of_birth || "",
      gender: rider.gender || "",
    });
    setShowEditRiderModal(true);
  }, [rider]);

  const onSubmitEditRider = useCallback(
    async (event) => {
      event.preventDefault();
      if (!riderId) return;
      setSavingRider(true);
      try {
        await updateRiderApi({
          riderId,
          payload: {
            first_name: editRiderForm.first_name,
            last_name: editRiderForm.last_name,
            email: editRiderForm.email,
            mobile_number: editRiderForm.mobile_number,
            city: editRiderForm.city,
            state: editRiderForm.state,
            country: editRiderForm.country,
            pincode: editRiderForm.pincode,
            date_of_birth: editRiderForm.date_of_birth,
            gender: editRiderForm.gender,
          },
        });
        toast.success("Rider updated successfully.");
        setShowEditRiderModal(false);
        await fetchRiderDetails();
      } catch (error) {
        toast.error(error.message || "Failed to update rider.");
      } finally {
        setSavingRider(false);
      }
    },
    [riderId, editRiderForm, fetchRiderDetails],
  );

  const onToggleRiderStatus = useCallback(async () => {
    if (!rider) return;
    try {
      const nextActive = !rider.is_active;
      const response = await updateRiderStatusApi({
        riderId: rider.id,
        is_active: nextActive,
      });
      toast.success(
        response?.message ||
          `Rider ${nextActive ? "activated" : "deactivated"} successfully.`,
      );
      await fetchRiderDetails();
    } catch (error) {
      toast.error(error.message || "Failed to update rider status.");
    }
  }, [rider, fetchRiderDetails]);

  const [showResetPasswordChoice, setShowResetPasswordChoice] = useState(false);
  const [resetPasswordResult, setResetPasswordResult] = useState(null);
  const [resettingPassword, setResettingPassword] = useState(false);

  const onResetPasswordEmail = useCallback(async () => {
    if (!rider) return;
    setShowResetPasswordChoice(false);
    setResettingPassword(true);
    setResetPasswordResult(null);
    try {
      const response = await resetRiderPasswordApi(rider.id, "email");
      toast.success(response?.message || "Done.");
      setResetPasswordResult(response);
    } catch (error) {
      toast.error(error.message || "Failed.");
    } finally {
      setResettingPassword(false);
    }
  }, [rider]);

  const onResetPasswordManual = useCallback(async () => {
    if (!rider) return;
    const customPassword = window.prompt(
      `Enter a custom password for ${rider.email}, or leave blank to auto-generate:`
    );
    if (customPassword === null) return; // admin cancelled the prompt
    setShowResetPasswordChoice(false);
    setResettingPassword(true);
    setResetPasswordResult(null);
    try {
      const password = customPassword.trim() || undefined;
      const response = await resetRiderPasswordApi(rider.id, "manual", password);
      toast.success(response?.message || "Done.");
      setResetPasswordResult(response);
    } catch (error) {
      toast.error(error.message || "Failed.");
    } finally {
      setResettingPassword(false);
    }
  }, [rider]);

  const onSubmitCreateSession = useCallback(
    async (event) => {
      event.preventDefault();
      if (!riderId) return;
      if (!createSessionForm.course_id) {
        toast.error("Please select a course.");
        return;
      }
      setCreatingSession(true);
      try {
        const payload = {
          course_id: Number(createSessionForm.course_id),
          session_date: createSessionForm.session_date,
          start_time: `${createSessionForm.start_time}:00`,
          end_time: `${createSessionForm.end_time}:00`,
        };
        if (selectedCourseForCreate?.course_type === "one_to_one") {
          payload.rider_id = Number(riderId);
        }
        await createCourseSessionApi(payload);
        toast.success("Session created.");
        setShowCreateSessionModal(false);
        setCreateSessionForm(emptyCreateSessionForm);
        await fetchSessions(sessionsPage);
      } catch (error) {
        toast.error(error.message || "Failed to create session.");
      } finally {
        setCreatingSession(false);
      }
    },
    [
      createSessionForm,
      selectedCourseForCreate,
      riderId,
      fetchSessions,
      sessionsPage,
    ],
  );

  const onOpenEditSession = useCallback((session) => {
    setEditingSession(session);
    setEditingSessionForm({
      session_date: String(session?.session_date || ""),
      start_time: String(session?.start_time || "").slice(0, 5),
      end_time: String(session?.end_time || "").slice(0, 5),
    });
    setShowEditSessionModal(true);
  }, []);

  const onSubmitEditSession = useCallback(
    async (event) => {
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
        toast.success("Session updated.");
        setShowEditSessionModal(false);
        setEditingSession(null);
        await fetchSessions(sessionsPage);
      } catch (error) {
        toast.error(error.message || "Failed to update session.");
      } finally {
        setUpdatingSession(false);
      }
    },
    [editingSession, editingSessionForm, fetchSessions, sessionsPage],
  );

  const onOpenCancelSession = useCallback((session) => {
    setCancelTargetSession(session);
    setCancelReason("");
    setShowCancelSessionModal(true);
  }, []);

  const onConfirmCancelSession = useCallback(async () => {
    if (!cancelTargetSession?.id) return;
    if (cancelReason.trim().length < 3) {
      toast.error("Please provide a valid cancel reason.");
      return;
    }
    setCancellingSession(true);
    try {
      await cancelCourseSessionApi({
        sessionId: cancelTargetSession.id,
        cancel_reason: cancelReason.trim(),
      });
      toast.success("Session cancelled.");
      setShowCancelSessionModal(false);
      setCancelTargetSession(null);
      await fetchSessions(sessionsPage);
      await fetchRiderDetails();
    } catch (error) {
      toast.error(error.message || "Failed to cancel session.");
    } finally {
      setCancellingSession(false);
    }
  }, [
    cancelTargetSession,
    cancelReason,
    fetchSessions,
    sessionsPage,
    fetchRiderDetails,
  ]);

  if (loading) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Loading rider details...
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <AppButton
          type="button"
          variant="secondary"
          onClick={() => navigate("/admin/riders")}
        >
          <ArrowLeft size={14} className="mr-1" />
          Back to Riders
        </AppButton>
        <div className="flex flex-wrap gap-2">
          <AppButton
            type="button"
            variant="secondary"
            onClick={onOpenEditRider}
          >
            <Pencil size={14} className="mr-1" />
            Edit Rider
          </AppButton>
          <AppButton
            type="button"
            variant="secondary"
            onClick={() => setShowCreateSessionModal(true)}
          >
            <Plus size={14} className="mr-1" />
            Add Session
          </AppButton>
          <AppButton
            type="button"
            variant="secondary"
            onClick={() => setShowResetPasswordChoice(true)}
            disabled={resettingPassword}
          >
            <KeyRound size={14} className="mr-1" />
            {resettingPassword ? "Sending…" : "Reset Password"}
          </AppButton>
          <AppButton type="button" onClick={onToggleRiderStatus}>
            <UserX size={14} className="mr-1" />
            {rider?.is_active ? "Deactivate Account" : "Activate Account"}
          </AppButton>
        </div>
      </div>

      <section className="rounded-2xl bg-white dark:bg-gray-950 overflow-hidden border-l-4 border-indigo-500 shadow-md px-6 py-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
              {(`${rider?.first_name || ""}`.trim() || "?")[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {`${rider?.first_name || ""} ${rider?.last_name || ""}`.trim() ||
                  "—"}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Rider Profile
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
              rider?.is_active
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                : "bg-red-50 text-red-500 dark:bg-red-950 dark:text-red-400"
            }`}
          >
            {rider?.is_active ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <XCircle className="h-3.5 w-3.5" />
            )}
            {rider?.is_active ? "Active" : "Inactive"}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-gray-200 dark:border-gray-800 mb-4" />

        {/* Fields — two-column label/value rows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3.5">
          <div className="flex items-center gap-2.5">
            <Mail className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span className="text-xs text-gray-400 dark:text-gray-500 w-16 shrink-0">
              Email
            </span>
            <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
              {rider?.email || "—"}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Phone className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span className="text-xs text-gray-400 dark:text-gray-500 w-16 shrink-0">
              Mobile
            </span>
            <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
              {rider?.mobile_number || "—"}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Calendar className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span className="text-xs text-gray-400 dark:text-gray-500 w-16 shrink-0">
              Created
            </span>
            <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
              {String(rider?.created_at || "").slice(0, 10) || "—"}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Cake className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span className="text-xs text-gray-400 dark:text-gray-500 w-16 shrink-0">
              DOB
            </span>
            <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
              {rider?.date_of_birth || "—"}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Users className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span className="text-xs text-gray-400 dark:text-gray-500 w-16 shrink-0">
              Gender
            </span>
            <span className="text-xs font-medium text-gray-800 dark:text-gray-200 capitalize">
              {rider?.gender || "—"}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Hash className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span className="text-xs text-gray-400 dark:text-gray-500 w-16 shrink-0">
              Pincode
            </span>
            <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
              {rider?.pincode || "—"}
            </span>
          </div>

          {/* Location row spans full width */}
          <div className="sm:col-span-2 flex items-center gap-2.5">
            <MapPin className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span className="text-xs text-gray-400 dark:text-gray-500 w-16 shrink-0">
              Location
            </span>
            <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
              {[rider?.city, rider?.state, rider?.country]
                .filter(Boolean)
                .join(", ") || "—"}
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Rider Stats
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Enrolled Courses
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.enrolled_courses ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Sessions Created
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.sessions_created ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Sessions Cancelled
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.sessions_cancelled ?? 0}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Enrolled Courses
        </h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/60">
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <th className="px-3 py-2">Course</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Coach</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-gray-200 dark:border-gray-800"
                >
                  <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">
                    {item.course?.id ? (
                      <Link
                        to={`/admin/courses/${item.course.id}`}
                        className="cursor-pointer transition hover:text-indigo-600 hover:underline dark:hover:text-indigo-400"
                      >
                        {item.course?.title || "-"}
                      </Link>
                    ) : (
                      item.course?.title || "-"
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                    {item.course?.course_type || "-"}
                  </td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                    {item.course?.coach?.id ? (
                      <Link
                        to={`/admin/coaches/${item.course.coach.id}`}
                        className="cursor-pointer transition hover:text-indigo-600 hover:underline dark:hover:text-indigo-400"
                      >
                        {`${item.course.coach.first_name || ""} ${item.course.coach.last_name || ""}`.trim()}
                      </Link>
                    ) : item.course?.coach ? (
                      `${item.course.coach.first_name || ""} ${item.course.coach.last_name || ""}`.trim()
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                    {item.status}
                  </td>
                </tr>
              ))}
              {!enrollments.length ? (
                <tr className="border-t border-gray-200 dark:border-gray-800">
                  <td
                    colSpan={4}
                    className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    No enrollments found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <Suspense
        fallback={
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading sessions...
            </p>
          </section>
        }
      >
        <CourseSessionsTable
          sessions={sessions}
          pagination={sessionsPagination}
          loading={sessionsLoading}
          onPrev={() => setSessionsPage((prev) => Math.max(1, prev - 1))}
          onNext={() => setSessionsPage((prev) => prev + 1)}
          onEdit={onOpenEditSession}
          onCancel={onOpenCancelSession}
          showCourse
        />
      </Suspense>

      <Modal
        isOpen={showEditRiderModal}
        title="Edit Rider"
        onClose={() => setShowEditRiderModal(false)}
      >
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={onSubmitEditRider}
        >
          <FormInput
            label="First Name"
            name="rider_first_name"
            value={editRiderForm.first_name}
            onChange={(e) =>
              setEditRiderForm((prev) => ({
                ...prev,
                first_name: e.target.value,
              }))
            }
          />
          <FormInput
            label="Last Name"
            name="rider_last_name"
            value={editRiderForm.last_name}
            onChange={(e) =>
              setEditRiderForm((prev) => ({
                ...prev,
                last_name: e.target.value,
              }))
            }
          />
          <FormInput
            label="Mobile Number"
            name="rider_mobile_number"
            value={editRiderForm.mobile_number}
            onChange={(e) =>
              setEditRiderForm((prev) => ({
                ...prev,
                mobile_number: e.target.value,
              }))
            }
          />
          <FormInput
            label="City"
            name="rider_city"
            value={editRiderForm.city}
            onChange={(e) =>
              setEditRiderForm((prev) => ({ ...prev, city: e.target.value }))
            }
          />
          <FormInput
            label="State"
            name="rider_state"
            value={editRiderForm.state}
            onChange={(e) =>
              setEditRiderForm((prev) => ({ ...prev, state: e.target.value }))
            }
          />
          <FormInput
            label="Country"
            name="rider_country"
            value={editRiderForm.country}
            onChange={(e) =>
              setEditRiderForm((prev) => ({ ...prev, country: e.target.value }))
            }
          />
          <FormInput
            label="Pincode"
            name="rider_pincode"
            value={editRiderForm.pincode}
            onChange={(e) =>
              setEditRiderForm((prev) => ({ ...prev, pincode: e.target.value }))
            }
          />
          <FormInput
            label="Date of Birth"
            name="rider_date_of_birth"
            type="date"
            value={editRiderForm.date_of_birth}
            onChange={(e) =>
              setEditRiderForm((prev) => ({
                ...prev,
                date_of_birth: e.target.value,
              }))
            }
          />
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Gender
            </span>
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={editRiderForm.gender}
              onChange={(e) =>
                setEditRiderForm((prev) => ({
                  ...prev,
                  gender: e.target.value,
                }))
              }
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer Not To Say</option>
            </select>
          </label>
          <div className="sm:col-span-2">
            <FormInput
              label="Email *"
              name="rider_email"
              type="email"
              value={editRiderForm.email}
              onChange={(e) =>
                setEditRiderForm((prev) => ({ ...prev, email: e.target.value }))
              }
              required
            />
          </div>
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <AppButton type="submit" disabled={savingRider}>
              {savingRider ? "Saving..." : "Save"}
            </AppButton>
            <AppButton
              type="button"
              variant="secondary"
              onClick={() => setShowEditRiderModal(false)}
            >
              Cancel
            </AppButton>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showCreateSessionModal}
        title="Create Session"
        onClose={() => setShowCreateSessionModal(false)}
      >
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={onSubmitCreateSession}
        >
          <label className="grid gap-1.5 sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Course
            </span>
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={createSessionForm.course_id}
              onChange={(e) =>
                setCreateSessionForm((prev) => ({
                  ...prev,
                  course_id: e.target.value,
                }))
              }
              required
            >
              <option value="">Select Course</option>
              {activeEnrollments.map((item) => (
                <option key={item.id} value={item.course?.id || ""}>
                  {item.course?.title || "-"} ({item.course?.course_type || "-"}
                  )
                </option>
              ))}
            </select>
          </label>
          <FormInput
            label="Session Date"
            name="create_session_date"
            type="date"
            value={createSessionForm.session_date}
            onChange={(e) =>
              setCreateSessionForm((prev) => ({
                ...prev,
                session_date: e.target.value,
              }))
            }
            required
          />
          <FormInput
            label="Start Time"
            name="create_session_start_time"
            type="time"
            value={createSessionForm.start_time}
            onChange={(e) =>
              setCreateSessionForm((prev) => ({
                ...prev,
                start_time: e.target.value,
              }))
            }
            required
          />
          <FormInput
            label="End Time"
            name="create_session_end_time"
            type="time"
            value={createSessionForm.end_time}
            onChange={(e) =>
              setCreateSessionForm((prev) => ({
                ...prev,
                end_time: e.target.value,
              }))
            }
            required
          />
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <AppButton type="submit" disabled={creatingSession}>
              {creatingSession ? "Creating..." : "Create Session"}
            </AppButton>
            <AppButton
              type="button"
              variant="secondary"
              onClick={() => setShowCreateSessionModal(false)}
            >
              Cancel
            </AppButton>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditSessionModal}
        title="Edit Session"
        onClose={() => setShowEditSessionModal(false)}
      >
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={onSubmitEditSession}
        >
          <FormInput
            label="Session Date"
            name="edit_session_date"
            type="date"
            value={editingSessionForm.session_date}
            onChange={(e) =>
              setEditingSessionForm((prev) => ({
                ...prev,
                session_date: e.target.value,
              }))
            }
            required
          />
          <FormInput
            label="Start Time"
            name="edit_session_start_time"
            type="time"
            value={editingSessionForm.start_time}
            onChange={(e) =>
              setEditingSessionForm((prev) => ({
                ...prev,
                start_time: e.target.value,
              }))
            }
            required
          />
          <FormInput
            label="End Time"
            name="edit_session_end_time"
            type="time"
            value={editingSessionForm.end_time}
            onChange={(e) =>
              setEditingSessionForm((prev) => ({
                ...prev,
                end_time: e.target.value,
              }))
            }
            required
          />
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <AppButton type="submit" disabled={updatingSession}>
              {updatingSession ? "Saving..." : "Save"}
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

      <Modal
        isOpen={showCancelSessionModal}
        title="Cancel Session"
        onClose={() => setShowCancelSessionModal(false)}
      >
        <div className="grid gap-3">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Cancel Reason
            </span>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <AppButton
              type="button"
              onClick={onConfirmCancelSession}
              disabled={cancellingSession}
            >
              {cancellingSession ? "Cancelling..." : "Confirm Cancel"}
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

      {/* Reset password: choose method */}
      <Modal
        isOpen={showResetPasswordChoice}
        title="Reset password"
        onClose={() => setShowResetPasswordChoice(false)}
      >
        <div className="grid gap-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Send a reset link by email (if email is configured) or set a temporary password and share it with the rider.
          </p>
          <div className="flex flex-wrap gap-2">
            <AppButton type="button" onClick={onResetPasswordEmail}>
              Send reset email
            </AppButton>
            <AppButton type="button" variant="secondary" onClick={onResetPasswordManual}>
              Set temporary password
            </AppButton>
            <AppButton type="button" variant="secondary" onClick={() => setShowResetPasswordChoice(false)}>
              Cancel
            </AppButton>
          </div>
        </div>
      </Modal>

      {/* Reset password: show result (temp password or link to copy) */}
      <Modal
        isOpen={!!resetPasswordResult?.temporary_password || !!resetPasswordResult?.reset_link}
        title="Share with rider"
        onClose={() => setResetPasswordResult(null)}
      >
        <div className="grid gap-3">
          {resetPasswordResult?.temporary_password && (
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Temporary password
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono dark:border-gray-700 dark:bg-gray-800">
                  {resetPasswordResult.temporary_password}
                </code>
                <AppButton
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard?.writeText(resetPasswordResult.temporary_password);
                    toast.success("Copied to clipboard.");
                  }}
                >
                  Copy
                </AppButton>
              </div>
            </div>
          )}
          {resetPasswordResult?.reset_link && (
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Reset link
              </label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={resetPasswordResult.reset_link}
                  className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                />
                <AppButton
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard?.writeText(resetPasswordResult.reset_link);
                    toast.success("Copied to clipboard.");
                  }}
                >
                  Copy
                </AppButton>
              </div>
            </div>
          )}
          <AppButton type="button" onClick={() => setResetPasswordResult(null)}>
            Done
          </AppButton>
        </div>
      </Modal>
    </div>
  );
};

export default AdminRiderDetailsPage;
