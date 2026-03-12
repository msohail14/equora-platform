import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ArrowLeft, ImagePlus, BookOpen, Clock, Users, Calendar, DollarSign, Tag, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppButton from '../../components/ui/AppButton';
import FormInput from '../../components/ui/FormInput';
import ImageCropperModal from '../../components/ui/ImageCropperModal';
import {
  createCourseByAdminApi,
  getCoachesApi,
  getDisciplinesApi,
  getStablesApi,
} from '../../features/operations/operationsApi';

const COURSE_CROP_ASPECT_OPTIONS = [{ key: 'landscape', label: 'Landscape (16:9)', aspect: 16 / 9 }];
const allowedImageTypes = ['image/png', 'image/jpeg', 'image/jpg'];
const maxImageSize = 3 * 1024 * 1024;

const emptyForm = {
  coach_id: '',
  stable_id: '',
  discipline_id: '',
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
};

const toCoursePayload = (form) => ({
  coach_id: form.coach_id ? Number(form.coach_id) : undefined,
  stable_id: form.stable_id ? Number(form.stable_id) : undefined,
  discipline_id: form.discipline_id ? Number(form.discipline_id) : undefined,
  title: form.title,
  description: form.description || '',
  course_type: form.course_type,
  duration_days: form.duration_days === '' ? null : Number(form.duration_days),
  max_session_duration: form.max_session_duration === '' ? null : Number(form.max_session_duration),
  start_date: form.start_date || null,
  end_date: form.end_date || null,
  start_time: form.start_time ? `${form.start_time}:00` : null,
  end_time: form.end_time ? `${form.end_time}:00` : null,
  total_sessions: form.total_sessions === '' ? null : Number(form.total_sessions),
  max_enrollment: form.max_enrollment === '' ? null : Number(form.max_enrollment),
  price: form.price === '' ? null : Number(form.price),
  status: form.status,
  is_active: Boolean(form.is_active),
});

const selectClass =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 shadow-sm transition-all duration-150 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-100 dark:focus:border-amber-400';

const labelClass = 'text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500';

