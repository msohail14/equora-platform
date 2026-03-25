import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Star, Trash2 } from 'lucide-react';
import AppButton from '../../components/ui/AppButton';
import FormInput from '../../components/ui/FormInput';
import Modal from '../../components/ui/Modal';
import PlacesAutocomplete from '../../components/ui/PlacesAutocomplete';
import {
  approveStableApi,
  createStableApi,
  deleteStableApi,
  getStablesApi,
  updateStableApi,
} from '../../features/operations/operationsApi';
import useDebouncedValue from '../../hooks/useDebouncedValue';

const emptyForm = {
  name: '',
  city: '',
  state: '',
  country: '',
  pincode: '',
  contact_phone: '',
  contact_email: '',
  description: '',
  latitude: '',
  longitude: '',
};

const emptyOwnerForm = {
  owner_first_name: '',
  owner_last_name: '',
  owner_email: '',
  owner_password: '',
};

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const defaultOperatingHours = () =>
  Object.fromEntries(DAYS_OF_WEEK.map((day) => [day, { open: '06:00', close: '22:00', is_closed: false }]));

const AdminStablesPage = () => {
  const [stables, setStables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [ownerForm, setOwnerForm] = useState(emptyOwnerForm);
  const [createOwner, setCreateOwner] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [isStableModalOpen, setIsStableModalOpen] = useState(false);
  const [operatingHours, setOperatingHours] = useState(defaultOperatingHours);
  const debouncedSearch = useDebouncedValue(search, 300);

  const fetchStables = async (targetPage = page, targetSearch = debouncedSearch) => {
    setLoading(true);
    try {
      const response = await getStablesApi({
        include_inactive: true,
        page: targetPage,
        limit: 10,
        search: targetSearch,
      });
      const list = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      setStables(list);
      setPagination(response?.pagination || null);
    } catch (err) {
      toast.error(err.message || 'Failed to load stables.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStables(page, debouncedSearch);
  }, [page, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const resetForm = () => {
    setForm(emptyForm);
    setOwnerForm(emptyOwnerForm);
    setCreateOwner(false);
    setLogoFile(null);
    setOperatingHours(defaultOperatingHours());
    setIsStableModalOpen(false);
  };

  const updateDayHours = (day, field, value) => {
    setOperatingHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handlePlaceSelect = (place) => {
    setForm((prev) => ({
      ...prev,
      name: place.name || prev.name,
      city: place.city || prev.city,
      state: place.state || prev.state,
      country: place.country || prev.country,
      pincode: place.pincode || prev.pincode,
      latitude: place.latitude ?? prev.latitude,
      longitude: place.longitude ?? prev.longitude,
      contact_phone: place.contact_phone || prev.contact_phone,
      google_place_id: place.google_place_id || prev.google_place_id || '',
      formatted_address: place.formatted_address || prev.formatted_address || '',
      google_rating: place.google_rating ?? prev.google_rating ?? '',
      website: place.website || prev.website || '',
      google_photos: place.google_photos ? JSON.stringify(place.google_photos) : prev.google_photos || '',
    }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (createOwner && (!ownerForm.owner_email || !ownerForm.owner_password)) {
      toast.error('Owner email and password are required when creating an owner account.');
      return;
    }
    try {
      const payload = {
        ...form,
        operating_hours: JSON.stringify(operatingHours),
        ...(createOwner ? ownerForm : {}),
      };
      await createStableApi({ payload, logoFile });
      toast.success('Stable created successfully.');
      resetForm();
      await fetchStables(page, debouncedSearch);
    } catch (err) {
      toast.error(err.message || 'Failed to create stable.');
    }
  };

  const onAddStableClick = () => {
    setForm(emptyForm);
    setLogoFile(null);
    setIsStableModalOpen(true);
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Stables</h2>
        <div className="flex flex-wrap items-end gap-2">
          <FormInput
            label="Search"
            name="search_stable"
            placeholder="Search stables"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            className="min-w-[240px]"
          />
          <AppButton type="button" onClick={onAddStableClick}>
            Add Stable
          </AppButton>
        </div>
      </div>

      {loading ? <p className="text-sm text-gray-500 dark:text-gray-400">Loading stables...</p> : null}

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/60">
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2">Approval</th>
              <th className="px-3 py-2">Featured</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stables.map((stable) => (
              <tr key={stable.id} className="border-t border-gray-200 dark:border-gray-800">
                <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{stable.name}</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                  {[stable.city, stable.state, stable.country, stable.pincode].filter(Boolean).join(', ') || '-'}
                </td>
                <td className="px-3 py-2">
                  {stable.is_approved ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-300">
                      <span className="size-1.5 rounded-full bg-emerald-500" /> Approved
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await approveStableApi(stable.id);
                          toast.success('Stable approved');
                          await fetchStables(page, debouncedSearch);
                        } catch (err) {
                          toast.error(err.message || 'Failed to approve stable');
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
                    >
                      Approve
                    </button>
                  )}
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await updateStableApi({ stableId: stable.id, payload: { is_featured: !stable.is_featured } });
                        toast.success(stable.is_featured ? 'Removed from featured' : 'Marked as featured');
                        await fetchStables(page, debouncedSearch);
                      } catch {
                        toast.error('Failed to update featured status');
                      }
                    }}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                    title={stable.is_featured ? 'Remove from featured' : 'Mark as featured'}
                  >
                    <Star size={16} className={stable.is_featured ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
                  </button>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1.5">
                    <Link
                      className="inline-flex items-center rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                      to={`/admin/stables/${stable.id}`}
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!window.confirm(`Delete stable "${stable.name}"? This cannot be undone.`)) return;
                        try {
                          await deleteStableApi(stable.id);
                          toast.success('Stable deleted.');
                          await fetchStables(page, debouncedSearch);
                        } catch (err) {
                          toast.error(err?.response?.data?.message || err.message || 'Failed to delete stable.');
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
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <AppButton type="button" variant="secondary" className="px-3 py-1.5 text-xs" disabled={!pagination?.hasPrev || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Prev
        </AppButton>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Page {pagination?.currentPage || 1} of {pagination?.totalPages || 1} 
        </span>
        <AppButton type="button" variant="secondary" className="px-3 py-1.5 text-xs" disabled={!pagination?.hasNext || loading} onClick={() => setPage((p) => p + 1)}>
          Next
        </AppButton>
      </div>

      <Modal isOpen={isStableModalOpen} title={'Add New Stable'} onClose={resetForm}>
        <form className="grid gap-3" onSubmit={onSubmit}>
          <PlacesAutocomplete onSelect={handlePlaceSelect} />
          <p className="text-xs text-gray-400 dark:text-gray-500">Select a place above to auto-fill, or enter details manually below.</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormInput label="Stable Name *" name="name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
            <FormInput label="City *" name="city" value={form.city} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} required />
            <FormInput label="State *" name="state" value={form.state} onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))} required />
            <FormInput label="Country *" name="country" value={form.country} onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))} required />
            <FormInput label="Pincode *" name="pincode" value={form.pincode} onChange={(e) => setForm((prev) => ({ ...prev, pincode: e.target.value }))} required />
            <FormInput label="Contact Phone" name="contact_phone" value={form.contact_phone} onChange={(e) => setForm((prev) => ({ ...prev, contact_phone: e.target.value }))} />
            <FormInput label="Contact Email" name="contact_email" type="email" value={form.contact_email} onChange={(e) => setForm((prev) => ({ ...prev, contact_email: e.target.value }))} />
            <FormInput label="Latitude" name="latitude" value={form.latitude} onChange={(e) => setForm((prev) => ({ ...prev, latitude: e.target.value }))} />
            <FormInput label="Longitude" name="longitude" value={form.longitude} onChange={(e) => setForm((prev) => ({ ...prev, longitude: e.target.value }))} />
          </div>
          <FormInput label="Description" name="description" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />

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
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Logo (optional)</span>
            <input
              className="w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0])}
            />
          </label>

          {/* Operating Hours */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Operating Hours</h3>
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
                        className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm text-gray-800 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                      />
                      <span className="text-xs text-gray-400">to</span>
                      <input
                        type="time"
                        value={dayData.close}
                        disabled={dayData.is_closed}
                        onChange={(e) => updateDayHours(day, 'close', e.target.value)}
                        className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm text-gray-800 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Owner Account */}
          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={createOwner}
                onChange={(e) => setCreateOwner(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Create owner login for this stable</span>
            </label>
            {createOwner && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <FormInput label="Owner First Name" name="owner_first_name" value={ownerForm.owner_first_name} onChange={(e) => setOwnerForm((prev) => ({ ...prev, owner_first_name: e.target.value }))} />
                <FormInput label="Owner Last Name" name="owner_last_name" value={ownerForm.owner_last_name} onChange={(e) => setOwnerForm((prev) => ({ ...prev, owner_last_name: e.target.value }))} />
                <FormInput label="Owner Email *" name="owner_email" type="email" value={ownerForm.owner_email} onChange={(e) => setOwnerForm((prev) => ({ ...prev, owner_email: e.target.value }))} required />
                <FormInput label="Owner Password *" name="owner_password" type="password" value={ownerForm.owner_password} onChange={(e) => setOwnerForm((prev) => ({ ...prev, owner_password: e.target.value }))} required />
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <AppButton type="submit">Create Stable</AppButton>
            <AppButton type="button" variant="secondary" onClick={resetForm}>
              Cancel
            </AppButton>
          </div>
        </form>
      </Modal>
    </section>
  );
};

export default AdminStablesPage;
