import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  Plus,
  Eye,
  Pencil,
  Loader2,
  Tag,
  UploadCloud,
  ImageOff,
  ChevronRight,
  Search,
} from "lucide-react";
import FormInput from "../../components/ui/FormInput";
import ImageCropperModal, {
  SQUARE_CROP_ASPECT_OPTIONS,
} from "../../components/ui/ImageCropperModal";
import Modal from "../../components/ui/Modal";
import {
  createDisciplineApi,
  getDisciplineByIdApi,
  getDisciplinesApi,
  updateDisciplineApi,
} from "../../features/operations/operationsApi";
import { API_BASE_URL } from "../../lib/axiosInstance";
import useDebouncedValue from "../../hooks/useDebouncedValue";

const emptyForm = {
  name: "",
  description: "",
  difficulty_level: "",
  is_active: true,
};
const allowedImageTypes = ["image/png", "image/jpeg", "image/jpg"];
const maxImageSize = 2 * 1024 * 1024;
const uploadBaseUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

const toImageSrc = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${uploadBaseUrl}${value}`;
};

// ── Difficulty config ────────────────────────────────────────────────────────
const difficultyConfig = {
  beginner: {
    label: "Beginner",
    cls: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
  },
  intermediate: {
    label: "Intermediate",
    cls: "bg-emerald-50   dark:bg-emerald-500/10   text-emerald-700   dark:text-emerald-400   border-emerald-200   dark:border-emerald-500/30",
  },
  advanced: {
    label: "Advanced",
    cls: "bg-red-50     dark:bg-red-500/10     text-red-700     dark:text-red-400     border-red-200     dark:border-red-500/30",
  },
};
const getDifficultyCls = (level = "") =>
  difficultyConfig[level.toLowerCase()]?.cls ??
  "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700";

// ── Shared field styles ──────────────────────────────────────────────────────
const fieldLabel =
  "block text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5";

const fieldInput =
  "w-full bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 " +
  "text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 " +
  "rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 " +
  "focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-600";

// ── Small helper components ──────────────────────────────────────────────────
const DetailRow = ({ label, children }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
      {label}
    </span>
    <span className="text-sm text-gray-800 dark:text-gray-200">
      {children || "—"}
    </span>
  </div>
);

const StatusBadge = ({ active }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
      active
        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
        : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700"
    }`}
  >
    <span
      className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500 dark:bg-emerald-400" : "bg-gray-400 dark:bg-gray-500"}`}
    />
    {active ? "Active" : "Inactive"}
  </span>
);

// ── Shared form fields (used in both Create & Edit modals) ───────────────────
const DisciplineFormFields = ({
  form,
  setForm,
  iconFile,
  onSelectIconFile,
  isEdit = false,
}) => (
  <>
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className={fieldLabel}>
          Discipline Name <span className="text-red-400">*</span>
        </label>
        <FormInput
          name="name"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          placeholder="e.g. Dressage"
          required
          className={fieldInput}
        />
      </div>

      <div>
        <label className={fieldLabel}>Difficulty Level</label>
        <select
          name="difficulty_level"
          value={form.difficulty_level}
          onChange={(e) =>
            setForm((p) => ({ ...p, difficulty_level: e.target.value }))
          }
          className={fieldInput + " appearance-none cursor-pointer"}
        >
          <option value="">Select level</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>
    </div>

    {isEdit && (
      <div>
        <label className={fieldLabel}>Status</label>
        <select
          name="is_active"
          value={form.is_active ? "true" : "false"}
          onChange={(e) =>
            setForm((p) => ({ ...p, is_active: e.target.value === "true" }))
          }
          className={fieldInput + " appearance-none cursor-pointer"}
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>
    )}

    <div>
      <label className={fieldLabel}>Description</label>
      <textarea
        name="description"
        rows={3}
        value={form.description}
        onChange={(e) =>
          setForm((p) => ({ ...p, description: e.target.value }))
        }
        placeholder="Brief description of this discipline…"
        className={fieldInput + " resize-none"}
      />
    </div>

    <div>
      <label className={fieldLabel}>
        Icon{" "}
        <span className="normal-case font-normal text-gray-400 dark:text-gray-600">
          (optional · PNG / JPG · max 2 MB
          {isEdit ? " · leave empty to keep current" : ""})
        </span>
      </label>
      <label className="flex items-center gap-3 cursor-pointer rounded-xl border border-dashed border-gray-300 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-500 bg-gray-50 dark:bg-gray-800/40 px-4 py-3 transition-colors group">
        <UploadCloud className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors shrink-0" />
        <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors truncate">
          {iconFile ? iconFile.name : "Click to upload icon"}
        </span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onSelectIconFile(e.target.files?.[0] || null)}
        />
      </label>
    </div>
  </>
);

