import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { BarChart3, DollarSign, GraduationCap, Star, Users } from 'lucide-react';
import AppButton from '../../components/ui/AppButton';
import { getCoachPerformanceApi } from '../../features/operations/operationsApi';
import { API_BASE_URL } from '../../lib/axiosInstance';

const uploadBaseUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
const toImageSrc = (v) => (!v ? null : /^https?:\/\//i.test(v) ? v : `${uploadBaseUrl}${v}`);

const AdminCoachPerformancePage = () => {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchData = async (targetPage = page) => {
    setLoading(true);
    try {
      const res = await getCoachPerformanceApi({ page: targetPage, limit: 20 });
      const list = res?.data?.data || [];
      setCoaches(Array.isArray(list) ? list : []);
      setPagination(res?.data?.pagination || null);
    } catch {
      toast.error('Failed to load coach performance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(page); }, [page]);

  // Summary stats
  const totalCoaches = coaches.length;
  const totalEarnings = coaches.reduce((s, c) => s + (c.total_earnings || 0), 0);
  const avgRating = totalCoaches > 0
    ? (coaches.reduce((s, c) => s + (c.average_rating || 0), 0) / totalCoaches).toFixed(1)
    : '0.0';
  const totalPending = coaches.reduce((s, c) => s + (c.pending_payouts || 0), 0);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Coach Performance</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Overview of your coaches' bookings, earnings, and ratings.</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <SummaryCard icon={Users} label="Total Coaches" value={totalCoaches} color="text-emerald-600" bg="bg-emerald-50 dark:bg-emerald-900/20" />
        <SummaryCard icon={DollarSign} label="Total Earnings" value={`SAR ${totalEarnings.toLocaleString()}`} color="text-blue-600" bg="bg-blue-50 dark:bg-blue-900/20" />
        <SummaryCard icon={Star} label="Avg Rating" value={avgRating} color="text-amber-600" bg="bg-amber-50 dark:bg-amber-900/20" />
        <SummaryCard icon={BarChart3} label="Pending Payouts" value={`SAR ${totalPending.toLocaleString()}`} color="text-orange-600" bg="bg-orange-50 dark:bg-orange-900/20" />
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : coaches.length === 0 ? (
        <p className="text-sm text-gray-400">No coaches linked to your stable.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60">
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <th className="px-3 py-2">Coach</th>
                  <th className="px-3 py-2">Bookings</th>
                  <th className="px-3 py-2">Completed</th>
                  <th className="px-3 py-2">Rate</th>
                  <th className="px-3 py-2">Pending</th>
                  <th className="px-3 py-2">Earnings</th>
                  <th className="px-3 py-2">Rating</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coaches.map((c) => (
                  <tr key={c.coach_id} className="border-t border-gray-200 dark:border-gray-800">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {toImageSrc(c.profile_picture_url) ? (
                          <img src={toImageSrc(c.profile_picture_url)} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30">
                            {(c.name || '?')[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{c.name}</p>
                          <p className="text-xs text-gray-400">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{c.total_bookings}</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{c.completed_bookings}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.completion_rate >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                        c.completion_rate >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {c.completion_rate}%
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{c.pending_bookings}</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-gray-100">SAR {(c.total_earnings || 0).toLocaleString()}</td>
                    <td className="px-3 py-2">
                      {c.average_rating > 0 ? (
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <Star size={12} className="fill-amber-400" /> {Number(c.average_rating).toFixed(1)}
                          <span className="text-xs text-gray-400">({c.total_reviews})</span>
                        </span>
                      ) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        to={`/admin/coaches/${c.coach_id}`}
                        className="inline-flex items-center rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Total {pagination.totalItems || 0}</p>
              <div className="flex gap-2">
                <AppButton variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</AppButton>
                <span className="flex items-center text-sm text-gray-600 dark:text-gray-400">Page {page} of {pagination.totalPages || 1}</span>
                <AppButton variant="secondary" disabled={page >= (pagination.totalPages || 1)} onClick={() => setPage(page + 1)}>Next</AppButton>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const SummaryCard = ({ icon, label, value, color, bg }) => {
  const IconComponent = icon;
  return (
  <div className={`rounded-xl border border-gray-200 p-4 dark:border-gray-800 ${bg}`}>
    <div className="flex items-center gap-2">
      <IconComponent size={18} className={color} />
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
    </div>
    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{label}</p>
  </div>
  );
};

export default AdminCoachPerformancePage;
