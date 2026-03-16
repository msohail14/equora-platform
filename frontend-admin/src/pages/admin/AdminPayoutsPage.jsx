import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Banknote } from 'lucide-react';
import AppButton from '../../components/ui/AppButton';
import { getAdminPayoutsApi, processAdminPayoutApi } from '../../features/operations/operationsApi';
import { SaudiRiyalIcon } from '../../components/ui/SaudiRiyalIcon';

const STATUS_OPTIONS = ['all', 'pending', 'processing', 'paid'];

const statusBadge = (status) => {
  const map = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  };
  return map[status] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
};

const AdminPayoutsPage = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchPayouts = async (targetPage = page, targetStatus = status) => {
    setLoading(true);
    try {
      const response = await getAdminPayoutsApi({
        status: targetStatus === 'all' ? undefined : targetStatus,
        page: targetPage,
        limit: 10,
      });
      setPayouts(Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : []);
      setPagination(response?.pagination || null);
    } catch (error) {
      toast.error(error.message || 'Failed to load payouts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts(page, status);
  }, [page, status]);

  useEffect(() => {
    setPage(1);
  }, [status]);

  const handleProcess = async (payoutId) => {
    setProcessingId(payoutId);
    try {
      const response = await processAdminPayoutApi(payoutId);
      toast.success(response?.message || 'Payout processed successfully.');
      await fetchPayouts(page, status);
    } catch (error) {
      toast.error(error.message || 'Failed to process payout.');
    } finally {
      setProcessingId(null);
    }
  };

  const formatAmount = (amount) => {
    const num = Number(amount);
    if (Number.isNaN(num)) return '-';
    return (
      <span className="flex items-center gap-1 font-medium">
        <SaudiRiyalIcon className="h-4 w-4 text-equestrian-stone-600 dark:text-equestrian-stone-300" />
        {num.toFixed(2)}
      </span>
    );
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-2">
          <Banknote size={20} className="text-emerald-500" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Coach Payouts</h2>
        </div>
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</span>
          <select
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading payouts...</p>}

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/60">
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <th className="px-3 py-2">Coach</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((p) => (
              <tr key={p.id} className="border-t border-gray-200 dark:border-gray-800">
                <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">
                  {`${p.coach_first_name || p.coach?.first_name || ''} ${p.coach_last_name || p.coach?.last_name || ''}`.trim() || '-'}
                </td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{formatAmount(p.amount)}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge(p.status)}`}>
                    {p.status || '-'}
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                  {p.created_at ? new Date(p.created_at).toLocaleDateString() : '-'}
                </td>
                <td className="px-3 py-2">
                  {p.status === 'pending' ? (
                    <AppButton
                      className="px-3 py-1.5 text-xs"
                      disabled={processingId === p.id}
                      onClick={() => handleProcess(p.id)}
                    >
                      {processingId === p.id ? 'Processing...' : 'Process'}
                    </AppButton>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
            {!loading && !payouts.length && (
              <tr className="border-t border-gray-200 dark:border-gray-800">
                <td colSpan={5} className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No payouts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Total {pagination?.totalRecords ?? payouts.length}
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
    </section>
  );
};

export default AdminPayoutsPage;