const SectionCard = ({ icon: Icon, title, children, accent }) => (
  <div className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
    <div className={`flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800 ${accent || 'bg-gray-50 dark:bg-gray-800/50'}`}>
      {Icon && (
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
          <Icon size={15} className="text-amber-600 dark:text-amber-400" />
        </span>
      )}
      <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">{title}</h2>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const AdminCourseCreatePage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [coaches, setCoaches] = useState([]);
  const [stables, setStables] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [cropSourceFile, setCropSourceFile] = useState(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      try {
        const [coachesData, stablesData, disciplinesData] = await Promise.all([
          getCoachesApi({ include_inactive: true, page: 1, limit: 200 }),
          getStablesApi({ include_inactive: true, page: 1, limit: 200 }),
          getDisciplinesApi({ include_inactive: true, page: 1, limit: 200 }),
        ]);

        const coachList = Array.isArray(coachesData?.data) ? coachesData.data.filter((item) => item.is_active !== false) : [];
        const stableList = Array.isArray(stablesData?.data) ? stablesData.data.filter((item) => item.is_active !== false) : [];
        const disciplineList = Array.isArray(disciplinesData?.data)
          ? disciplinesData.data.filter((item) => item.is_active !== false)
          : [];

        setCoaches(coachList);
        setStables(stableList);
        setDisciplines(disciplineList);
        if (stableList.length === 1) {
          setForm((prev) => ({ ...prev, stable_id: String(stableList[0].id) }));
        }
      } catch (error) {
        toast.error(error.message || 'Failed to load course form data.');
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl('');
      return undefined;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  const validateImageFile = (file) => {
    if (!file) return 'Course thumbnail is required.';
    if (!allowedImageTypes.includes(file.type)) return 'Course thumbnail must be PNG, JPG, or JPEG format.';
    if (file.size > maxImageSize) return 'Course thumbnail size must be less than 3MB.';
    return null;
  };

  const onSelectImage = (file) => {
    if (!file) {
      setImageFile(null);
      return;
    }
    const validationError = validateImageFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setCropSourceFile(file);
    setIsCropperOpen(true);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateImageFile(imageFile);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    if (!form.stable_id) {
      toast.error('Please select a stable.');
      return;
    }

    setSubmitting(true);
    try {
      await createCourseByAdminApi({
        payload: toCoursePayload(form),
        imageFile,
      });
      toast.success('Course created successfully.');
      navigate('/admin/courses');
    } catch (error) {
      toast.error(error.message || 'Failed to create course.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AppButton type="button" variant="secondary" onClick={() => navigate('/admin/courses')}>
          <ArrowLeft size={14} className="mr-1.5" />
          Back to Courses
        </AppButton>
      </div>

      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-400 to-rose-400 px-6 py-8 shadow-lg sm:px-8">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-8 right-20 h-32 w-32 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute bottom-4 right-4 h-16 w-16 rounded-full bg-white/10" />

        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">Course Setup</p>
        <h1 className="mt-1.5 text-3xl font-black text-white sm:text-4xl">Create Course</h1>
        <p className="mt-2 max-w-lg text-sm text-white/75 leading-relaxed">
          Assign the course to a stable, coach, and discipline before publishing it.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center rounded-2xl border border-gray-100 bg-white py-12 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-200 border-t-amber-500" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading form data…</p>
          </div>
        </div>
      )}

      {!loading && (
        <form onSubmit={onSubmit} className="space-y-5">
          {/* Main grid: left (form) + right (thumbnail) */}
          <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
            {/* ── Left column ── */}
            <div className="space-y-5">

              {/* Assignment */}
              <SectionCard icon={Layers} title="Assignment">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="grid gap-1.5">
                    <span className={labelClass}>Stable *</span>
                    <select
                      className={selectClass}
                      value={form.stable_id}
                      onChange={(e) => setForm((prev) => ({ ...prev, stable_id: e.target.value }))}
                      required
                    >
                      <option value="">Select Stable</option>
                      {stables.map((stable) => (
                        <option key={stable.id} value={stable.id}>{stable.name}</option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-1.5">
                    <span className={labelClass}>Coach *</span>
                    <select
                      className={selectClass}
                      value={form.coach_id}
                      onChange={(e) => setForm((prev) => ({ ...prev, coach_id: e.target.value }))}
                      required
                    >
                      <option value="">Select Coach</option>
                      {coaches.map((coach) => (
                        <option key={coach.id} value={coach.id}>
                          {coach.first_name || ''} {coach.last_name || ''} ({coach.email})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-1.5">
                    <span className={labelClass}>Discipline *</span>
                    <select
                      className={selectClass}
                      value={form.discipline_id}
                      onChange={(e) => setForm((prev) => ({ ...prev, discipline_id: e.target.value }))}
                      required
                    >
                      <option value="">Select Discipline</option>
                      {disciplines.map((discipline) => (
                        <option key={discipline.id} value={discipline.id}>{discipline.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </SectionCard>

              {/* Basic Info */}
              <SectionCard icon={BookOpen} title="Basic Information">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <FormInput
                      label="Title *"
                      name="course_title_create_page"
                      value={form.title}
                      onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>

                  <label className="grid gap-1.5">
                    <span className={labelClass}>Course Type *</span>
                    <select
                      className={selectClass}
                      value={form.course_type}
                      onChange={(e) => setForm((prev) => ({ ...prev, course_type: e.target.value }))}
                    >
                      <option value="one_to_one">One to One</option>
                      <option value="group">Group</option>
                    </select>
                  </label>

                  <FormInput
                    label="Price"
                    name="course_price_create_page"
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                  />

                  <div className="sm:col-span-2">
                    <label className="grid gap-1.5">
                      <span className={labelClass}>Description</span>
                      <textarea
                        rows={4}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 shadow-sm transition-all duration-150 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-100 resize-none"
                        value={form.description}
                        onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Course summary, outcomes, or notes…"
                      />
                    </label>
                  </div>
                </div>
              </SectionCard>

              {/* Schedule & Duration */}
              <SectionCard icon={Calendar} title="Schedule & Duration">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <FormInput
                    label="Start Date"
                    name="course_start_date_create_page"
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))}
                  />
                  <FormInput
                    label="End Date"
                    name="course_end_date_create_page"
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))}
                  />
                  <FormInput
                    label="Start Time"
                    name="course_start_time_create_page"
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm((prev) => ({ ...prev, start_time: e.target.value }))}
                  />
                  <FormInput
                    label="End Time"
                    name="course_end_time_create_page"
                    type="time"
                    value={form.end_time}
                    onChange={(e) => setForm((prev) => ({ ...prev, end_time: e.target.value }))}
                  />
                  <FormInput
                    label="Duration Days"
                    name="course_duration_days_create_page"
                    type="number"
                    value={form.duration_days}
                    onChange={(e) => setForm((prev) => ({ ...prev, duration_days: e.target.value }))}
                  />
                  <FormInput
                    label="Max Session Duration (min)"
                    name="course_max_session_duration_create_page"
                    type="number"
                    value={form.max_session_duration}
                    onChange={(e) => setForm((prev) => ({ ...prev, max_session_duration: e.target.value }))}
                  />
                  <FormInput
                    label="Total Sessions"
                    name="course_total_sessions_create_page"
                    type="number"
                    value={form.total_sessions}
                    onChange={(e) => setForm((prev) => ({ ...prev, total_sessions: e.target.value }))}
                  />
                  <FormInput
                    label="Max Enrollment"
                    name="course_max_enrollment_create_page"
                    type="number"
                    value={form.max_enrollment}
                    onChange={(e) => setForm((prev) => ({ ...prev, max_enrollment: e.target.value }))}
                  />
                </div>
              </SectionCard>

              {/* Publishing */}
              <SectionCard icon={Tag} title="Publishing">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className={labelClass}>Status</span>
                    <select
                      className={selectClass}
                      value={form.status}
                      onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </label>

                  <label className="grid gap-1.5">
                    <span className={labelClass}>Visibility</span>
                    <select
                      className={selectClass}
                      value={form.is_active ? 'true' : 'false'}
                      onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.value === 'true' }))}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </label>
                </div>
              </SectionCard>
            </div>

            {/* ── Right column: Thumbnail ── */}
            <div className="xl:sticky xl:top-6 xl:self-start">
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <ImagePlus size={15} className="text-amber-600 dark:text-amber-400" />
                  </span>
                  <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">Course Thumbnail</h2>
                </div>

                <div className="p-5 space-y-4">
                  <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                    Use the cropper to maintain consistent 16:9 thumbnails across course cards and headers.
                  </p>

                  {/* Preview area */}
                  <div className="w-full overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 transition-all">
                    {imageFile ? (
                      <img
                        src={previewUrl}
                        alt="Course thumbnail preview"
                        className="aspect-video w-full object-cover"
                      />
                    ) : (
                      <div className="aspect-video flex flex-col items-center justify-center gap-2 text-gray-300 dark:text-gray-600">
                        <ImagePlus size={32} strokeWidth={1.5} />
                        <p className="text-xs font-medium text-gray-400 dark:text-gray-500">No thumbnail selected</p>
                      </div>
                    )}
                  </div>

                  {/* File input */}
                  <label className="grid gap-1.5">
                    <span className={labelClass}>Upload Image *</span>
                    <input
                      className="w-full cursor-pointer rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-700 shadow-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-amber-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-amber-700 hover:file:bg-amber-100 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-300 dark:file:bg-amber-900/30 dark:file:text-amber-400"
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={(e) => onSelectImage(e.target.files?.[0] || null)}
                    />
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">
                      PNG, JPG or JPEG · Max 3 MB · Ratio locked 16:9
                    </p>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Action bar */}
          <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white/90 px-5 py-4 shadow-lg backdrop-blur dark:border-gray-800 dark:bg-gray-900/90">
            <AppButton type="submit" disabled={submitting || loading}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Creating…
                </span>
              ) : (
                'Create Course'
              )}
            </AppButton>
            <AppButton type="button" variant="secondary" onClick={() => navigate('/admin/courses')}>
              Cancel
            </AppButton>
          </div>
        </form>
      )}

      <ImageCropperModal
        isOpen={isCropperOpen}
        sourceFile={cropSourceFile}
        onClose={() => {
          setIsCropperOpen(false);
          setCropSourceFile(null);
        }}
        onApply={(croppedFile) => {
          setImageFile(croppedFile);
        }}
        title="Crop Course Thumbnail"
        aspectOptions={COURSE_CROP_ASPECT_OPTIONS}
        lockAspectSelection
      />
    </section>
  );
};

export default AdminCourseCreatePage;