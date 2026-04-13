import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getHorseWorkloadApi } from '../../features/operations/operationsApi';
import { API_BASE_URL } from '../../lib/axiosInstance';

const uploadBaseUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
const toImageSrc = (v) => (!v ? null : /^https?:\/\//i.test(v) ? v : `${uploadBaseUrl}${v}`);

const AdminHorseDetailsPage = () => {
  const { horseId } = useParams();
  const location = useLocation();
  const horse = location.state?.horse || null;
  const [workload, setWorkload] = useState(null);
  const [loading, setLoading] = useState(!horse);

  useEffect(() => {
    if (!horseId) return;
    getHorseWorkloadApi(horseId)
      .then((res) => {
        const d = res?.data?.data || res?.data || null;
        setWorkload(d);
      })
      .catch(() => {
        // Fallback: show capacity info from horse data when API fails
        if (horse) {
          setWorkload({
            totalSessions: 0,
            avgPerWeek: 0,
            utilizationPercent: 0,
            level: 'low',
            maxDaily: horse.max_daily_sessions || 3,
            maxWeekly: horse.max_weekly_sessions || 15,
            minRestHours: horse.min_rest_hours || 4,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [horseId, horse]);

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading...</div>;
  if (!horse) return <div className="p-6 text-sm text-red-500">Horse not found.</div>;

  const imgSrc = toImageSrc(horse.profile_picture_url);

  return (
    <div className="space-y-6 p-6">
      <Link to="/admin/horses" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
        <ArrowLeft size={16} /> Back to Horses
      </Link>

      {/* Header */}
      <div className="flex gap-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        {imgSrc ? (
          <img src={imgSrc} alt={horse.name} className="h-40 w-40 rounded-xl object-cover" />
        ) : (
          <div className="flex h-40 w-40 items-center justify-center rounded-xl bg-gray-100 text-3xl text-gray-400 dark:bg-gray-800">
            {horse.name?.[0] || '?'}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{horse.name}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{horse.breed || 'Unknown breed'} &middot; {horse.discipline?.name || '-'}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
              horse.status === 'available' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
              horse.status === 'resting' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
              horse.status === 'injured' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
              'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}>{horse.status}</span>
            {horse.training_level && <span className="inline-flex rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">{horse.training_level}</span>}
            {horse.age && <span className="text-sm text-gray-500">{horse.age} years old</span>}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3 text-sm">
            <div><span className="text-gray-500">Stable:</span> <span className="text-gray-900 dark:text-gray-100">{horse.stable?.name || '-'}</span></div>
            <div><span className="text-gray-500">Temperament:</span> <span className="text-gray-900 dark:text-gray-100">{horse.temperament || '-'}</span></div>
            <div><span className="text-gray-500">Max Daily:</span> <span className="text-gray-900 dark:text-gray-100">{horse.max_daily_sessions || 3} sessions</span></div>
          </div>
          {horse.description && <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{horse.description}</p>}
        </div>
      </div>

      {/* Workload & Performance */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Performance &amp; Workload (30 days)</h2>
        {workload ? (
          <>
            <div className="grid gap-4 sm:grid-cols-4">
              <StatCard label="Total Sessions" value={workload.totalSessions ?? 0} />
              <StatCard label="Avg / Week" value={workload.avgPerWeek != null ? Number(workload.avgPerWeek).toFixed(1) : '0'} />
              <StatCard
                label="Utilization"
                value={workload.utilizationPercent != null ? `${Math.round(workload.utilizationPercent)}%` : '0%'}
                color={workload.level === 'high' ? 'text-red-600' : workload.level === 'medium' ? 'text-amber-600' : 'text-emerald-600'}
              />
              <StatCard
                label="Workload Level"
                value={workload.level ? workload.level.charAt(0).toUpperCase() + workload.level.slice(1) : 'Low'}
                color={workload.level === 'high' ? 'text-red-600' : workload.level === 'medium' ? 'text-amber-600' : 'text-emerald-600'}
              />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <CapacityBar label="Daily Capacity" used={workload.totalSessions ? Math.min(workload.totalSessions / 30, workload.maxDaily || 3) : 0} max={workload.maxDaily || 3} />
              <CapacityBar label="Weekly Capacity" used={workload.avgPerWeek || 0} max={workload.maxWeekly || 15} />
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Min Rest Between Sessions</p>
                <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">{workload.minRestHours || 4} hours</p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-400">No workload data available.</p>
        )}
      </div>

      {/* Injury Notes */}
      {horse.injury_notes && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-800/50 dark:bg-red-900/10">
          <h2 className="mb-2 text-lg font-semibold text-red-700 dark:text-red-400">Injury Notes</h2>
          <p className="text-sm text-red-600 dark:text-red-300">{horse.injury_notes}</p>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, color }) => (
  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center dark:border-gray-700 dark:bg-gray-800/50">
    <p className={`text-3xl font-bold ${color || 'text-gray-900 dark:text-gray-100'}`}>{value}</p>
    <p className="mt-1 text-xs text-gray-500">{label}</p>
  </div>
);

const CapacityBar = ({ label, used, max }) => {
  const pct = max > 0 ? Math.min((used / max) * 100, 100) : 0;
  const color = pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <div className="h-2.5 flex-1 rounded-full bg-gray-200 dark:bg-gray-700">
          <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{Number(used).toFixed(1)}/{max}</span>
      </div>
    </div>
  );
};

export default AdminHorseDetailsPage;
