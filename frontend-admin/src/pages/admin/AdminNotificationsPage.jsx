import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Bell, CheckCheck } from 'lucide-react';
import AppButton from '../../components/ui/AppButton';
import {
  getAdminNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
} from '../../features/operations/operationsApi';

const AdminNotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchNotifications = async (targetPage = page) => {
    setLoading(true);
    try {
      const response = await getAdminNotificationsApi({ page: targetPage, limit: 20 });
      setNotifications(Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : []);
      setPagination(response?.pagination || null);
    } catch (error) {
      toast.error(error.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(page);
  }, [page]);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationReadApi(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (error) {
      toast.error(error.message || 'Failed to mark notification as read.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsReadApi();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read.');
    } catch (error) {
      toast.error(error.message || 'Failed to mark all as read.');
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-emerald-500" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Notifications</h2>
        </div>
        <AppButton variant="secondary" onClick={handleMarkAllRead}>
          <CheckCheck size={16} className="mr-1.5" />
          Mark All Read
        </AppButton>
      </div>

      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading notifications...</p>}

      <div className="space-y-2">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`flex items-start justify-between gap-3 rounded-xl border p-4 transition ${
              n.is_read
                ? 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40'
                : 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-900/10'
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {!n.is_read && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />}
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{n.title || 'Notification'}</p>
              </div>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{n.body || n.message || ''}</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{formatTime(n.created_at)}</p>
            </div>
            {!n.is_read && (
              <AppButton
                variant="secondary"
                className="flex-shrink-0 px-2.5 py-1 text-xs"
                onClick={() => handleMarkRead(n.id)}
              >
                Mark Read
              </AppButton>
            )}
          </div>
        ))}
        {!loading && !notifications.length && (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">No notifications.</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Total {pagination?.totalRecords ?? notifications.length}
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

export default AdminNotificationsPage;
