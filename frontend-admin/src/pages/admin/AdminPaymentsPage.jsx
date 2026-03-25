import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { CreditCard } from 'lucide-react';
import AppButton from '../../components/ui/AppButton';
import { getAdminPaymentsApi, markManualPaymentApi, refundPaymentApi } from '../../features/operations/operationsApi';
import { SaudiRiyalIcon } from '../../components/ui/SaudiRiyalIcon';

const STATUS_OPTIONS = ['all', 'pending', 'completed', 'failed', 'refunded'];

const statusBadge = (status) => {
  const map = {
    pending: 'bg-equestrian-gold-100 text-equestrian-gold-700 dark:bg-equestrian-gold-900/30 dark:text-equestrian-gold-300',
    completed: 'bg-equestrian-green-100 text-equestrian-green-700 dark:bg-equestrian-green-900/30 dark:text-equestrian-green-300',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    refunded: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  };
  return map[status] || 'bg-equestrian-stone-100 text-equestrian-stone-600 dark:bg-equestrian-stone-800 dark:text-equestrian-stone-400';
};

const AdminPaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchPayments = async (targetPage = page, targetStatus = status) => {
    setLoading(true);
    try {
      const response = await getAdminPaymentsApi({
        status: targetStatus === 'all' ? undefined : targetStatus,
        page: targetPage,
        limit: 10,
      });
      setPayments(Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : []);
      setPagination(response?.pagination || null);
    } catch (error) {
      toast.error(error.message || 'Failed to load payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(page, status);
  }, [page, status]);

  useEffect(() => {
    setPage(1);
  }, [status]);

  const handlePaymentAction = async (actionFn, paymentId, successMsg) => {
    setActionLoading(paymentId);
    try {
      await actionFn(paymentId);
      toast.success(successMsg);
      await fetchPayments(page, status);
    } catch (err) {
      toast.error(err.message || 'Action failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const renderPaymentActions = (p) => {
    const isLoading = actionLoading === p.id;
    const btnBase = 'rounded-lg px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50';

    if (p.status === 'pending') {
      return (
        <button
          className={`${btnBase} bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300`}
          disabled={isLoading}
          onClick={() => {
            if (!window.confirm('Mark this payment as manually received?')) return;
            handlePaymentAction(markManualPaymentApi, p.id, 'Marked as manual payment.');
          }}
          title="Mark as cash/manual payment"
        >
          Mark Manual
        </button>
      );
    }
    if (p.status === 'completed') {
      return (
        <button
          className={`${btnBase} bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400`}
          disabled={isLoading}
          onClick={() => {
            if (!window.confirm('Refund this payment? This cannot be undone.')) return;
            handlePaymentAction(refundPaymentApi, p.id, 'Payment refunded.');
          }}
        >
          Refund
        </button>
      );
    }
    return <span className="text-xs text-gray-400">—</span>;
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
    <section className="rounded-2xl border border-equestrian-stone-200 bg-white p-5 shadow-sm dark:border-equestrian-stone-800 dark:bg-equestrian-stone-900">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-2">
          <CreditCard size={20} className="text-equestrian-green-500" />
          <h2 className="text-xl font-semibold text-equestrian-green-950 dark:text-white">Payments</h2>
        </div>
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-equestrian-stone-500 dark:text-equestrian-stone-400">Status</span>
          <select
            className="w-full rounded-lg border border-equestrian-stone-200 bg-white px-3 py-2 text-sm text-equestrian-stone-800 shadow-sm transition focus:border-equestrian-green-500 focus:outline-none focus:ring-2 focus:ring-equestrian-green-500/30 dark:border-equestrian-stone-700 dark:bg-equestrian-stone-800 dark:text-equestrian-stone-100"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p className="text-sm text-equestrian-stone-500 dark:text-equestrian-stone-400">Loading payments...</p>}

      <div className="overflow-x-auto rounded-xl border border-equestrian-stone-200 dark:border-equestrian-stone-800">
        <table className="min-w-full text-sm">
          <thead className="bg-equestrian-stone-50 dark:bg-equestrian-stone-800/60">
            <tr className="text-left text-xs uppercase tracking-wide text-equestrian-stone-500 dark:text-equestrian-stone-400">
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Provider</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t border-equestrian-stone-200 dark:border-equestrian-stone-800">
                <td className="px-3 py-2 font-medium text-equestrian-green-950 dark:text-white">
                  {`${p.user_first_name || p.user?.first_name || ''} ${p.user_last_name || p.user?.last_name || ''}`.trim() || p.user_email || p.user?.email || '-'}
                </td>
                <td className="px-3 py-2 text-equestrian-stone-600 dark:text-equestrian-stone-300">{formatAmount(p.amount)}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge(p.status)}`}>
                    {p.status || '-'}
                  </span>
                </td>
                <td className="px-3 py-2 text-equestrian-stone-600 dark:text-equestrian-stone-300">{p.provider || p.payment_provider || '-'}</td>
                <td className="px-3 py-2 text-equestrian-stone-600 dark:text-equestrian-stone-300">
                  {p.created_at ? new Date(p.created_at).toLocaleDateString() : '-'}
                </td>
                <td className="px-3 py-2">{renderPaymentActions(p)}</td>
              </tr>
            ))}
            {!loading && !payments.length && (
              <tr className="border-t border-equestrian-stone-200 dark:border-equestrian-stone-800">
                <td colSpan={6} className="px-3 py-4 text-center text-sm text-equestrian-stone-500 dark:text-equestrian-stone-400">
                  No payments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-equestrian-stone-500 dark:text-equestrian-stone-400">
          Total {pagination?.totalRecords ?? payments.length}
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
          <span className="text-sm text-equestrian-stone-500 dark:text-equestrian-stone-400">
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

export default AdminPaymentsPage;
