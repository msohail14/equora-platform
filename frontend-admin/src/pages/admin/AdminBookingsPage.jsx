import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { CalendarDays } from 'lucide-react';
import AppButton from '../../components/ui/AppButton';
import Modal from '../../components/ui/Modal';
import {
  getAdminBookingsApi,
  approveBookingApi,
  confirmBookingApi,
  confirmHorseApi,
  declineBookingApi,
  startBookingApi,
  completeBookingApi,
} from '../../features/operations/operationsApi';
import { formatTime12h } from '../../lib/timeFormat';

const STATUS_OPTIONS = [
  'all',
  'pending_review',
  'pending_horse_approval',
  'pending_payment',
  'waitlisted',
  'confirmed',
  'in_progress',
  'declined',
  'cancelled',
  'completed',
];

const statusBadge = (status) => {
  const map = {
    pending_review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    pending_horse_approval: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    pending_payment: 'bg-stone-100 text-stone-700 dark:bg-stone-900/30 dark:text-stone-300',
    confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    in_progress: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    declined: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    waitlisted: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  };
  return map[status] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
};

const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [declineTarget, setDeclineTarget] = useState(null);
  const [declineReason, setDeclineReason] = useState('');

  const fetchBookings = useCallback(async (targetPage = page, targetStatus = status) => {
    setLoading(true);
    try {
      const response = await getAdminBookingsApi({
        status: targetStatus === 'all' ? undefined : targetStatus,
        page: targetPage,
        limit: 10,
      });
      setBookings(Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : []);
      setPagination(response?.pagination || null);
    } catch (error) {
      toast.error(error.message || 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    fetchBookings(page, status);
  }, [page, status]);

  useEffect(() => {
    setPage(1);
  }, [status]);

  const handleAction = async (actionFn, id, successMsg) => {
    setActionLoading(id);
    try {
      await actionFn(id);
      toast.success(successMsg);
      await fetchBookings(page, status);
    } catch (err) {
      toast.error(err.message || 'Action failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const openDeclineModal = (booking) => {
    setDeclineTarget(booking);
    setDeclineReason('');
    setDeclineModalOpen(true);
  };

  const handleDeclineSubmit = async () => {
    if (!declineTarget) return;
    setActionLoading(declineTarget.id);
    try {
      await declineBookingApi(declineTarget.id, declineReason);
      toast.success('Booking declined.');
      setDeclineModalOpen(false);
      setDeclineTarget(null);
      setDeclineReason('');
      await fetchBookings(page, status);
    } catch (err) {
      toast.error(err.message || 'Failed to decline booking.');
    } finally {
      setActionLoading(null);
    }
  };

  const renderActions = (b) => {
    const isLoading = actionLoading === b.id;
    const btnBase = 'rounded-lg px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50';

    switch (b.status) {
      case 'pending_review':
        return (
          <div className="flex gap-1.5">
            <button
              className={`${btnBase} bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300`}
              disabled={isLoading}
              onClick={() => {
                if (!window.confirm('Approve this booking?')) return;
                handleAction(approveBookingApi, b.id, 'Booking approved.');
              }}
            >
              Approve
            </button>
            <button
              className={`${btnBase} bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400`}
              disabled={isLoading}
              onClick={() => openDeclineModal(b)}
            >
              Decline
            </button>
          </div>
        );
      case 'pending_horse_approval':
        return (
          <div className="flex gap-1.5">
            <button
              className={`${btnBase} bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300`}
              disabled={isLoading}
              onClick={() => {
                if (!window.confirm('Confirm horse assignment for this booking?')) return;
                handleAction(confirmHorseApi, b.id, 'Horse confirmed.');
              }}
            >
              Confirm Horse
            </button>
            <button
              className={`${btnBase} bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400`}
              disabled={isLoading}
              onClick={() => openDeclineModal(b)}
            >
              Decline
            </button>
          </div>
        );
      case 'pending_payment':
        return (
          <button
            className={`${btnBase} bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300`}
            disabled={isLoading}
            onClick={() => {
              if (!window.confirm('Manually confirm this booking (bypasses online payment)?')) return;
              handleAction(confirmBookingApi, b.id, 'Booking confirmed.');
            }}
            title="Manually confirm (bypasses online payment)"
          >
            Confirm
          </button>
        );
      case 'confirmed':
        return (
          <button
            className={`${btnBase} bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300`}
            disabled={isLoading}
            onClick={() => {
              if (!window.confirm('Start this session?')) return;
              handleAction(startBookingApi, b.id, 'Session started.');
            }}
          >
            Start Session
          </button>
        );
      case 'in_progress':
        return (
          <button
            className={`${btnBase} bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300`}
            disabled={isLoading}
            onClick={() => {
              if (!window.confirm('Mark this session as completed?')) return;
              handleAction(completeBookingApi, b.id, 'Session completed.');
            }}
          >
            Complete
          </button>
        );
      default:
        return <span className="text-xs text-gray-400">—</span>;
    }
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={20} className="text-emerald-500" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Bookings</h2>
        </div>
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</span>
          <select
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading bookings...</p>}

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/60">
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <th className="px-3 py-2">Rider</th>
              <th className="px-3 py-2">Coach</th>
              <th className="px-3 py-2">Stable</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">Duration</th>
              <th className="px-3 py-2">Horse</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Lesson Type</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="border-t border-gray-200 dark:border-gray-800">
                <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">
                  {`${b.rider_first_name || b.rider?.first_name || ''} ${b.rider_last_name || b.rider?.last_name || ''}`.trim() || b.rider?.email || '-'}
                </td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                  {`${b.coach_first_name || b.coach?.first_name || ''} ${b.coach_last_name || b.coach?.last_name || ''}`.trim() || '-'}
                </td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                  {b.stable_name || b.stable?.name || '-'}
                </td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{b.date || b.booking_date || '-'}</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{b.start_time ? formatTime12h(b.start_time) : b.time ? formatTime12h(b.time) : '-'}</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                  {b.duration_minutes ? `${b.duration_minutes} min` : '-'}
                </td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                  {b.horse_assignment || b.horse_name || b.horse?.name || '-'}
                </td>
                <td className="px-3 py-2">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge(b.status)}`}>
                    {(b.status || '-').replace(/_/g, ' ')}
                  </span>
                  {b.series_id && (
                    <span className="ml-1 inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      Series
                    </span>
                  )}
                  {b.waitlist_position != null && b.status === 'waitlisted' && (
                    <span className="ml-1 text-[10px] text-violet-600 dark:text-violet-400">
                      #{b.waitlist_position}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{b.lesson_type || b.type || '-'}</td>
                <td className="px-3 py-2">{renderActions(b)}</td>
              </tr>
            ))}
            {!loading && !bookings.length && (
              <tr className="border-t border-gray-200 dark:border-gray-800">
                <td colSpan={10} className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No bookings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Total {pagination?.totalRecords ?? bookings.length}
        </span>
        <div className="flex items-center gap-2">
          <AppButton
            type="button"
            variant="secondary"
            className="px-3 py-1.5 text-xs"
            disabled={!pagination?.hasPrev || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
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
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </AppButton>
        </div>
      </div>

      {/* Decline Reason Modal */}
      <Modal isOpen={declineModalOpen} title="Decline Booking" onClose={() => setDeclineModalOpen(false)}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Provide a reason for declining this booking
            {declineTarget && (
              <> for <span className="font-medium">{`${declineTarget.rider_first_name || declineTarget.rider?.first_name || ''} ${declineTarget.rider_last_name || declineTarget.rider?.last_name || ''}`.trim()}</span></>
            )}:
          </p>
          <textarea
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
            rows={3}
            placeholder="Reason for declining..."
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <AppButton variant="secondary" onClick={() => setDeclineModalOpen(false)}>
              Cancel
            </AppButton>
            <AppButton
              onClick={handleDeclineSubmit}
              disabled={actionLoading === declineTarget?.id}
              className="bg-red-500 hover:bg-red-600"
            >
              Decline Booking
            </AppButton>
          </div>
        </div>
      </Modal>
    </section>
  );
};

export default AdminBookingsPage;
