import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Eye, Pencil } from 'lucide-react';
import AppButton from '../../components/ui/AppButton';
import FormInput from '../../components/ui/FormInput';
import Modal from '../../components/ui/Modal';
import {
  createArenaApi,
  getAllArenasApi,
  getDisciplinesApi,
  getStablesApi,
  updateArenaApi,
} from '../../features/operations/operationsApi';
import { API_BASE_URL } from '../../lib/axiosInstance';
import useDebouncedValue from '../../hooks/useDebouncedValue';

const uploadBaseUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
const allowedImageTypes = ['image/png', 'image/jpeg', 'image/jpg'];
const maxImageSize = 2 * 1024 * 1024;
const emptyForm = {
  name: '',
  description: '',
  stable_id: '',
  discipline_id: '',
  capacity: 1,
};

const toImageSrc = (value) => {
  if (!value) return '/vite.svg';
  if (/^https?:\/\//i.test(value)) return value;
  return `${uploadBaseUrl}${value}`;
};

const AdminArenasPage = () => {
  const [arenas, setArenas] = useState([]);
  const [stables, setStables] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [editingArenaId, setEditingArenaId] = useState(null);
  const [isArenaModalOpen, setIsArenaModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedArena, setSelectedArena] = useState(null);
  const debouncedSearch = useDebouncedValue(search, 300);

  const validateImageFile = (file, requiredOnCreate) => {
    if (!file && requiredOnCreate) return 'Arena image is required.';
    if (!file) return null;
    if (!allowedImageTypes.includes(file.type)) return 'Arena image must be PNG, JPG, or JPEG format.';
    if (file.size > maxImageSize) return 'Arena image size must be less than 2MB.';
    return null;
  };

  const resetForm = () => {
    setForm(emptyForm);
    setImageFile(null);
    setEditingArenaId(null);
    setIsArenaModalOpen(false);
  };

  const fetchPageData = async (targetPage = page, targetSearch = debouncedSearch) => {
    setLoading(true);
    try {
      const [arenasData, stablesData, disciplinesData] = await Promise.all([
        getAllArenasApi({ page: targetPage, limit: 10, search: targetSearch }),
        getStablesApi({ include_inactive: true, page: 1, limit: 200 }),
        getDisciplinesApi({ include_inactive: true, page: 1, limit: 200 }),
      ]);
      setArenas(Array.isArray(arenasData?.data) ? arenasData.data : Array.isArray(arenasData) ? arenasData : []);
      setPagination(arenasData?.pagination || null);
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

  const onAddArena = () => {
    setEditingArenaId(null);
    setForm(emptyForm);
    setImageFile(null);
    setIsArenaModalOpen(true);
  };

  const onEditArena = (arena) => {
    setEditingArenaId(arena.id);
    setForm({
      name: arena.name || '',
      description: arena.description || '',
      stable_id: arena.stable_id || '',
      discipline_id: arena.discipline_id || '',
      capacity: arena.capacity || 1,
    });
    setImageFile(null);
    setIsArenaModalOpen(true);
  };

  const onViewArena = (arena) => {
    setSelectedArena(arena);
    setIsViewModalOpen(true);
  };

  const onSubmitArena = async (event) => {
    event.preventDefault();
    const validationError = validateImageFile(imageFile, !editingArenaId);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      if (editingArenaId) {
        await updateArenaApi({ arenaId: editingArenaId, payload: form, imageFile });
        toast.success('Arena updated successfully.');
      } else {
        await createArenaApi({ payload: form, imageFile });
        toast.success('Arena created successfully.');
      }
      resetForm();
      await fetchPageData(page, debouncedSearch);
    } catch (error) {
      toast.error(error.message || 'Failed to save arena.');
    }
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Arenas</h2>
        <div className="flex flex-wrap items-end gap-2">
          <FormInput
            label="Search"
            name="search_arenas"
            placeholder="Search arenas"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[240px]"
          />
          <AppButton type="button" onClick={onAddArena}>
            Add Arena
          </AppButton>
        </div>
      </div>

      {loading ? <p className="text-sm text-gray-500 dark:text-gray-400">Loading arenas...</p> : null}

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/60">
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <th className="px-3 py-2">Image</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Stable</th>
              <th className="px-3 py-2">Discipline</th>
              <th className="px-3 py-2">Capacity</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {arenas.map((arena) => (
              <tr key={arena.id} className="border-t border-gray-200 dark:border-gray-800">
                <td className="px-3 py-2">
                  <img src={toImageSrc(arena.image_url)} alt={arena.name} className="h-10 w-14 rounded-md object-cover" />
                </td>
                <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{arena.name}</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{arena.description || '-'}</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{arena.stable?.name || '-'}</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{arena.discipline?.name || '-'}</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{arena.capacity}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                      onClick={() => onViewArena(arena)}
                    >
                      <Eye size={14} />
                      View
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                      onClick={() => onEditArena(arena)}
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && !arenas.length ? (
              <tr className="border-t border-gray-200 dark:border-gray-800">
                <td colSpan={7} className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No arenas found.
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

      <Modal isOpen={isArenaModalOpen} title={editingArenaId ? 'Update Arena' : 'Add Arena'} onClose={resetForm}>
        <form className="grid gap-3" onSubmit={onSubmitArena}>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormInput
              label="Arena Name"
              name="arena_name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
            <FormInput
              label="Capacity"
              name="arena_capacity"
              type="number"
              value={form.capacity}
              onChange={(e) => setForm((prev) => ({ ...prev, capacity: e.target.value }))}
              required
            />
            <label className="grid gap-1.5 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Description (optional)
              </span>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Optional arena description"
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Stable</span>
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
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
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
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
          </div>

          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Arena Image {editingArenaId ? '(optional)' : '(required)'}
            </span>
            <input
              className="w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              type="file"
              accept=".png,.jpg,.jpeg"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">PNG/JPG/JPEG only, max 2MB.</p>
          </label>

          <div className="flex flex-wrap gap-2 pt-1">
            <AppButton type="submit">{editingArenaId ? 'Update Arena' : 'Create Arena'}</AppButton>
            <AppButton type="button" variant="secondary" onClick={resetForm}>
              Cancel
            </AppButton>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isViewModalOpen}
        title={selectedArena?.name ? `Arena Details - ${selectedArena.name}` : 'Arena Details'}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedArena(null);
        }}
      >
        {selectedArena ? (
          <div className="grid gap-4">
            <img
              src={toImageSrc(selectedArena.image_url)}
              alt={selectedArena.name}
              className="h-52 w-full rounded-xl object-cover"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Name</p>
                <p className="text-sm text-gray-900 dark:text-gray-100">{selectedArena.name || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Capacity</p>
                <p className="text-sm text-gray-900 dark:text-gray-100">{selectedArena.capacity ?? '-'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Stable</p>
                <p className="text-sm text-gray-900 dark:text-gray-100">{selectedArena.stable?.name || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Discipline</p>
                <p className="text-sm text-gray-900 dark:text-gray-100">{selectedArena.discipline?.name || '-'}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Description
              </p>
              <p className="text-sm text-gray-900 dark:text-gray-100">{selectedArena.description || '-'}</p>
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  );
};

export default AdminArenasPage;
