import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import AppButton from '../../components/ui/AppButton';
import FormInput from '../../components/ui/FormInput';
import Modal from '../../components/ui/Modal';
import { createRiderApi, getRidersApi } from '../../features/operations/operationsApi';
import useDebouncedValue from '../../hooks/useDebouncedValue';

const emptyCreateForm = {
  email: '',
  mobile_number: '',
  first_name: '',
  last_name: '',
  city: '',
  state: '',
  country: '',
  pincode: '',
  date_of_birth: '',
  gender: '',
};

const AdminRidersPage = () => {
  const navigate = useNavigate();
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const debouncedSearch = useDebouncedValue(search, 300);

  const fetchRiders = async (targetPage = page, targetSearch = debouncedSearch) => {
    setLoading(true);
    try {
      const response = await getRidersApi({ page: targetPage, limit: 10, search: targetSearch });
      const list = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      setRiders(list);
      setPagination(response?.pagination || null);
    } catch (error) {
      toast.error(error.message || 'Failed to load riders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders(page, debouncedSearch);
  }, [page, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const resetCreateForm = () => {
    setCreateForm(emptyCreateForm);
    setIsCreateModalOpen(false);
  };

  const onCreateRider = async (event) => {
    event.preventDefault();
    try {
      const response = await createRiderApi(createForm);
      toast.success(response?.message || 'Rider created successfully.');
      resetCreateForm();
      await fetchRiders(page, debouncedSearch);
    } catch (error) {
      toast.error(error.message || 'Failed to create rider.');
    }
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Riders</h2>
        <div className="flex flex-wrap items-end gap-2">
          <FormInput
            label="Search"
            name="search_riders"
            placeholder="Search riders"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[240px]"
          />
          <AppButton type="button" onClick={() => setIsCreateModalOpen(true)}>
            Add Rider
          </AppButton>
        </div>
      </div>

      {loading ? <p className="text-sm text-gray-500 dark:text-gray-400">Loading riders...</p> : null}

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/60">
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Enrollments</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">View</th>
            </tr>
          </thead>
          <tbody>
            {riders.map((rider) => (
              <tr key={rider.id} className="border-t border-gray-200 dark:border-gray-800">
                <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">
                  {`${rider.first_name || ''} ${rider.last_name || ''}`.trim() || '-'}
                </td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{rider.email}</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{rider.enrollment_count ?? 0}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                      rider.is_active
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {rider.is_active ? 'active' : 'inactive'}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <button
                    className="inline-flex items-center rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                    type="button"
                    onClick={() => navigate(`/admin/rider/${rider.id}`)}
                  >
                    View Rider
                  </button>
                </td>
              </tr>
            ))}
            {!loading && !riders.length ? (
              <tr className="border-t border-gray-200 dark:border-gray-800">
                <td colSpan={5} className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No riders found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Total {pagination?.totalRecords ?? riders.length}
        </span>
        <div className="flex items-center gap-2">
          <AppButton
            type="button"
            variant="secondary"
            className="px-3 py-1.5 text-xs"
            disabled={!pagination?.hasPrev || loading}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Prev
          </AppButton>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {pagination?.currentPage || 1} of {pagination?.totalPages || 1}
          </span>
          <AppButton
            type="button"
            variant="secondary"
            className="px-3 py-1.5 text-xs"
            disabled={!pagination?.hasNext || loading}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Next
          </AppButton>
        </div>
      </div>

      <Modal isOpen={isCreateModalOpen} title="Create Rider" onClose={resetCreateForm}>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={onCreateRider}>
          <FormInput label="First Name" name="create_rider_first_name" value={createForm.first_name} onChange={(e) => setCreateForm((p) => ({ ...p, first_name: e.target.value }))} />
          <FormInput label="Last Name" name="create_rider_last_name" value={createForm.last_name} onChange={(e) => setCreateForm((p) => ({ ...p, last_name: e.target.value }))} />
          <FormInput label="Mobile Number" name="create_rider_mobile_number" value={createForm.mobile_number} onChange={(e) => setCreateForm((p) => ({ ...p, mobile_number: e.target.value }))} />
          <FormInput label="City" name="create_rider_city" value={createForm.city} onChange={(e) => setCreateForm((p) => ({ ...p, city: e.target.value }))} />
          <FormInput label="State" name="create_rider_state" value={createForm.state} onChange={(e) => setCreateForm((p) => ({ ...p, state: e.target.value }))} />
          <FormInput label="Country" name="create_rider_country" value={createForm.country} onChange={(e) => setCreateForm((p) => ({ ...p, country: e.target.value }))} />
          <FormInput label="Pincode" name="create_rider_pincode" value={createForm.pincode} onChange={(e) => setCreateForm((p) => ({ ...p, pincode: e.target.value }))} />
          <FormInput label="Date of Birth" name="create_rider_date_of_birth" type="date" value={createForm.date_of_birth} onChange={(e) => setCreateForm((p) => ({ ...p, date_of_birth: e.target.value }))} />
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Gender</span>
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={createForm.gender}
              onChange={(e) => setCreateForm((p) => ({ ...p, gender: e.target.value }))}
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
              name="create_rider_email"
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
              required
            />
          </div>
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <AppButton type="submit">Create Rider</AppButton>
            <AppButton type="button" variant="secondary" onClick={resetCreateForm}>
              Cancel
            </AppButton>
          </div>
        </form>
      </Modal>
    </section>
  );
};

export default AdminRidersPage;
