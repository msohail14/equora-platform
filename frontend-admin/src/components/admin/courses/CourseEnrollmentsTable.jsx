import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Mail } from 'lucide-react';

const statusCls = (status) => {
  if (status === 'active') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'inactive') return 'bg-rose-50 text-rose-600 border-rose-200';
  return 'bg-gray-100 text-gray-600 border-gray-200';
};

const CourseEnrollmentsTable = ({ enrollments = [], onCreateForRider, isOneToOne = false }) => {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-4 dark:border-gray-800 dark:bg-gray-800/50">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
            <Users size={15} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Enrolled Riders</h2>
            <p className="text-[11px] text-gray-400">{enrollments.length} total</p>
          </div>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        {enrollments.length > 0 ? (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {['Rider', 'Email', 'Status', 'Source', ...(isOneToOne ? ['Action'] : [])].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enrollments.map((item) => {
                const riderId = item.rider?.id;
                const name = item.rider
                  ? `${item.rider.first_name || ''} ${item.rider.last_name || ''}`.trim()
                  : '-';
                return (
                  <tr
                    key={item.id}
                    className="group border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/80 dark:border-gray-800/50 dark:hover:bg-gray-800/30"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[11px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          {name.charAt(0) || '?'}
                        </div>
                        {riderId ? (
                          <Link
                            to={`/admin/rider/${riderId}`}
                            className="cursor-pointer font-semibold text-gray-800 transition hover:text-amber-600 hover:underline dark:text-gray-100 dark:hover:text-amber-400"
                          >
                            {name}
                          </Link>
                        ) : (
                          <span className="font-semibold text-gray-800 dark:text-gray-100">{name}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                        <Mail size={12} className="shrink-0" />
                        {item.rider?.email || '-'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${statusCls(item.status)}`}>
                        <span className="size-1.5 rounded-full bg-current" />
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                      {item.enrollment_source || '-'}
                    </td>
                    {isOneToOne && (
                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() => onCreateForRider?.(item)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40"
                        >
                          <Plus size={12} />
                          Add Session
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-10">
            <Users size={28} className="text-gray-300" />
            <p className="text-sm text-gray-400">No enrollments found.</p>
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="grid gap-2 p-4 md:hidden">
        {enrollments.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400 dark:border-gray-700">
            No enrollments found.
          </p>
        ) : (
          enrollments.map((item) => {
            const riderId = item.rider?.id;
            const name = item.rider
              ? `${item.rider.first_name || ''} ${item.rider.last_name || ''}`.trim()
              : '-';
            return (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3 dark:border-gray-800">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                    {name.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0">
                    {riderId ? (
                      <Link
                        to={`/admin/rider/${riderId}`}
                        className="block cursor-pointer truncate text-sm font-semibold text-gray-800 transition hover:text-amber-600 hover:underline dark:text-gray-100 dark:hover:text-amber-400"
                      >
                        {name}
                      </Link>
                    ) : (
                      <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">{name}</p>
                    )}
                    <p className="truncate text-xs text-gray-400">{item.rider?.email || '-'}</p>
                    <p className="truncate text-[11px] text-gray-400">{item.enrollment_source || '-'}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${statusCls(item.status)}`}>
                    {item.status}
                  </span>
                  {isOneToOne && (
                    <button
                      type="button"
                      onClick={() => onCreateForRider?.(item)}
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700"
                    >
                      <Plus size={11} /> Add
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

export default memo(CourseEnrollmentsTable);
