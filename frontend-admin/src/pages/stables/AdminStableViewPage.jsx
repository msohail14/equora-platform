import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AppButton from '../../components/ui/AppButton';
import FormInput from '../../components/ui/FormInput';
import Modal from '../../components/ui/Modal';
import { API_BASE_URL } from '../../lib/axiosInstance';
import PlacesAutocomplete from '../../components/ui/PlacesAutocomplete';
import {
  createArenaApi,
  createHorseApi,
  deleteArenaApi,
  deleteHorseApi,
  deleteStableApi,
  getArenasByStableApi,
  getCoachesApi,
  getDisciplinesApi,
  getHorsesByStableApi,
  getStableByIdApi,
  getStableLinkedCoachesApi,
  inviteStableOwnerApi,
  linkCoachToStableApi,
  unlinkCoachFromStableApi,
  updateArenaApi,
  updateHorseApi,
  updateStableApi,
} from '../../features/operations/operationsApi';

const emptyArenaForm = { name: '', description: '', capacity: 1, discipline_id: '' };
const emptyHorseForm = { name: '', breed: '', description: '', discipline_id: '', status: 'available' };
const horseStatusOrder = ['available', 'busy', 'resting', 'injured'];
const allowedImageTypes = ['image/png', 'image/jpeg', 'image/jpg'];
const maxImageSize = 2 * 1024 * 1024;
const uploadBaseUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

const TABS = ['Arenas', 'Horses', 'Linked Coaches'];
const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const defaultOperatingHours = () =>
  Object.fromEntries(DAYS_OF_WEEK.map((day) => [day, { open: '06:00', close: '22:00', is_closed: false }]));

