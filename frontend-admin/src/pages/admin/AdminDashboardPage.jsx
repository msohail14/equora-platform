import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  CalendarCheck,
  Clock,
  GraduationCap,
  RefreshCw,
  Users,
} from 'lucide-react';
import { HorseIcon } from '../../components/ui/HorseIcon';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getAdminDashboardApi } from '../../features/operations/operationsApi';
import { SaudiRiyalIcon } from '../../components/ui/SaudiRiyalIcon';

const emptyDashboard = {
  stats: {
    total_stables: 0,
    active_stables: 0,
    pending_stables: 0,
    total_arenas: 0,
    active_arenas: 0,
    total_horses: 0,
    active_horses: 0,
    total_disciplines: 0,
    active_disciplines: 0,
    total_riders: 0,
    active_riders: 0,
    total_coaches: 0,
    active_coaches: 0,
    unverified_coaches: 0,
    total_courses: 0,
    active_courses: 0,
    total_enrollments: 0,
    active_enrollments: 0,
    total_revenue: 0,
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

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const formatRelativeTime = (date) => {
  if (!date) return '';
  const diff = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diff < 1) return 'Just now';
  if (diff === 1) return '1 minute ago';
  if (diff < 60) return `${diff} minutes ago`;
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

// --- KPI card data ---
const kpiCards = (stats) => [
  {
    label: 'Total Riders',
    value: stats.total_riders,
    icon: Users,
    iconColor: 'text-equestrian-green-600',
    iconBg: 'bg-equestrian-green-50 dark:bg-equestrian-green-900/20',
  },
  {
    label: 'Active Coaches',
    value: stats.active_coaches,
    icon: GraduationCap,
    iconColor: 'text-equestrian-gold-600',
    iconBg: 'bg-equestrian-gold-50 dark:bg-equestrian-gold-900/20',
  },
  {
    label: 'Active Horses',
    value: stats.active_horses,
    icon: HorseIcon,
    iconColor: 'text-equestrian-stone-600',
    iconBg: 'bg-equestrian-stone-100 dark:bg-equestrian-stone-800',
  },
  {
    label: 'Revenue (MTD)',
    value: stats.total_revenue,
    isCurrency: true,
    icon: null,
    iconColor: 'text-red-500',
    iconBg: 'bg-red-50 dark:bg-red-900/20',
  },
];

// --- Entity distribution pie data ---
const DISTRIBUTION_COLORS = ['#166534', '#d97706', '#57534e', '#15803d'];

const buildDistributionData = (stats) => [
  { name: 'Stables', value: Number(stats.total_stables || 0) },
  { name: 'Arenas', value: Number(stats.total_arenas || 0) },
  { name: 'Horses', value: Number(stats.total_horses || 0) },
  { name: 'Disciplines', value: Number(stats.total_disciplines || 0) },
];

// --- Reusable mini donut ---
const TotalActiveMiniChart = ({ total, active }) => {
  const data = [
    { name: 'Active', value: Number(active || 0), fill: '#16a34a' },
    { name: 'Inactive', value: Math.max(0, Number(total || 0) - Number(active || 0)), fill: '#e7e5e4' },
  ];

  return (
    <div className="h-16 w-16 flex-shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={20}
            outerRadius={30}
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// --- Enrollment area chart ---
const EnrollmentAreaChart = ({ data = [], mode = 'daily' }) => {
  const prepared = useMemo(() => {
    if (mode === 'monthly') {
      return data.map((item) => ({ ...item, displayLabel: formatMonthLabel(item.label) }));
    }
    return data.map((item) => ({ ...item, displayLabel: formatDateLabel(item.label) }));
  }, [data, mode]);

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={prepared} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="enrollGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d97706" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
          <XAxis 
            dataKey="displayLabel" 
            tick={{ fontSize: 12, fill: '#78716c' }} 
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis 
            allowDecimals={false} 
            tick={{ fontSize: 12, fill: '#78716c' }} 
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '0.5rem',
              border: 'none',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              fontSize: '0.875rem',
              backgroundColor: '#fff',
              color: '#1c1917'
            }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#d97706"
            strokeWidth={2}
            fill="url(#enrollGradient)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: '#d97706' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// --- Main page ---
const AdminDashboardPage = () => {
  const { admin } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [trendMode, setTrendMode] = useState('daily');
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const fetchDashboard = useCallback(async () => {
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
      setLastRefreshed(new Date());
    } catch (error) {
      toast.error(error.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const greeting = getGreeting();

  const chartData = useMemo(
    () =>
      trendMode === 'daily'
        ? dashboard.enrollment_trends.daily
        : trendMode === 'weekly'
          ? dashboard.enrollment_trends.weekly
          : dashboard.enrollment_trends.monthly,
    [trendMode, dashboard.enrollment_trends],
  );

  const distributionData = useMemo(() => buildDistributionData(dashboard.stats), [dashboard.stats]);

  const pendingStables = dashboard.stats.pending_stables ?? 0;
  const unverifiedCoaches = dashboard.stats.unverified_coaches ?? 0;
  const hasPendingActions = pendingStables > 0 || unverifiedCoaches > 0;


  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-7xl">
        {/* ── Welcome header ── */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-equestrian-green-950 dark:text-white sm:text-3xl">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-equestrian-stone-500 dark:text-equestrian-stone-400">
              Welcome back, {admin?.first_name || 'Admin'}. Here's what's happening today.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {lastRefreshed && (
              <span className="flex items-center gap-1.5 text-xs text-equestrian-stone-400 dark:text-equestrian-stone-500">
                <Clock size={13} />
                {formatRelativeTime(lastRefreshed)}
              </span>
            )}
            <button
              type="button"
              onClick={fetchDashboard}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-equestrian-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-equestrian-stone-600 shadow-sm transition hover:bg-equestrian-stone-50 disabled:opacity-50 dark:border-equestrian-stone-800 dark:bg-equestrian-stone-900 dark:text-equestrian-stone-300 dark:hover:bg-equestrian-stone-800"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-xl border border-equestrian-stone-200 bg-white dark:border-equestrian-stone-800 dark:bg-equestrian-stone-900"
              />
            ))}
          </div>
        )}

        {/* ── KPI row ── */}
        {!loading && (
          <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {kpiCards(dashboard.stats).map((card) => (
              <div
                key={card.label}
                className="group relative overflow-hidden rounded-xl border border-equestrian-stone-100 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-equestrian-stone-800 dark:bg-equestrian-stone-900"
              >
                <div className="flex items-start justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${card.isCurrency ? 'bg-red-50 text-red-500 dark:bg-red-900/20' : card.iconBg} ${card.isCurrency ? '' : card.iconColor}`}>
                    {card.isCurrency ? (
                        <SaudiRiyalIcon className="h-7 w-7" />
                    ) : (
                        <card.icon size={22} />
                    )}
                  </div>
                </div>

                  <div className="mt-4 flex items-center gap-2">
                    {card.isCurrency && (
                      <SaudiRiyalIcon className="h-8 w-8 text-equestrian-green-950 dark:text-white" />
                    )}
                    <p className="text-3xl font-bold text-equestrian-green-950 dark:text-white">
                      {card.value?.toLocaleString() ?? 0}
                    </p>
                    <p className="mt-1 text-sm font-medium text-equestrian-stone-500 dark:text-equestrian-stone-400">
                      {card.label}
                    </p>
                  </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* ── Chart Section (Left 2/3) ── */}
            <div className="lg:col-span-2 space-y-8">
                {/* Today's Bookings */}
                <div className="rounded-xl border border-equestrian-stone-100 bg-white p-6 shadow-sm dark:border-equestrian-stone-800 dark:bg-equestrian-stone-900">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-equestrian-green-950 dark:text-white">
                                Today's Bookings
                            </h2>
                            <p className="text-sm text-equestrian-stone-500 dark:text-equestrian-stone-400">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>
                        <Link to="/admin/bookings" className="text-sm font-semibold text-equestrian-gold-600 hover:text-equestrian-gold-700">
                            View Schedule ↗
                        </Link>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <CalendarCheck size={40} className="mb-3 text-equestrian-stone-300 dark:text-equestrian-stone-600" />
                        <p className="text-sm font-medium text-equestrian-stone-500 dark:text-equestrian-stone-400">
                            No bookings data available yet
                        </p>
                        <p className="mt-1 text-xs text-equestrian-stone-400 dark:text-equestrian-stone-500">
                            Bookings will appear here once the booking system is active.
                        </p>
                    </div>
                </div>

                {/* Enrollment Chart */}
                <div className="rounded-xl border border-equestrian-stone-100 bg-white p-6 shadow-sm dark:border-equestrian-stone-800 dark:bg-equestrian-stone-900">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-equestrian-green-950 dark:text-white">
                                Enrollment Trends
                            </h2>
                            <p className="text-sm text-equestrian-stone-500 dark:text-equestrian-stone-400">
                                Overview of new student registrations
                            </p>
                        </div>
                        <div className="flex rounded-lg bg-equestrian-stone-100 p-1 dark:bg-equestrian-stone-800">
                            {['daily', 'weekly', 'monthly'].map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setTrendMode(mode)}
                                    className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-all ${
                                        trendMode === mode
                                            ? 'bg-white text-equestrian-green-900 shadow-sm dark:bg-equestrian-stone-700 dark:text-white'
                                            : 'text-equestrian-stone-500 hover:text-equestrian-stone-900 dark:text-equestrian-stone-400 dark:hover:text-white'
                                    }`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>
                    {chartData.length > 0 ? (
                        <EnrollmentAreaChart data={chartData} mode={trendMode} />
                    ) : (
                        <div className="flex h-[280px] items-center justify-center text-sm text-equestrian-stone-400">
                            No data available
                        </div>
                    )}
                </div>
            </div>

            {/* ── Right Column (Activity & Stats) ── */}
            <div className="space-y-8">
                {/* Activity Feed */}
                <div className="rounded-xl border border-equestrian-stone-100 bg-white p-6 shadow-sm dark:border-equestrian-stone-800 dark:bg-equestrian-stone-900">
                    <h2 className="mb-4 text-lg font-bold text-equestrian-green-950 dark:text-white">
                        Activity
                    </h2>
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <Clock size={32} className="mb-3 text-equestrian-stone-300 dark:text-equestrian-stone-600" />
                        <p className="text-sm font-medium text-equestrian-stone-500 dark:text-equestrian-stone-400">
                            Activity feed coming soon
                        </p>
                        <p className="mt-1 text-xs text-equestrian-stone-400 dark:text-equestrian-stone-500">
                            Recent actions and events will be displayed here.
                        </p>
                    </div>
                </div>

                {/* Entity Stats */}
                <div className="rounded-xl border border-equestrian-stone-100 bg-white p-6 shadow-sm dark:border-equestrian-stone-800 dark:bg-equestrian-stone-900">
                    <h2 className="mb-4 text-lg font-bold text-equestrian-green-950 dark:text-white">
                        Quick Stats
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border border-equestrian-stone-100 p-3 dark:border-equestrian-stone-800">
                            <div className="flex items-center gap-3">
                                <TotalActiveMiniChart total={dashboard.stats.total_courses} active={dashboard.stats.active_courses} />
                                <div>
                                    <p className="text-sm font-medium text-equestrian-stone-500 dark:text-equestrian-stone-400">Courses</p>
                                    <p className="text-lg font-bold text-equestrian-green-950 dark:text-white">{dashboard.stats.total_courses}</p>
                                </div>
                            </div>
                            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full dark:bg-emerald-900/20 dark:text-emerald-400">
                                {dashboard.stats.active_courses} active
                            </span>
                        </div>
                        
                        <div className="flex items-center justify-between rounded-lg border border-equestrian-stone-100 p-3 dark:border-equestrian-stone-800">
                            <div className="flex items-center gap-3">
                                <TotalActiveMiniChart total={dashboard.stats.total_enrollments} active={dashboard.stats.active_enrollments} />
                                <div>
                                    <p className="text-sm font-medium text-equestrian-stone-500 dark:text-equestrian-stone-400">Enrollments</p>
                                    <p className="text-lg font-bold text-equestrian-green-950 dark:text-white">{dashboard.stats.total_enrollments}</p>
                                </div>
                            </div>
                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full dark:bg-blue-900/20 dark:text-blue-400">
                                {dashboard.stats.active_enrollments} active
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
