import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  Eye, Pencil, UserPlus, Users, CheckCircle2, XCircle, Loader2, Mail, User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppButton from '../../components/ui/AppButton';
import FormInput from '../../components/ui/FormInput';
import Modal from '../../components/ui/Modal';
import {
  createCoachApi, getCoachesApi, updateCoachApi,
} from '../../features/operations/operationsApi';
import useDebouncedValue from '../../hooks/useDebouncedValue';

const emptyCreateForm = {
  email: '',
  password: '',
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
const emptyEditForm   = {
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
  is_active: true,
};

const AdminCoachesPage = () => {
  const navigate = useNavigate();
  const [coaches, setCoaches]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [search, setSearch]                 = useState('');
  const [page, setPage]                     = useState(1);
  const [pagination, setPagination]         = useState(null);
  const [createForm, setCreateForm]         = useState(emptyCreateForm);
  const [editForm, setEditForm]             = useState(emptyEditForm);
  const [editingCoachId, setEditingCoachId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen,   setIsEditModalOpen]   = useState(false);
  const debouncedSearch = useDebouncedValue(search, 300);

  const fetchCoaches = async (targetPage = page, targetSearch = debouncedSearch) => {
    setLoading(true);
    try {
      const response = await getCoachesApi({
        include_inactive: true,
        page: targetPage,
        limit: 10,
        search: targetSearch,
      });
      const list = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      setCoaches(list);
      setPagination(response?.pagination || null);
    } catch (err) {
      toast.error(err.message || 'Failed to load coaches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoaches(page, debouncedSearch); }, [page, debouncedSearch]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const resetCreateForm = () => { setCreateForm(emptyCreateForm); setIsCreateModalOpen(false); };
  const resetEditForm   = () => { setEditForm(emptyEditForm); setEditingCoachId(null); setIsEditModalOpen(false); };

  const onCreateCoach = async (event) => {
    event.preventDefault();
    try {
      const response = await createCoachApi(createForm);
      toast.success(response.message || 'Coach created successfully.');
      resetCreateForm();
      await fetchCoaches(page, debouncedSearch);
    } catch (err) {
      toast.error(err.message || 'Failed to create coach.');
    }
  };

  const onEditCoach = (coach) => {
    setEditingCoachId(coach.id);
    setEditForm({
      email:      coach.email      || '',
      mobile_number: coach.mobile_number || '',
      first_name: coach.first_name || '',
      last_name:  coach.last_name  || '',
      city: coach.city || '',
      state: coach.state || '',
      country: coach.country || '',
      pincode: coach.pincode || '',
      date_of_birth: coach.date_of_birth || '',
      gender: coach.gender || '',
      is_active:  coach.is_active !== false,
    });
    setIsEditModalOpen(true);
  };

  const onUpdateCoach = async (event) => {
    event.preventDefault();
    if (!editingCoachId) return;
    try {
      await updateCoachApi({ coachId: editingCoachId, payload: editForm });
      toast.success('Coach updated successfully.');
      resetEditForm();
      await fetchCoaches(page, debouncedSearch);
    } catch (err) {
      toast.error(err.message || 'Failed to update coach.');
    }
  };

  const activeCount   = coaches.filter((c) => c.is_active).length;
  const inactiveCount = coaches.length - activeCount;

  return (
    <div className="grid gap-4">

      {/* ── Top bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Coaches</h1>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <FormInput
            label="Search"
            name="search_coaches"
            placeholder="Search coaches"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[240px]"
          />
          <AppButton type="button" onClick={() => setIsCreateModalOpen(true)}>
            <UserPlus size={14} className="mr-1" /> Create Coach
          </AppButton>
        </div>
      </div>

      {/* ── Stat strip — same floating pattern as CourseOverviewCard ── */}
      {/* <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

        
        <div className="relative bg-gradient-to-r from-amber-500 to-orange-400 px-6 py-5">
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '18px 18px',
            }}
          />
          <div className="relative">
            <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">Overview</p>
            <p className="text-2xl font-bold text-white">Coach Roster</p>
          </div>
        </div>

        
        <div className="mx-5 -mt-5 grid grid-cols-3 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-md dark:border-gray-800 dark:bg-gray-900">
          {[
            { icon: Users,        label: 'Total',    value: coaches.length, color: 'text-amber-500'   },
            { icon: CheckCircle2, label: 'Active',   value: activeCount,    color: 'text-emerald-500' },
            { icon: XCircle,      label: 'Inactive', value: inactiveCount,  color: 'text-rose-500'    },
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

        <div className="pb-2" />
      </div> */}

      {/* ── Coach list card ── */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

        {/* section header */}
        {/* <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-5 py-4 dark:border-gray-800 dark:bg-gray-800/50">
          <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
            <Users size={15} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Coach List</h2>
            {!loading && (
              <p className="text-[11px] text-gray-400">{coaches.length} total</p>
            )}
          </div>
        </div> */}

        {/* loading */}
        {loading && (
          <div className="flex items-center justify-center gap-2.5 py-14">
            <Loader2 size={18} className="animate-spin text-amber-500" />
            <span className="text-sm text-gray-400">Loading coaches…</span>
          </div>
        )}

        {/* empty */}
        {!loading && coaches.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-14">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/20">
              <Users size={24} className="text-amber-400" />
            </div>
            <p className="text-sm text-gray-400">No coaches found.</p>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:underline"
            >
              <UserPlus size={12} /> Create your first coach
            </button>
          </div>
        )}

        {/* table */}
        {!loading && coaches.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {[
                    { icon: User,        label: 'Name'   },
                    { icon: Mail,        label: 'Email'  },
                    { icon: CheckCircle2,label: 'Rating' },
                    { icon: CheckCircle2,label: 'Status' },
                    { icon: null,        label: 'Actions'},
                  ].map(({ icon: Icon, label }) => (
                    <th
                      key={label}
                      className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400"
                    >
                      <span className="flex items-center gap-1.5">
                        {Icon && <Icon size={11} />}
                        {label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coaches.map((coach) => {
                  const name    = `${coach.first_name || ''} ${coach.last_name || ''}`.trim() || '—';
                  const initial = (coach.first_name?.[0] || coach.email?.[0] || '?').toUpperCase();
                  return (
                    <tr
                      key={coach.id}
                      className="group border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/80 dark:border-gray-800/50 dark:hover:bg-gray-800/30"
                    >
                      {/* name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[11px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            {initial}
                          </div>
                          <span className="font-semibold text-gray-800 dark:text-gray-100">{name}</span>
                        </div>
                      </td>

                      {/* email */}
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                          <Mail size={12} className="shrink-0 text-gray-300 dark:text-gray-600" />
                          {coach.email}
                        </span>
                      </td>

                      {/* status */}
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                          {Number(coach.average_rating || 0).toFixed(1)}
                        </span>
                        <span className="ml-1 text-xs text-gray-400">({coach.total_reviews || 0})</span>
                      </td>

                      {/* status */}
                      <td className="px-5 py-3.5">
                        {coach.is_active ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            <span className="size-1.5 rounded-full bg-emerald-500" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
                            <span className="size-1.5 rounded-full bg-gray-400" /> Inactive
                          </span>
                        )}
                      </td>

                      {/* actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/coaches/${coach.id}`)}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            <Eye size={12} /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditCoach(coach)}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-100 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40"
                          >
                            <Pencil size={12} /> Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-3 dark:border-gray-800">
              <AppButton
                type="button"
                variant="secondary"
                className="px-3 py-1.5 text-xs"
                disabled={!pagination?.hasPrev || loading}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Prev
              </AppButton>
              <span className="text-xs text-gray-400">
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
        )}
      </section>

      {/* ── Create modal ── */}
      <Modal isOpen={isCreateModalOpen} title="Create Coach" onClose={resetCreateForm}>
        <form className="grid gap-4" onSubmit={onCreateCoach}>
          
          <div className="grid gap-3 sm:grid-cols-2">
            
            <FormInput
              label="First Name"
              name="first_name"
              value={createForm.first_name}
              onChange={(e) => setCreateForm((p) => ({ ...p, first_name: e.target.value }))}
            />
            <FormInput
              label="Last Name"
              name="last_name"
              value={createForm.last_name}
              onChange={(e) => setCreateForm((p) => ({ ...p, last_name: e.target.value }))}
            />
            <FormInput
              label="Mobile Number"
              name="create_mobile_number"
              value={createForm.mobile_number}
              onChange={(e) => setCreateForm((p) => ({ ...p, mobile_number: e.target.value }))}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormInput label="City" name="create_city" value={createForm.city} onChange={(e) => setCreateForm((p) => ({ ...p, city: e.target.value }))} />
            <FormInput label="State" name="create_state" value={createForm.state} onChange={(e) => setCreateForm((p) => ({ ...p, state: e.target.value }))} />
            <FormInput label="Country" name="create_country" value={createForm.country} onChange={(e) => setCreateForm((p) => ({ ...p, country: e.target.value }))} />
            <FormInput label="Pincode" name="create_pincode" value={createForm.pincode} onChange={(e) => setCreateForm((p) => ({ ...p, pincode: e.target.value }))} />
            <FormInput label="Date of Birth" name="create_date_of_birth" type="date" value={createForm.date_of_birth} onChange={(e) => setCreateForm((p) => ({ ...p, date_of_birth: e.target.value }))} />
            <label className="grid gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Gender</span>
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
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
          </div>
          <FormInput
            label="Email *"
            name="email"
            type="email"
            value={createForm.email}
            onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
            required
          />
          <FormInput
            label="Password *"
            name="create_password"
            type="password"
            value={createForm.password}
            onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
            required
          />
          <div className="flex flex-wrap gap-2">
            <AppButton type="submit"><UserPlus size={13} className="mr-1" /> Create Coach</AppButton>
            <AppButton type="button" variant="secondary" onClick={resetCreateForm}>Cancel</AppButton>
          </div>
        </form>
      </Modal>

      {/* ── Edit modal ── */}
      <Modal isOpen={isEditModalOpen} title="Update Coach" onClose={resetEditForm}>
        <form className="grid gap-4" onSubmit={onUpdateCoach}>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormInput
              label="Mobile Number"
              name="edit_mobile_number"
              value={editForm.mobile_number}
              onChange={(e) => setEditForm((p) => ({ ...p, mobile_number: e.target.value }))}
            />
            <FormInput
              label="First Name"
              name="edit_first_name"
              value={editForm.first_name}
              onChange={(e) => setEditForm((p) => ({ ...p, first_name: e.target.value }))}
            />
            <FormInput
              label="Last Name"
              name="edit_last_name"
              value={editForm.last_name}
              onChange={(e) => setEditForm((p) => ({ ...p, last_name: e.target.value }))}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormInput label="City" name="edit_city" value={editForm.city} onChange={(e) => setEditForm((p) => ({ ...p, city: e.target.value }))} />
            <FormInput label="State" name="edit_state" value={editForm.state} onChange={(e) => setEditForm((p) => ({ ...p, state: e.target.value }))} />
            <FormInput label="Country" name="edit_country" value={editForm.country} onChange={(e) => setEditForm((p) => ({ ...p, country: e.target.value }))} />
            <FormInput label="Pincode" name="edit_pincode" value={editForm.pincode} onChange={(e) => setEditForm((p) => ({ ...p, pincode: e.target.value }))} />
            <FormInput label="Date of Birth" name="edit_date_of_birth" type="date" value={editForm.date_of_birth} onChange={(e) => setEditForm((p) => ({ ...p, date_of_birth: e.target.value }))} />
            <label className="grid gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Gender</span>
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                value={editForm.gender}
                onChange={(e) => setEditForm((p) => ({ ...p, gender: e.target.value }))}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer Not To Say</option>
              </select>
            </label>
          </div>
          <FormInput
            label="Email *"
            name="edit_email"
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
            required
          />
          <label className="grid gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Status</span>
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={editForm.is_active ? 'true' : 'false'}
              onChange={(e) => setEditForm((p) => ({ ...p, is_active: e.target.value === 'true' }))}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </label>
          <div className="flex flex-wrap gap-2">
            <AppButton type="submit"><Pencil size={13} className="mr-1" /> Update Coach</AppButton>
            <AppButton type="button" variant="secondary" onClick={resetEditForm}>Cancel</AppButton>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default AdminCoachesPage;