// ── Page ─────────────────────────────────────────────────────────────────────
const AdminDisciplinesPage = () => {
  const [disciplines, setDisciplines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [iconFile, setIconFile] = useState(null);
  const [cropSourceFile, setCropSourceFile] = useState(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [selectedDiscipline, setSelectedDiscipline] = useState(null);
  const debouncedSearch = useDebouncedValue(search, 300);

  const fetchDisciplines = async (targetPage = page, targetSearch = debouncedSearch) => {
    setLoading(true);
    try {
      const response = await getDisciplinesApi({
        include_inactive: true,
        page: targetPage,
        limit: 10,
        search: targetSearch,
      });
      const list = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      setDisciplines(list);
      setPagination(response?.pagination || null);
    } catch (err) {
      toast.error(err.message || "Failed to load disciplines.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisciplines(page, debouncedSearch);
  }, [page, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const resetCreateForm = () => {
    setForm(emptyForm);
    setIconFile(null);
    setCropSourceFile(null);
    setIsCropperOpen(false);
    setIsCreateModalOpen(false);
  };
  const resetEditForm = () => {
    setForm(emptyForm);
    setIconFile(null);
    setCropSourceFile(null);
    setIsCropperOpen(false);
    setEditingId(null);
    setIsEditModalOpen(false);
  };

  const validateIconFile = (file) => {
    if (!file) return null;
    if (!allowedImageTypes.includes(file.type))
      return "Icon must be PNG, JPG, or JPEG.";
    if (file.size > maxImageSize) return "Icon must be smaller than 2 MB.";
    return null;
  };

  const onSelectIconFile = (file) => {
    if (!file) {
      setIconFile(null);
      return;
    }
    const err = validateIconFile(file);
    if (err) {
      toast.error(err);
      return;
    }
    setCropSourceFile(file);
    setIsCropperOpen(true);
  };

  const onCreateDiscipline = async (e) => {
    e.preventDefault();
    const err = validateIconFile(iconFile);
    if (err) {
      toast.error(err);
      return;
    }
    try {
      await createDisciplineApi({ payload: form, iconFile });
      toast.success("Discipline created.");
      resetCreateForm();
      await fetchDisciplines(page, debouncedSearch);
    } catch (err) {
      toast.error(err.message || "Failed to create discipline.");
    }
  };

  const onEditDiscipline = (d) => {
    setEditingId(d.id);
    setForm({
      name: d.name || "",
      description: d.description || "",
      difficulty_level: d.difficulty_level || "",
      is_active: d.is_active !== false,
    });
    setIconFile(null);
    setIsEditModalOpen(true);
  };

  const onUpdateDiscipline = async (e) => {
    e.preventDefault();
    if (iconFile) {
      const err = validateIconFile(iconFile);
      if (err) {
        toast.error(err);
        return;
      }
    }
    try {
      await updateDisciplineApi({
        disciplineId: editingId,
        payload: form,
        iconFile,
      });
      toast.success("Discipline updated.");
      resetEditForm();
      await fetchDisciplines(page, debouncedSearch);
    } catch (err) {
      toast.error(err.message || "Failed to update discipline.");
    }
  };

  const onViewDiscipline = async (id) => {
    setIsViewModalOpen(true);
    setViewLoading(true);
    setSelectedDiscipline(null);
    try {
      setSelectedDiscipline(await getDisciplineByIdApi(id));
    } catch (err) {
      toast.error(err.message || "Failed to load details.");
      setIsViewModalOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* ── Page header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Disciplines
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {loading
              ? "Loading…"
              : `${disciplines.length} discipline${disciplines.length !== 1 ? "s" : ""} total`}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Search
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search disciplines"
                className="min-w-[240px] rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-800 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          </label>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all shadow-md shadow-emerald-500/25 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Add Discipline
          </button>
        </div>
      </div>

      {/* ── Table card ── */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40">
                {["Discipline", "Difficulty", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {/* Loading */}
              {loading && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400 dark:text-gray-500 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading disciplines…
                    </div>
                  </td>
                </tr>
              )}

              {/* Empty */}
              {!loading && disciplines.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                        <Tag className="w-5 h-5 text-gray-400 dark:text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          No disciplines yet
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          Get started by adding your first discipline.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-medium hover:text-emerald-500 transition-colors mt-1"
                      >
                        Add discipline <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Rows */}
              {!loading &&
                disciplines.map((d) => (
                  <tr
                    key={d.id}
                    className="group transition-colors duration-100 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                  >
                    {/* Discipline name + icon */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {d.icon_url ? (
                          <img
                            src={toImageSrc(d.icon_url)}
                            alt={d.name}
                            className="w-9 h-9 rounded-xl object-cover border border-gray-200 dark:border-gray-700 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
                            <ImageOff className="w-4 h-4 text-gray-400 dark:text-gray-600" />
                          </div>
                        )}
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {d.name}
                        </span>
                      </div>
                    </td>

                    {/* Difficulty */}
                    <td className="px-5 py-3.5">
                      {d.difficulty_level ? (
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${getDifficultyCls(d.difficulty_level)}`}
                        >
                          {d.difficulty_level}
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600 text-xs">
                          —
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <StatusBadge active={d.is_active} />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onViewDiscipline(d.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditDiscipline(d)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900/40 px-2.5 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          disabled={!pagination?.hasPrev || loading}
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Prev
        </button>
        <span className="text-xs text-gray-400">
          Page {pagination?.currentPage || 1} of {pagination?.totalPages || 1}
        </span>
        <button
          type="button"
          disabled={!pagination?.hasNext || loading}
          onClick={() => setPage((prev) => prev + 1)}
          className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Next
        </button>
      </div>

      {/* ── Create Modal ── */}
      <Modal
        isOpen={isCreateModalOpen}
        title="Add New Discipline"
        onClose={resetCreateForm}
      >
        <form className="flex flex-col gap-4" onSubmit={onCreateDiscipline}>
          <DisciplineFormFields
            form={form}
            setForm={setForm}
            iconFile={iconFile}
            onSelectIconFile={onSelectIconFile}
          />
          <div className="flex items-center gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-white transition-all shadow-md shadow-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Create Discipline
            </button>
            <button
              type="button"
              onClick={resetCreateForm}
              className="inline-flex items-center rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal
        isOpen={isEditModalOpen}
        title="Edit Discipline"
        onClose={resetEditForm}
      >
        <form className="flex flex-col gap-4" onSubmit={onUpdateDiscipline}>
          <DisciplineFormFields
            form={form}
            setForm={setForm}
            iconFile={iconFile}
            onSelectIconFile={onSelectIconFile}
            isEdit
          />
          <div className="flex items-center gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-white transition-all shadow-md shadow-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
            >
              <Pencil className="w-4 h-4" />
              Update Discipline
            </button>
            <button
              type="button"
              onClick={resetEditForm}
              className="inline-flex items-center rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* ── View Modal ── */}
      <Modal
        isOpen={isViewModalOpen}
        title={selectedDiscipline?.name ?? "Discipline Details"}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedDiscipline(null);
        }}
      >
        {viewLoading && (
          <div className="flex items-center justify-center gap-2 py-12 text-gray-400 dark:text-gray-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading details…
          </div>
        )}

        {!viewLoading && selectedDiscipline && (
          <div className="flex gap-5">
            {/* Left — square image */}
            <div className="shrink-0">
              <div className="size-24 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/60">
                {selectedDiscipline.icon_url ? (
                  <img
                    src={toImageSrc(selectedDiscipline.icon_url)}
                    alt={selectedDiscipline.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full flex-col items-center justify-center gap-1">
                    <ImageOff
                      size={20}
                      className="text-gray-300 dark:text-gray-600"
                    />
                    <p className="text-[10px] text-gray-300 dark:text-gray-600">
                      No image
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right — details */}
            <div className="min-w-0 flex-1 grid gap-3">
              {/* Name + badges row */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Name
                </p>
                <p className="mt-0.5 truncate text-base font-bold text-gray-900 dark:text-gray-100">
                  {selectedDiscipline.name}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge active={selectedDiscipline.is_active} />
                {selectedDiscipline.difficulty_level && (
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${getDifficultyCls(selectedDiscipline.difficulty_level)}`}
                  >
                    {selectedDiscipline.difficulty_level}
                  </span>
                )}
              </div>

              {selectedDiscipline.description && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Description
                  </p>
                  <p className="mt-0.5 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                    {selectedDiscipline.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ImageCropperModal
        isOpen={isCropperOpen}
        sourceFile={cropSourceFile}
        onClose={() => {
          setIsCropperOpen(false);
          setCropSourceFile(null);
        }}
        onApply={(croppedFile) => {
          setIconFile(croppedFile);
        }}
        title="Crop Discipline Icon"
        aspectOptions={SQUARE_CROP_ASPECT_OPTIONS}
        lockAspectSelection
      />
    </div>
  );
};

export default AdminDisciplinesPage;
