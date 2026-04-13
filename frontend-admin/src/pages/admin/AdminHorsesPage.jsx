import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Eye, Pencil, Star, Trash2 } from 'lucide-react';
import AppButton from '../../components/ui/AppButton';
import FormInput from '../../components/ui/FormInput';
import ImageCropperModal, { DEFAULT_CROP_ASPECT_OPTIONS } from '../../components/ui/ImageCropperModal';
import Modal from '../../components/ui/Modal';
import {
  createHorseApi,
  deleteHorseApi,
  getAllHorsesApi,
  getDisciplinesApi,
  getStablesApi,
  updateHorseApi,
} from '../../features/operations/operationsApi';
import { API_BASE_URL } from '../../lib/axiosInstance';
import useDebouncedValue from '../../hooks/useDebouncedValue';

const uploadBaseUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
const allowedImageTypes = ['image/png', 'image/jpeg', 'image/jpg'];
const maxImageSize = 2 * 1024 * 1024;
const emptyForm = {
  name: '',
  breed: '',
  description: '',
  discipline_id: '',
  stable_id: '',
  status: 'available',
};

const toImageSrc = (value) => {
  if (!value) return '/vite.svg';
  if (/^https?:\/\//i.test(value)) return value;
  return `${uploadBaseUrl}${value}`;
};

const statusColor = (status) => {
  if (status === 'available') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
  if (status === 'busy') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
  if (status === 'resting') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
  if (status === 'injured') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
  return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
};

const AdminHorsesPage = () => {
  const [horses, setHorses] = useState([]);
  const [stables, setStables] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [cropSourceFile, setCropSourceFile] = useState(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [editingHorseId, setEditingHorseId] = useState(null);
  const [isHorseModalOpen, setIsHorseModalOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 300);

  const validateImageFile = (file, requiredOnCreate) => {
    if (!file && requiredOnCreate) return 'Horse image is required.';
    if (!file) return null;
    if (!allowedImageTypes.includes(file.type)) return 'Horse image must be PNG, JPG, or JPEG format.';
    if (file.size > maxImageSize) return 'Horse image size must be less than 2MB.';
    return null;
  };

  const resetForm = () => {
    setForm(emptyForm);
    setImageFile(null);
    setCropSourceFile(null);
    setIsCropperOpen(false);
    setEditingHorseId(null);
    setIsHorseModalOpen(false);
  };

  const fetchPageData = async (targetPage = page, targetSearch = debouncedSearch) => {
    setLoading(true);
    try {
      const [horsesData, stablesData, disciplinesData] = await Promise.all([
        getAllHorsesApi({ page: targetPage, limit: 10, search: targetSearch }),
        getStablesApi({ include_inactive: true, page: 1, limit: 200 }),
        getDisciplinesApi({ include_inactive: true, page: 1, limit: 200 }),
      ]);
      setHorses(Array.isArray(horsesData?.data) ? horsesData.data : Array.isArray(horsesData) ? horsesData : []);
      setPagination(horsesData?.pagination || null);
      setStables(Array.isArray(stablesData?.data) ? stablesData.data : Array.isArray(stablesData) ? stablesData : []);
      setDisciplines(Array.isArray(disciplinesData?.data) ? disciplinesData.data.filter((d) => d.is_active !== false) : Array.isArray(disciplinesData) ? disciplinesData.filter((d) => d.is_active !== false) : []);
    } catch (error) {
      toast.error(error.message || 'Failed to load page data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPageData(page, debouncedSearch);
  }, [page, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const onAddHorse = () => {
    setEditingHorseId(null);
    setForm(emptyForm);
    setImageFile(null);
    setIsHorseModalOpen(true);
  };

  const onEditHorse = (horse) => {
    setEditingHorseId(horse.id);
    setForm({
      name: horse.name || '',
      breed: horse.breed || '',
      description: horse.description || '',
      discipline_id: horse.discipline_id || '',
      stable_id: horse.stable_id || '',
      status: horse.status || 'available',
      is_featured: !!horse.is_featured,
    });
    setImageFile(null);
    setIsHorseModalOpen(true);
  };

  const onSubmitHorse = async (event) => {
    event.preventDefault();
    const validationError = validateImageFile(imageFile, !editingHorseId);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      if (editingHorseId) {
        await updateHorseApi({ horseId: editingHorseId, payload: form, imageFile });
        toast.success('Horse updated successfully.');
      } else {
        await createHorseApi({ payload: form, imageFile });
        toast.success('Horse created successfully.');
      }
      resetForm();
      await fetchPageData(page, debouncedSearch);
    } catch (error) {
      toast.error(error.message || 'Failed to save horse.');
    }
  };

  const onSelectHorseImage = (file) => {
    const validationError = validateImageFile(file, false);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    if (!file) {
      setImageFile(null);
      return;
    }
    setCropSourceFile(file);
    setIsCropperOpen(true);
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Horses</h2>
        <div className="flex flex-wrap items-end gap-2">
          <FormInput
            label="Search"
            name="search_horses"
            placeholder="Search horses"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[240px]"
          />
          <AppButton type="button" onClick={onAddHorse}>
            Add Horse
          </AppButton>
        </div>
      </div>

      {loading ? <p className="text-sm text-gray-500 dark:text-gray-400">Loading horses...</p> : null}

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/60">
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <th className="px-3 py-2">Image</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Breed</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Stable</th>
              <th className="px-3 py-2">Discipline</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Featured</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {horses.map((horse) => (
              <tr key={horse.id} className="border-t border-gray-200 dark:border-gray-800">
                <td className="px-3 py-2">
                  <img src={toImageSrc(horse.profile_picture_url)} alt={horse.name} className="h-10 w-14 rounded-md object-cover" />
                </td>
                <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{horse.name}</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{horse.breed || '-'}</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{horse.description || '-'}</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{horse.stable?.name || '-'}</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{horse.discipline?.name || '-'}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusColor(horse.status)}`}>
                    {horse.status}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await updateHorseApi({ horseId: horse.id, payload: { is_featured: !horse.is_featured } });
                        toast.success(horse.is_featured ? 'Removed from featured' : 'Marked as featured');
                        await fetchPageData(page, debouncedSearch);
                      } catch {
                        toast.error('Failed to update featured status');
                      }
                    }}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                    title={horse.is_featured ? 'Remove from featured' : 'Mark as featured'}
                  >
                    <Star size={16} className={horse.is_featured ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
                  </button>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1.5">
                    <Link
                      to={`/admin/horses/${horse.id}`}
                      state={{ horse }}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      <Eye size={14} />
                      View
                    </Link>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                      onClick={() => onEditHorse(horse)}
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!window.confirm(`Delete horse "${horse.name}"? This cannot be undone.`)) return;
                        try {
                          await deleteHorseApi(horse.id);
                          toast.success('Horse deleted.');
                          await fetchPageData(page, debouncedSearch);
                        } catch (err) {
                          toast.error(err?.response?.data?.message || err.message || 'Failed to delete horse.');
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && !horses.length ? (
              <tr className="border-t border-gray-200 dark:border-gray-800">
                <td colSpan={9} className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No horses found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-end gap-2">
        <AppButton type="button" variant="secondary" className="px-3 py-1.5 text-xs" disabled={!pagination?.hasPrev || loading} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
          Prev
        </AppButton>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Page {pagination?.currentPage || 1} of {pagination?.totalPages || 1} 
        </span>
        <AppButton type="button" variant="secondary" className="px-3 py-1.5 text-xs" disabled={!pagination?.hasNext || loading} onClick={() => setPage((prev) => prev + 1)}>
          Next
        </AppButton>
      </div>

      <Modal isOpen={isHorseModalOpen} title={editingHorseId ? 'Update Horse' : 'Add Horse'} onClose={resetForm}>
        <form className="grid gap-3" onSubmit={onSubmitHorse}>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormInput
              label="Horse Name"
              name="horse_name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
            <FormInput
              label="Breed"
              name="horse_breed"
              value={form.breed}
              onChange={(e) => setForm((prev) => ({ ...prev, breed: e.target.value }))}
            />
            <label className="grid gap-1.5 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Description (optional)
              </span>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Optional horse description"
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Stable</span>
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                value={form.stable_id}
                onChange={(e) => setForm((prev) => ({ ...prev, stable_id: e.target.value }))}
                required
              >
                <option value="">Select Stable</option>
                {stables.map((stable) => (
                  <option key={stable.id} value={stable.id}>
                    {stable.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Discipline</span>
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                value={form.discipline_id}
                onChange={(e) => setForm((prev) => ({ ...prev, discipline_id: e.target.value }))}
                required
              >
                <option value="">Select Discipline</option>
                {disciplines.map((discipline) => (
                  <option key={discipline.id} value={discipline.id}>
                    {discipline.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</span>
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="available">available</option>
                <option value="busy">busy</option>
                <option value="resting">resting</option>
                <option value="injured">injured</option>
              </select>
            </label>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!form.is_featured}
              onChange={(e) => setForm((prev) => ({ ...prev, is_featured: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Featured</span>
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Horse Image {editingHorseId ? '(optional)' : '(required)'}
            </span>
            <input
              className="w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              type="file"
              accept=".png,.jpg,.jpeg"
              onChange={(e) => onSelectHorseImage(e.target.files?.[0] || null)}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              PNG/JPG/JPEG only, max 2MB. Selected: {imageFile?.name || 'none'}
            </p>
          </label>

          <div className="flex flex-wrap gap-2 pt-1">
            <AppButton type="submit">{editingHorseId ? 'Update Horse' : 'Create Horse'}</AppButton>
            <AppButton type="button" variant="secondary" onClick={resetForm}>
              Cancel
            </AppButton>
          </div>
        </form>
      </Modal>

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
        title="Crop Horse Image"
        aspectOptions={DEFAULT_CROP_ASPECT_OPTIONS}
      />

    </section>
  );
};

export default AdminHorsesPage;
