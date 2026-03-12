import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import {
  BookOpen,
  Building2,
  ClipboardList,
  LayoutGrid,
  PawPrint,
  Trophy,
  Users,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  Bar,
  BarChart,
  YAxis,
} from 'recharts';
import { getAdminDashboardApi } from '../../features/operations/operationsApi';

const emptyDashboard = {
  stats: {
    total_stables: 0,
    active_stables: 0,
    total_arenas: 0,
    active_arenas: 0,
    total_horses: 0,
    active_horses: 0,
    total_disciplines: 0,
    active_disciplines: 0,
    total_riders: 0,
    active_riders: 0,
    total_courses: 0,
    active_courses: 0,
    total_enrollments: 0,
    active_enrollments: 0,
  },
  enrollment_trends: {
    daily: [],
    weekly: [],
    monthly: [],
  },
};

const formatDateLabel = (raw) => {
  if (!raw) return '-';
  const parsed = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const formatMonthLabel = (raw) => {
  if (!raw || !raw.includes('-')) return raw || '-';
  const [year, month] = raw.split('-');
  const parsed = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
};

const overviewCards = (stats) => [
  {
    label: 'Stables',
    total: stats.total_stables,
    active: stats.active_stables,
    icon: Building2,
    accent: 'from-amber-500 to-orange-500',
  },
  {
    label: 'Arenas',
    total: stats.total_arenas,
    active: stats.active_arenas,
    icon: LayoutGrid,
    accent: 'from-sky-500 to-cyan-500',
  },
  {
    label: 'Horses',
    total: stats.total_horses,
    active: stats.active_horses,
    icon: PawPrint,
    accent: 'from-emerald-500 to-teal-500',
  },
  {
    label: 'Disciplines',
    total: stats.total_disciplines,
    active: stats.active_disciplines,
    icon: Trophy,
    accent: 'from-violet-500 to-purple-500',
  },
  {
    label: 'Riders',
    total: stats.total_riders,
    active: stats.active_riders,
    icon: Users,
    accent: 'from-blue-500 to-indigo-500',
  },
];

const miniChartCards = (stats) => [
  {
    label: 'Courses',
    total: stats.total_courses,
    active: stats.active_courses,
    icon: BookOpen,
    accent: 'from-lime-500 to-green-500',
  },
  {
    label: 'Enrollments',
    total: stats.total_enrollments,
    active: stats.active_enrollments,
    icon: ClipboardList,
    accent: 'from-cyan-500 to-blue-500',
  },
];

const TotalActiveMiniChart = ({ total, active }) => {
  const data = [
    { name: 'Total', value: Number(total || 0), fill: '#f59e0b' },
    { name: 'Active', value: Number(active || 0), fill: '#10b981' },
  ];

  return (
    <div className="h-24 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={26}
            outerRadius={40}
            paddingAngle={4}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

const EnrollmentChart = ({ data = [], mode = 'daily' }) => {
  const prepared = useMemo(() => {
    if (mode === 'monthly') {
      return data.map((item) => ({ ...item, displayLabel: formatMonthLabel(item.label) }));
    }
    return data.map((item) => ({ ...item, displayLabel: formatDateLabel(item.label) }));
  }, [data, mode]);

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        {mode === 'daily' ? (
          <BarChart data={prepared}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
            <XAxis dataKey="displayLabel" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#f59e0b" radius={[8, 8, 0, 0]} />
          </BarChart>
        ) : (
          <LineChart data={prepared}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
            <XAxis dataKey="displayLabel" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={3} dot={{ r: 3 }} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

const AdminDashboardPage = () => {
  const { admin } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [trendMode, setTrendMode] = useState('daily');

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const data = await getAdminDashboardApi();
        setDashboard({
          stats: { ...emptyDashboard.stats, ...(data?.stats || {}) },
          enrollment_trends: {
            daily: Array.isArray(data?.enrollment_trends?.daily) ? data.enrollment_trends.daily : [],
            weekly: Array.isArray(data?.enrollment_trends?.weekly) ? data.enrollment_trends.weekly : [],
            monthly: Array.isArray(data?.enrollment_trends?.monthly) ? data.enrollment_trends.monthly : [],
          },
        });
      } catch (error) {
        toast.error(error.message || 'Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  const chartData =
    trendMode === 'daily'
      ? dashboard.enrollment_trends.daily
      : trendMode === 'weekly'
        ? dashboard.enrollment_trends.weekly
        : dashboard.enrollment_trends.monthly;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 dark:text-amber-400">
            Dashboard
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            {greeting}, {admin?.first_name || 'Admin'} {admin?.last_name || ''}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Real-time summary from your backend data.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-500 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
            Loading dashboard data...
          </div>
        ) : null}

        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {overviewCards(dashboard.stats).map((stat) => (
            <div
              key={stat.label}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            >
              <div
                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.accent}`}
              />
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Total {stat.label}
                </p>
                <span
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${stat.accent} text-white`}
                >
                  <stat.icon size={18} />
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.total}</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Active:{' '}
                <span className="font-semibold text-gray-900 dark:text-gray-100">{stat.active}</span>
              </p>
            </div>
          ))}
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {miniChartCards(dashboard.stats).map((stat) => (
            <div
              key={stat.label}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.accent}`} />
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Total {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.total}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Active:{' '}
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {stat.active}
                    </span>
                  </p>
                </div>
                <span
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.accent} text-white`}
                >
                  <stat.icon size={18} />
                </span>
              </div>
              <TotalActiveMiniChart total={stat.total} active={stat.active} />
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Enrollments Trend
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Daily, weekly and monthly enrollment totals.
              </p>
            </div>
            <div className="inline-flex rounded-lg border border-gray-200 p-1 dark:border-gray-700">
              {['daily', 'weekly', 'monthly'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTrendMode(mode)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition ${
                    trendMode === mode
                      ? 'bg-amber-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
          <EnrollmentChart data={chartData} mode={trendMode} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
