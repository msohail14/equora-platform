import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { CalendarDays } from 'lucide-react';
import AppButton from '../../components/ui/AppButton';
import { getAdminBookingsApi } from '../../features/operations/operationsApi';

const STATUS_OPTIONS = ['all', 'pending_horse_approval', 'pending_payment', 'confirmed', 'cancelled', 'completed'];

const statusBadge = (status) => {
  const map = {
    pending_horse_approval: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    pending_payment: 'bg-stone-100 text-stone-700 dark:bg-stone-900/30 dark:text-stone-300',
    confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  };
  return map[status] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
};

const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchBookings = async (targetPage = page, targetStatus = status) => {
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
  };

  useEffect(() => {
    fetchBookings(page, status);
  }, [page, status]);

  useEffect(() => {
    setPage(1);
  }, [status]);

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
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Lesson Type</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="border-t border-gray-200 dark:border-gray-800">
                <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">
                  {`${b.rider_first_name || b.rider?.first_name || ''} ${b.rider_last_name || b.rider?.last_name || ''}`.trim() || '-'}
                </td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                  {`${b.coach_first_name || b.coach?.first_name || ''} ${b.coach_last_name || b.coach?.last_name || ''}`.trim() || '-'}
                </td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                  {b.stable_name || b.stable?.name || '-'}
                </td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{b.date || b.booking_date || '-'}</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{b.start_time || b.time || '-'}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge(b.status)}`}>
                    {(b.status || '-').replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{b.lesson_type || b.type || '-'}</td>
              </tr>
            ))}
            {!loading && !bookings.length && (
              <tr className="border-t border-gray-200 dark:border-gray-800">
                <td colSpan={7} className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
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
    </section>
  );
};

export default AdminBookingsPage;
