import { memo } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays, Clock3, UserRound, Users, Timer, Layers, Tag, MapPin, TrendingUp,
} from 'lucide-react';
import { API_BASE_URL } from '../../../lib/axiosInstance';

const uploadBaseUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

const toBannerSrc = (value) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `${uploadBaseUrl}${value}`;
};

const STATUS_STYLES = {
  active:    'bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/25 dark:text-emerald-400',
  published: 'bg-emerald-500/80 text-white text-emerald-600 ring-1 ring-emerald-500/25 dark:text-emerald-400',
  inactive:  'bg-rose-500/15 text-rose-600 ring-1 ring-rose-500/25 dark:text-rose-400',
  draft:     'bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/25 dark:text-emerald-400',
  archived:  'bg-gray-500/15 text-gray-500 ring-1 ring-gray-400/25',
};

const TYPE_LABEL = {
  one_to_one: 'One-to-One',
  group: 'Group',
};

const CourseOverviewCard = ({ course }) => {
  if (!course) return null;

  const coachName = course.coach
    ? `${course.coach.first_name ?? ''} ${course.coach.last_name ?? ''}`.trim()
    : null;
  const startTime = course.start_time ? String(course.start_time).slice(0, 5) : null;
  const endTime   = course.end_time   ? String(course.end_time).slice(0, 5)   : null;
  const bannerSrc = toBannerSrc(course.thumbnail_url);
  const statusStyle = STATUS_STYLES[course.status?.toLowerCase()] ?? 'bg-gray-500/15 text-gray-500';

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <div className="relative">
        {bannerSrc ? (
          <>
            <div className="h-44 w-full overflow-hidden sm:h-52">
              <img
                src={bannerSrc}
                alt={course.title || 'Course thumbnail'}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 px-6 pb-5 pt-10">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${statusStyle}`}>
                  {course.status ?? '—'}
                </span>
                {course.course_type && (
                  <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm ring-1 ring-white/20">
                    {TYPE_LABEL[course.course_type] ?? course.course_type}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-black leading-tight tracking-tight text-white drop-shadow sm:text-3xl">
                {course.title || '—'}
              </h2>
            </div>
          </>
        ) : (
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-stone-400 to-rose-400 px-6 py-6">
            <div
              className="pointer-events-none absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '18px 18px' }}
            />
            <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-6 right-24 h-24 w-24 rounded-full bg-white/10" />
            <div className="relative">
              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/55">Course Overview</p>
              <h2 className="text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl">
                {course.title || '—'}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${statusStyle}`}>
                  {course.status ?? '—'}
                </span>
                {course.course_type && (
                  <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm ring-1 ring-white/20">
                    {TYPE_LABEL[course.course_type] ?? course.course_type}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════════ */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 dark:divide-gray-800 dark:border-gray-800">
        {[
          {
            icon: Timer,
            label: 'Session',
            value: course.max_session_duration ?? '—',
            unit: course.max_session_duration ? 'min' : '',
            color: 'text-emerald-500',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
          },
          {
            icon: Users,
            label: 'Enrollment',
            value: course.max_enrollment ?? '—',
            unit: course.max_enrollment ? 'max' : '',
            color: 'text-sky-500',
            bg: 'bg-sky-50 dark:bg-sky-900/20',
          },
          {
            icon: Layers,
            label: 'Sessions',
            value: course.total_sessions ?? '—',
            unit: course.total_sessions ? 'total' : '',
            color: 'text-violet-500',
            bg: 'bg-violet-50 dark:bg-violet-900/20',
          },
        ].map(({ icon: Icon, label, value, unit, color, bg }) => (
          <div key={label} className="flex flex-col items-center gap-1.5 px-2 py-4 text-center">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}>
              <Icon size={14} className={color} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black leading-none text-gray-900 dark:text-gray-100">{value}</span>
              {unit && <span className="text-[10px] font-semibold text-gray-400">{unit}</span>}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════
          META GRID
      ══════════════════════════════════════════════ */}
      <div className="p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">

          <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <UserRound size={15} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Coach</p>
              {course.coach?.id && coachName ? (
                <Link
                  to={`/admin/coaches/${course.coach.id}`}
                  className="mt-0.5 block truncate text-sm font-bold text-gray-900 hover:text-emerald-600 hover:underline dark:text-gray-100 dark:hover:text-emerald-400 transition-colors"
                >
                  {coachName}
                </Link>
              ) : (
                <p className="mt-0.5 truncate text-sm font-bold text-gray-900 dark:text-gray-100">{coachName || '—'}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-900/30">
              <Tag size={15} className="text-stone-600 dark:text-stone-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Discipline</p>
              <Link to={course.discipline?.id ? `/admin/disciplines` : '#'} className={`mt-0.5 block truncate text-sm font-bold text-gray-900 hover:underline dark:text-gray-100 ${course.discipline?.id ? 'hover:text-stone-600 dark:hover:text-stone-400' : 'cursor-not-allowed text-gray-500 dark:text-gray-600'}`}>
                {course.discipline?.name || '—'}
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <MapPin size={15} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Stable</p>
              <Link
                to={course.stable?.id ? `/admin/stables/${course.stable.id}` : '#'}
                className={`mt-0.5 block truncate text-sm font-bold text-gray-900 hover:underline dark:text-gray-100 ${course.stable?.id ? 'hover:text-emerald-600 dark:hover:text-emerald-400' : 'cursor-not-allowed text-gray-500 dark:text-gray-600'}`}
              >
                {course.stable?.name || '—'}
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/30">
              <CalendarDays size={15} className="text-sky-600 dark:text-sky-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Date Range</p>
              <p className="mt-0.5 text-sm font-bold text-gray-900 dark:text-gray-100">
                {course.start_date || '—'}
                <span className="mx-1.5 font-normal text-gray-300 dark:text-gray-600">→</span>
                {course.end_date || '—'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
              <Clock3 size={15} className="text-violet-600 dark:text-violet-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Time</p>
              <p className="mt-0.5 text-sm font-bold text-gray-900 dark:text-gray-100">
                {startTime || '—'}
                {startTime && endTime && (
                  <span className="mx-1.5 font-normal text-gray-300 dark:text-gray-600">→</span>
                )}
                {endTime || ''}
              </p>
            </div>
          </div>

          {course.price != null && (
            <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/30">
                <TrendingUp size={15} className="text-rose-600 dark:text-rose-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Price</p>
                <p className="mt-0.5 text-sm font-bold text-gray-900 dark:text-gray-100">{course.price}</p>
              </div>
            </div>
          )}

        </div>

        {course.description && (
          <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3.5 dark:border-gray-700/60 dark:bg-gray-800/40">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">About this Course</p>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{course.description}</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default memo(CourseOverviewCard);