const statusColors = {
  available: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  busy: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  resting: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  injured: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

const coachTypeBadge = {
  freelance: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  stable: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
};

const validateImageFile = (file, label) => {
  if (!file) return `${label} is required.`;
  if (!allowedImageTypes.includes(file.type)) {
    return `${label} must be PNG, JPG, or JPEG format.`;
  }
  if (file.size > maxImageSize) {
    return `${label} size must be less than 2MB.`;
  }
  return null;
};

const toImageSrc = (value) => {
  if (!value) return '/vite.svg';
  if (/^https?:\/\//i.test(value)) return value;
  return `${uploadBaseUrl}${value}`;
};

const AdminStableViewPage = () => {
  const { stableId } = useParams();
  const navigate = useNavigate();

  const [stable, setStable] = useState(null);
  const [arenas, setArenas] = useState([]);
  const [horses, setHorses] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Arenas');

  const [isStableModalOpen, setIsStableModalOpen] = useState(false);
  const [stableForm, setStableForm] = useState({
    name: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    contact_phone: '',
    contact_email: '',
    latitude: '',
    longitude: '',
    description: '',
  });
  const [stableLogoFile, setStableLogoFile] = useState(null);
  const [operatingHours, setOperatingHours] = useState(defaultOperatingHours);

  const [arenaForm, setArenaForm] = useState(emptyArenaForm);
  const [arenaImageFile, setArenaImageFile] = useState(null);
  const [editingArenaId, setEditingArenaId] = useState(null);
  const [isArenaModalOpen, setIsArenaModalOpen] = useState(false);

  const [horseForm, setHorseForm] = useState(emptyHorseForm);
  const [horseImageFile, setHorseImageFile] = useState(null);
  const [editingHorseId, setEditingHorseId] = useState(null);
  const [isHorseModalOpen, setIsHorseModalOpen] = useState(false);

  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [ownerForm, setOwnerForm] = useState({ email: '', password: '', firstName: '', lastName: '' });

  const [linkedCoaches, setLinkedCoaches] = useState([]);
  const [coachesLoading, setCoachesLoading] = useState(false);
  const [isAddCoachModalOpen, setIsAddCoachModalOpen] = useState(false);
  const [allCoaches, setAllCoaches] = useState([]);
  const [coachSearch, setCoachSearch] = useState('');
  const [addingCoachId, setAddingCoachId] = useState(null);

  const disciplineOptions = useMemo(
    () => disciplines.filter((d) => d.is_active !== false),
    [disciplines]
  );

  const refreshStableData = async () => {
    setLoading(true);
    try {
      const [stableData, arenasData, horsesData, disciplinesData] = await Promise.all([
        getStableByIdApi(stableId),
        getArenasByStableApi(stableId, { page: 1, limit: 200 }),
        getHorsesByStableApi(stableId, { page: 1, limit: 200 }),
        getDisciplinesApi({ include_inactive: true, page: 1, limit: 200 }),
      ]);
      setStable(stableData);
      setArenas(Array.isArray(arenasData?.data) ? arenasData.data : Array.isArray(arenasData) ? arenasData : []);
      setHorses(Array.isArray(horsesData?.data) ? horsesData.data : Array.isArray(horsesData) ? horsesData : []);
      setDisciplines(Array.isArray(disciplinesData?.data) ? disciplinesData.data : Array.isArray(disciplinesData) ? disciplinesData : []);
      setStableForm({
        name: stableData.name || '',
        city: stableData.city || '',
        state: stableData.state || '',
        country: stableData.country || '',
        pincode: stableData.pincode || '',
        contact_phone: stableData.contact_phone || '',
        contact_email: stableData.contact_email || '',
        latitude: stableData.latitude ?? '',
        longitude: stableData.longitude ?? '',
        description: stableData.description || '',
      });
      if (stableData.operating_hours && typeof stableData.operating_hours === 'object') {
        setOperatingHours({ ...defaultOperatingHours(), ...stableData.operating_hours });
      } else {
        setOperatingHours(defaultOperatingHours());
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load stable data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLinkedCoaches = useCallback(async () => {
    setCoachesLoading(true);
    try {
      const res = await getStableLinkedCoachesApi(stableId);
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setLinkedCoaches(list);
    } catch (err) {
      toast.error(err.message || 'Failed to load linked coaches.');
    } finally {
      setCoachesLoading(false);
    }
  }, [stableId]);

  useEffect(() => {
    refreshStableData();
  }, [stableId]);

  useEffect(() => {
    if (activeTab === 'Linked Coaches') {
      fetchLinkedCoaches();
    }
  }, [activeTab, fetchLinkedCoaches]);

  const resetArenaForm = () => {
    setArenaForm(emptyArenaForm);
    setArenaImageFile(null);
    setEditingArenaId(null);
    setIsArenaModalOpen(false);
  };

  const resetHorseForm = () => {
    setHorseForm(emptyHorseForm);
    setHorseImageFile(null);
    setEditingHorseId(null);
    setIsHorseModalOpen(false);
  };

  const handlePlaceSelect = (place) => {
    setStableForm((prev) => ({
      ...prev,
      name: place.name || prev.name,
      city: place.city || prev.city,
      state: place.state || prev.state,
      country: place.country || prev.country,
      pincode: place.pincode || prev.pincode,
      latitude: place.latitude ?? prev.latitude,
      longitude: place.longitude ?? prev.longitude,
      contact_phone: place.contact_phone || prev.contact_phone,
    }));
  };

  const onStableSave = async () => {
    if (!stableForm.name || !stableForm.city || !stableForm.state || !stableForm.country || !stableForm.pincode) {
      toast.error('Name, city, state, country, and pincode are required.');
      return;
    }
    try {
      const payload = { ...stableForm, operating_hours: JSON.stringify(operatingHours) };
      await updateStableApi({ stableId, payload, logoFile: stableLogoFile });
      toast.success('Stable updated successfully.');
      setIsStableModalOpen(false);
      setStableLogoFile(null);
      await refreshStableData();
    } catch (err) {
      toast.error(err.message || 'Failed to update stable.');
    }
  };

  const onStableToggleActive = async () => {
    if (!stable) return;
    try {
      await updateStableApi({ stableId, payload: { is_active: !stable.is_active } });
      toast.success(`Stable ${stable.is_active ? 'deactivated' : 'activated'} successfully.`);
      await refreshStableData();
    } catch (err) {
      toast.error(err.message || 'Failed to toggle stable status.');
    }
  };

  const onStableDelete = async () => {
    const confirmed = window.confirm('Delete this stable and related data?');
    if (!confirmed) return;
    try {
      await deleteStableApi(stableId);
      toast.success('Stable deleted successfully.');
      navigate('/admin/stables');
    } catch (err) {
      toast.error(err.message || 'Failed to delete stable.');
    }
  };

  const onArenaSubmit = async (event) => {
    event.preventDefault();

    if (!editingArenaId) {
      const validationError = validateImageFile(arenaImageFile, 'Arena image');
      if (validationError) {
        toast.error(validationError);
        return;
      }
    } else if (arenaImageFile) {
      const validationError = validateImageFile(arenaImageFile, 'Arena image');
      if (validationError) {
        toast.error(validationError);
        return;
      }
    }

    try {
      const payload = { ...arenaForm, stable_id: stableId };
      if (editingArenaId) {
        await updateArenaApi({ arenaId: editingArenaId, payload, imageFile: arenaImageFile });
        toast.success('Arena updated successfully.');
      } else {
        await createArenaApi({ payload, imageFile: arenaImageFile });
        toast.success('Arena created successfully.');
      }
      resetArenaForm();
      await refreshStableData();
    } catch (err) {
      toast.error(err.message || 'Failed to save arena.');
    }
  };

  const onArenaEdit = (arena) => {
    setEditingArenaId(arena.id);
    setArenaForm({
      name: arena.name || '',
      description: arena.description || '',
      capacity: arena.capacity || 1,
      discipline_id: arena.discipline_id || '',
    });
    setArenaImageFile(null);
    setIsArenaModalOpen(true);
  };

  const onArenaAdd = () => {
    setEditingArenaId(null);
    setArenaForm(emptyArenaForm);
    setArenaImageFile(null);
    setIsArenaModalOpen(true);
  };

  const onArenaDelete = async (arenaId) => {
    const confirmed = window.confirm('Delete this arena?');
    if (!confirmed) return;
    try {
      await deleteArenaApi(arenaId);
      toast.success('Arena deleted successfully.');
      await refreshStableData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete arena.');
    }
  };

  const onHorseSubmit = async (event) => {
    event.preventDefault();

    if (!editingHorseId) {
      const validationError = validateImageFile(horseImageFile, 'Horse image');
      if (validationError) {
        toast.error(validationError);
        return;
      }
    } else if (horseImageFile) {
      const validationError = validateImageFile(horseImageFile, 'Horse image');
      if (validationError) {
        toast.error(validationError);
        return;
      }
    }

    try {
      const payload = { ...horseForm, stable_id: stableId };
      if (editingHorseId) {
        await updateHorseApi({ horseId: editingHorseId, payload, imageFile: horseImageFile });
        toast.success('Horse updated successfully.');
      } else {
        await createHorseApi({ payload, imageFile: horseImageFile });
        toast.success('Horse added successfully.');
      }
      resetHorseForm();
      await refreshStableData();
    } catch (err) {
      toast.error(err.message || 'Failed to save horse.');
    }
  };

  const onHorseEdit = (horse) => {
    setEditingHorseId(horse.id);
    setHorseForm({
      name: horse.name || '',
      breed: horse.breed || '',
      description: horse.description || '',
      discipline_id: horse.discipline_id || '',
      status: horse.status || 'available',
    });
    setHorseImageFile(null);
    setIsHorseModalOpen(true);
  };

  const onHorseAdd = () => {
    setEditingHorseId(null);
    setHorseForm(emptyHorseForm);
    setHorseImageFile(null);
    setIsHorseModalOpen(true);
  };

  const onHorseDelete = async (horseId) => {
    const confirmed = window.confirm('Delete this horse?');
    if (!confirmed) return;
    try {
      await deleteHorseApi(horseId);
      toast.success('Horse deleted successfully.');
      await refreshStableData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete horse.');
    }
  };

  const onHorseToggleActive = async (horse) => {
    try {
      const nextStatus = horse.status === 'available' ? 'resting' : 'available';
      await updateHorseApi({ horseId: horse.id, payload: { status: nextStatus } });
      toast.success(`Horse ${nextStatus === 'available' ? 'activated' : 'deactivated'} successfully.`);
      await refreshStableData();
    } catch (err) {
      toast.error(err.message || 'Failed to toggle horse status.');
    }
  };

  const openAddCoachModal = async () => {
    setIsAddCoachModalOpen(true);
    setCoachSearch('');
    try {
      const res = await getCoachesApi({ include_inactive: false, page: 1, limit: 200 });
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setAllCoaches(list);
    } catch (err) {
      toast.error(err.message || 'Failed to load coaches.');
    }
  };

  const handleLinkCoach = async (coachId) => {
    setAddingCoachId(coachId);
    try {
      await linkCoachToStableApi(stableId, coachId);
      toast.success('Coach linked to stable.');
      setIsAddCoachModalOpen(false);
      await fetchLinkedCoaches();
    } catch (err) {
      toast.error(err.message || 'Failed to link coach.');
    } finally {
      setAddingCoachId(null);
    }
  };

  const handleUnlinkCoach = async (coachId) => {
    const confirmed = window.confirm('Remove this coach from the stable?');
    if (!confirmed) return;
    try {
      await unlinkCoachFromStableApi(stableId, coachId);
      toast.success('Coach removed from stable.');
      await fetchLinkedCoaches();
    } catch (err) {
      toast.error(err.message || 'Failed to unlink coach.');
    }
  };

  const handleAssignOwner = async (e) => {
    e.preventDefault();
    if (!ownerForm.email || !ownerForm.password) {
      toast.error('Email and password are required.');
      return;
    }
    try {
      await inviteStableOwnerApi(stableId, ownerForm);
      toast.success('Owner account created and assigned.');
      setIsOwnerModalOpen(false);
      setOwnerForm({ email: '', password: '', firstName: '', lastName: '' });
      await refreshStableData();
    } catch (err) {
      toast.error(err.message || 'Failed to assign owner.');
    }
  };

  const updateDayHours = (day, field, value) => {
    setOperatingHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const linkedCoachIds = useMemo(
    () => new Set(linkedCoaches.map((c) => c.id || c.coach_id)),
    [linkedCoaches]
  );

  const filteredCoaches = useMemo(() => {
    const q = coachSearch.toLowerCase();
    return allCoaches.filter((c) => {
      if (linkedCoachIds.has(c.id)) return false;
      if (!q) return true;
      const name = `${c.first_name || ''} ${c.last_name || ''} ${c.email || ''}`.toLowerCase();
      return name.includes(q);
    });
  }, [allCoaches, coachSearch, linkedCoachIds]);

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading stable details…</p>
        </div>
      </div>
    );

  if (!stable)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <p className="text-gray-500 dark:text-gray-400">Stable not found.</p>
      </div>
    );

  const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1';
  const inputCls =
    'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-emerald-400';
  const selectCls =
    'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';

  return (
    <div className="min-h-screen bg-gray-50 pb-16 dark:bg-gray-950">
      {/* Top bar */}
      <header className=" border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button
            onClick={() => navigate('/admin/stables')}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Stables
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onStableToggleActive}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                stable.is_active
                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50'
                  : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300'
              }`}
            >
              {stable.is_active ? 'Deactivate' : 'Activate'}
            </button>
            <button
              onClick={() => setIsStableModalOpen(true)}
              className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600"
            >
              Edit Stable
            </button>
            <button
              onClick={onStableDelete}
              className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
            >
              Delete
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Stable Hero Card */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="h-2 bg-gradient-to-r from-emerald-400 via-emerald-500 to-stone-500" />
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">{stable.name}</h1>
                {([stable.city, stable.state, stable.country, stable.pincode].filter(Boolean).length > 0 || stable.location_address) && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {[stable.city, stable.state, stable.country, stable.pincode].filter(Boolean).join(', ') || stable.location_address}
                  </p>
                )}
              </div>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  stable.is_active
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${stable.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                {stable.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {stable.contact_phone && (
                <span className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {stable.contact_phone}
                </span>
              )}
              {stable.contact_email && (
                <span className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {stable.contact_email}
                </span>
              )}
              <span className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                🏟 {arenas.length} Arena{arenas.length !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                🐴 {horses.length} Horse{horses.length !== 1 ? 's' : ''}
              </span>
            </div>

            {stable.description && (
              <p className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{stable.description}</p>
            )}

            {/* Owner Info */}
            <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Stable Owner</h3>
              {stable.owner ? (
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {`${stable.owner.first_name || ''} ${stable.owner.last_name || ''}`.trim() || 'Unnamed'}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">{stable.owner.email}</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    {stable.owner.role}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 dark:text-gray-500">No owner assigned</span>
                  <button
                    type="button"
                    onClick={() => setIsOwnerModalOpen(true)}
                    className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600"
                  >
                    Assign Owner
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1 dark:border-gray-800 dark:bg-gray-900">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab
                  ? 'bg-white text-emerald-700 shadow-sm dark:bg-gray-800 dark:text-emerald-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Arenas Tab */}
        {activeTab === 'Arenas' && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Arenas</h2>
              <button
                onClick={onArenaAdd}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Arena
              </button>
            </div>

            {arenas.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center dark:border-gray-800">
                <p className="text-sm text-gray-400 dark:text-gray-500">No arenas yet. Add one to get started.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {arenas.map((arena) => (
                  <div
                    key={arena.id}
                    className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                  >
                    <img
                      src={toImageSrc(arena.image_url)}
                      alt={arena.name}
                      className="mb-3 h-32 w-full rounded-xl object-cover"
                    />
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{arena.name}</h3>
                        {arena.description ? (
                          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{arena.description}</p>
                        ) : null}
                      </div>
                      <div className="flex gap-1.5 opacity-0 transition group-hover:opacity-100">
                        <button
                          onClick={() => onArenaEdit(arena)}
                          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-emerald-600 dark:hover:bg-gray-800 dark:hover:text-emerald-400"
                          title="Edit"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onArenaDelete(arena.id)}
                          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                          title="Delete"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-md bg-gray-100 px-2 py-1 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        Capacity: {arena.capacity}
                      </span>
                      {disciplines.find((d) => d.id === arena.discipline_id) && (
                        <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                          {disciplines.find((d) => d.id === arena.discipline_id)?.name}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Horses Tab */}
        {activeTab === 'Horses' && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Horses</h2>
              <button
                onClick={onHorseAdd}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Horse
              </button>
            </div>

            {horses.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center dark:border-gray-800">
                <p className="text-sm text-gray-400 dark:text-gray-500">No horses yet. Add one to get started.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {horses.map((horse) => (
                  <div
                    key={horse.id}
                    className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                  >
                    <img
                      src={toImageSrc(horse.profile_picture_url)}
                      alt={horse.name}
                      className="mb-3 h-32 w-full rounded-xl object-cover"
                    />
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{horse.name}</h3>
                        {horse.breed && (
                          <p className="text-xs text-gray-400 dark:text-gray-500">{horse.breed}</p>
                        )}
                        {horse.description ? (
                          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{horse.description}</p>
                        ) : null}
                      </div>
                      <div className="flex gap-1.5 opacity-0 transition group-hover:opacity-100">
                        <button
                          onClick={() => onHorseEdit(horse)}
                          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-emerald-600 dark:hover:bg-gray-800 dark:hover:text-emerald-400"
                          title="Edit"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onHorseToggleActive(horse)}
                          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400"
                          title={horse.status === 'available' ? 'Deactivate' : 'Activate'}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onHorseDelete(horse.id)}
                          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                          title="Delete"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className={`rounded-full px-2.5 py-1 font-medium capitalize ${statusColors[horse.status] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                        {horse.status}
                      </span>
                      {disciplines.find((d) => d.id === horse.discipline_id) && (
                        <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                          {disciplines.find((d) => d.id === horse.discipline_id)?.name}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Linked Coaches Tab */}
        {activeTab === 'Linked Coaches' && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Linked Coaches</h2>
              <button
                onClick={openAddCoachModal}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Coach
              </button>
            </div>

            {coachesLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading coaches...</p>
            ) : linkedCoaches.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center dark:border-gray-800">
                <p className="text-sm text-gray-400 dark:text-gray-500">No coaches linked yet. Add one to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/60">
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Verified</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linkedCoaches.map((coach) => {
                      const coachId = coach.id || coach.coach_id;
                      return (
                        <tr key={coachId} className="border-t border-gray-200 dark:border-gray-800">
                          <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">
                            {`${coach.first_name || ''} ${coach.last_name || ''}`.trim() || '-'}
                          </td>
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{coach.email || '-'}</td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${coachTypeBadge[coach.coach_type] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                              {coach.coach_type || '-'}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            {coach.is_verified ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                Unverified
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => handleUnlinkCoach(coachId)}
                              className="rounded-lg bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Edit Stable Modal */}
      <Modal isOpen={isStableModalOpen} onClose={() => setIsStableModalOpen(false)}>
        <div className="p-6">
          <h2 className="mb-5 text-lg font-bold text-gray-900 dark:text-white">Edit Stable</h2>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <PlacesAutocomplete onSelect={handlePlaceSelect} />
            <p className="text-xs text-gray-400 dark:text-gray-500">Search to auto-fill fields, or edit manually below.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Name *</label>
                <FormInput value={stableForm.name} onChange={(e) => setStableForm((p) => ({ ...p, name: e.target.value }))} className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>City *</label>
                <FormInput value={stableForm.city} onChange={(e) => setStableForm((p) => ({ ...p, city: e.target.value }))} className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>State *</label>
                <FormInput value={stableForm.state} onChange={(e) => setStableForm((p) => ({ ...p, state: e.target.value }))} className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Country *</label>
                <FormInput value={stableForm.country} onChange={(e) => setStableForm((p) => ({ ...p, country: e.target.value }))} className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Pincode *</label>
                <FormInput value={stableForm.pincode} onChange={(e) => setStableForm((p) => ({ ...p, pincode: e.target.value }))} className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Contact Phone</label>
                <FormInput value={stableForm.contact_phone} onChange={(e) => setStableForm((p) => ({ ...p, contact_phone: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Contact Email</label>
                <FormInput value={stableForm.contact_email} onChange={(e) => setStableForm((p) => ({ ...p, contact_email: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Latitude</label>
                <FormInput value={stableForm.latitude} onChange={(e) => setStableForm((p) => ({ ...p, latitude: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Longitude</label>
                <FormInput value={stableForm.longitude} onChange={(e) => setStableForm((p) => ({ ...p, longitude: e.target.value }))} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea
                className={`${inputCls} resize-none`}
                rows={3}
                value={stableForm.description}
                onChange={(e) => setStableForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelCls}>Logo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setStableLogoFile(e.target.files?.[0])}
                className="w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              />
            </div>

            {/* Operating Hours */}
            <div>
              <h3 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">Operating Hours</h3>
              <div className="space-y-2">
                {DAYS_OF_WEEK.map((day) => {
                  const dayData = operatingHours[day];
                  return (
                    <div key={day} className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-800/50">
                      <span className="w-24 text-sm font-medium capitalize text-gray-700 dark:text-gray-300">{day}</span>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={dayData.is_closed}
                          onChange={(e) => updateDayHours(day, 'is_closed', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400">Closed</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={dayData.open}
                          disabled={dayData.is_closed}
                          onChange={(e) => updateDayHours(day, 'open', e.target.value)}
                          className={`rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm text-gray-800 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100`}
                        />
                        <span className="text-xs text-gray-400">to</span>
                        <input
                          type="time"
                          value={dayData.close}
                          disabled={dayData.is_closed}
                          onChange={(e) => updateDayHours(day, 'close', e.target.value)}
                          className={`rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm text-gray-800 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsStableModalOpen(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onStableSave}
                className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                Save Stable
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Arena Modal */}
      <Modal isOpen={isArenaModalOpen} onClose={resetArenaForm}>
        <div className="p-6">
          <h2 className="mb-5 text-lg font-bold text-gray-900 dark:text-white">
            {editingArenaId ? 'Edit Arena' : 'Add Arena'}
          </h2>
          <form onSubmit={onArenaSubmit} className="space-y-4">
            <div>
              <label className={labelCls}>Name</label>
              <FormInput
                value={arenaForm.name}
                onChange={(e) => setArenaForm((p) => ({ ...p, name: e.target.value }))}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Capacity</label>
              <FormInput
                type="number"
                value={arenaForm.capacity}
                onChange={(e) => setArenaForm((p) => ({ ...p, capacity: e.target.value }))}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Description (optional)</label>
              <textarea
                rows={3}
                className={`${inputCls} resize-none`}
                value={arenaForm.description}
                onChange={(e) => setArenaForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelCls}>Discipline</label>
              <select
                className={selectCls}
                value={arenaForm.discipline_id}
                onChange={(e) => setArenaForm((p) => ({ ...p, discipline_id: e.target.value }))}
                required
              >
                <option value="">Select Discipline</option>
                {disciplineOptions.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Arena Image</label>
              <input
                type="file"
                accept=".png,.jpg,.jpeg"
                onChange={(e) => setArenaImageFile(e.target.files?.[0])}
                className="w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">PNG/JPG/JPEG only, max 2MB.</p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={resetArenaForm}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                {editingArenaId ? 'Update Arena' : 'Add Arena'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Horse Modal */}
      <Modal isOpen={isHorseModalOpen} onClose={resetHorseForm}>
        <div className="p-6">
          <h2 className="mb-5 text-lg font-bold text-gray-900 dark:text-white">
            {editingHorseId ? 'Edit Horse' : 'Add Horse'}
          </h2>
          <form onSubmit={onHorseSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Name</label>
                <FormInput
                  value={horseForm.name}
                  onChange={(e) => setHorseForm((p) => ({ ...p, name: e.target.value }))}
                  className={inputCls}
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Breed</label>
                <FormInput
                  value={horseForm.breed}
                  onChange={(e) => setHorseForm((p) => ({ ...p, breed: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Description (optional)</label>
              <textarea
                rows={3}
                className={`${inputCls} resize-none`}
                value={horseForm.description}
                onChange={(e) => setHorseForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelCls}>Discipline</label>
              <select
                className={selectCls}
                value={horseForm.discipline_id}
                onChange={(e) => setHorseForm((p) => ({ ...p, discipline_id: e.target.value }))}
                required
              >
                <option value="">Select Discipline</option>
                {disciplineOptions.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select
                className={selectCls}
                value={horseForm.status}
                onChange={(e) => setHorseForm((p) => ({ ...p, status: e.target.value }))}
              >
                {horseStatusOrder.map((s) => (
                  <option key={s} value={s} className="capitalize">{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Horse Image</label>
              <input
                type="file"
                accept=".png,.jpg,.jpeg"
                onChange={(e) => setHorseImageFile(e.target.files?.[0])}
                className="w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">PNG/JPG/JPEG only, max 2MB.</p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={resetHorseForm}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                {editingHorseId ? 'Update Horse' : 'Add Horse'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Assign Owner Modal */}
      <Modal isOpen={isOwnerModalOpen} title="Assign Stable Owner" onClose={() => setIsOwnerModalOpen(false)}>
        <form onSubmit={handleAssignOwner} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>First Name</label>
              <input className={inputCls} value={ownerForm.firstName} onChange={(e) => setOwnerForm((p) => ({ ...p, firstName: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Last Name</label>
              <input className={inputCls} value={ownerForm.lastName} onChange={(e) => setOwnerForm((p) => ({ ...p, lastName: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Email *</label>
            <input type="email" className={inputCls} value={ownerForm.email} onChange={(e) => setOwnerForm((p) => ({ ...p, email: e.target.value }))} required />
          </div>
          <div>
            <label className={labelCls}>Password *</label>
            <input type="password" className={inputCls} value={ownerForm.password} onChange={(e) => setOwnerForm((p) => ({ ...p, password: e.target.value }))} required />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsOwnerModalOpen(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600">
              Create & Assign
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Coach Modal */}
      <Modal isOpen={isAddCoachModalOpen} title="Link Coach to Stable" onClose={() => setIsAddCoachModalOpen(false)}>
        <div className="space-y-4">
          <FormInput
            label="Search Coaches"
            name="coach_search"
            placeholder="Search by name or email..."
            value={coachSearch}
            onChange={(e) => setCoachSearch(e.target.value)}
          />
          <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
            {filteredCoaches.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-gray-400 dark:text-gray-500">
                {allCoaches.length === 0 ? 'Loading coaches...' : 'No available coaches found.'}
              </p>
            ) : (
              filteredCoaches.map((coach) => (
                <div
                  key={coach.id}
                  className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5 last:border-0 dark:border-gray-800"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {`${coach.first_name || ''} ${coach.last_name || ''}`.trim()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{coach.email}</p>
                    <div className="mt-1 flex gap-1.5">
                      {coach.coach_type && (
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${coachTypeBadge[coach.coach_type] || 'bg-gray-100 text-gray-600'}`}>
                          {coach.coach_type}
                        </span>
                      )}
                      {coach.is_verified && (
                        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleLinkCoach(coach.id)}
                    disabled={addingCoachId === coach.id}
                    className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
                  >
                    {addingCoachId === coach.id ? 'Adding...' : 'Add'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminStableViewPage;
