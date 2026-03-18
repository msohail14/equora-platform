import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import {
  getStableRegistrationsApi,
  approveStableRegistrationApi,
  rejectStableRegistrationApi,
} from '../../features/operations/operationsApi';
import Modal from '../../components/ui/Modal';
import FormInput from '../../components/ui/FormInput';
import AppButton from '../../components/ui/AppButton';

const statusColors = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const AdminStableRegistrationsPage = () => {
  const { admin } = useSelector((state) => state.auth);
  const isSuperAdmin = admin?.role === 'super_admin';

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);

  const [approveModal, setApproveModal] = useState({ open: false, reg: null });
  const [rejectModal, setRejectModal] = useState({ open: false, reg: null });
  const [approveForm, setApproveForm] = useState({ password: '', confirmPassword: '' });
  const [rejectForm, setRejectForm] = useState({ admin_notes: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStableRegistrationsApi({ status: filterStatus || undefined, page, limit: 20 });
      setRegistrations(res?.data || []);
      setPagination(res?.pagination || null);
    } catch (err) {
      toast.error(err?.message || 'Failed to load registrations.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, page]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleApprove = async () => {
    if (!approveForm.password) {
      toast.error('Password is required.');
      return;
    }
    if (approveForm.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (approveForm.password !== approveForm.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setActionLoading(true);
    try {
      const result = await approveStableRegistrationApi(approveModal.reg.id, {
        password: approveForm.password,
      });
      toast.success(result?.message || 'Registration approved!');
      setApproveModal({ open: false, reg: null });
      setApproveForm({ password: '', confirmPassword: '' });
      fetchRegistrations();
    } catch (err) {
      toast.error(err?.message || 'Approval failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      const result = await rejectStableRegistrationApi(rejectModal.reg.id, {
        admin_notes: rejectForm.admin_notes,
      });
      toast.success(result?.message || 'Registration rejected.');
      setRejectModal({ open: false, reg: null });
      setRejectForm({ admin_notes: '' });
      fetchRegistrations();
    } catch (err) {
      toast.error(err?.message || 'Rejection failed.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        Only super admins can manage stable registrations.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stable Registrations</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Review and approve stable owner applications.
          </p>
        </div>
        <div className="flex gap-2">
          {['pending', 'approved', 'rejected', ''].map((s) => (
            <button
              key={s}
              onClick={() => { setFilterStatus(s); setPage(1); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                filterStatus === s
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      ) : registrations.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="text-gray-500 dark:text-gray-400">No {filterStatus || ''} registrations found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {registrations.map((reg) => (
            <div
              key={reg.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {reg.business_name}
                    </h3>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[reg.status]}`}>
                      {reg.status}
                    </span>
                  </div>
                  <div className="grid gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <p>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Owner:</span>{' '}
                      {reg.owner_first_name} {reg.owner_last_name}
                    </p>
                    <p>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span>{' '}
                      {reg.preferred_email}
                    </p>
                    {reg.phone && (
                      <p>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Phone:</span>{' '}
                        {reg.phone}
                      </p>
                    )}
                    {(reg.city || reg.country) && (
                      <p>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Location:</span>{' '}
                        {[reg.city, reg.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {reg.description && (
                      <p className="mt-1 text-gray-500 dark:text-gray-500 line-clamp-2">
                        {reg.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Submitted {new Date(reg.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {reg.reviewer && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Reviewed by {reg.reviewer.first_name} {reg.reviewer.last_name} on{' '}
                        {new Date(reg.reviewed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    )}
                    {reg.admin_notes && (
                      <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                        Note: {reg.admin_notes}
                      </p>
                    )}
                  </div>
                </div>

                {reg.status === 'pending' && (
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => setApproveModal({ open: true, reg })}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setRejectModal({ open: true, reg })}
                      className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-50 dark:border-red-800 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-gray-700"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {pagination.current_page} of {pagination.total_pages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= pagination.total_pages}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-gray-700"
          >
            Next
          </button>
        </div>
      )}

      {/* Approve Modal */}
      <Modal
        isOpen={approveModal.open}
        onClose={() => { setApproveModal({ open: false, reg: null }); setApproveForm({ password: '', confirmPassword: '' }); }}
        title="Approve Registration"
      >
        {approveModal.reg && (
          <div className="space-y-4">
            <div className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-900/20">
              <p className="text-sm text-emerald-800 dark:text-emerald-300">
                Approving <strong>{approveModal.reg.business_name}</strong> will create:
              </p>
              <ul className="mt-2 list-disc pl-5 text-sm text-emerald-700 dark:text-emerald-400 space-y-1">
                <li>A stable owner account with email: <strong>{approveModal.reg.preferred_email}</strong></li>
                <li>A new stable named: <strong>{approveModal.reg.business_name}</strong></li>
              </ul>
            </div>
            <FormInput
              label="Set Password for Owner"
              type="password"
              value={approveForm.password}
              onChange={(e) => setApproveForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Create a password for the owner"
              required
            />
            <FormInput
              label="Confirm Password"
              type="password"
              value={approveForm.confirmPassword}
              onChange={(e) => setApproveForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              placeholder="Confirm the password"
              required
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => { setApproveModal({ open: false, reg: null }); setApproveForm({ password: '', confirmPassword: '' }); }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-gray-700"
              >
                Cancel
              </button>
              <AppButton onClick={handleApprove} disabled={actionLoading}>
                {actionLoading ? 'Approving...' : 'Approve & Create Account'}
              </AppButton>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModal.open}
        onClose={() => { setRejectModal({ open: false, reg: null }); setRejectForm({ admin_notes: '' }); }}
        title="Reject Registration"
      >
        {rejectModal.reg && (
          <div className="space-y-4">
            <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
              <p className="text-sm text-red-800 dark:text-red-300">
                Rejecting registration for <strong>{rejectModal.reg.business_name}</strong> ({rejectModal.reg.preferred_email}).
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Reason (optional)
              </label>
              <textarea
                value={rejectForm.admin_notes}
                onChange={(e) => setRejectForm({ admin_notes: e.target.value })}
                rows={3}
                placeholder="Reason for rejection..."
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => { setRejectModal({ open: false, reg: null }); setRejectForm({ admin_notes: '' }); }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminStableRegistrationsPage;
