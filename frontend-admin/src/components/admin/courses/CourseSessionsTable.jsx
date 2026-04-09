import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CircleAlert,
  Ban,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ListChecks,
  Pencil,
} from 'lucide-react';
import Modal from '../../ui/Modal';
import { formatTime12h } from '../../../lib/timeFormat';

const statusConfig = {
  scheduled: {
    cls: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800/50',
    dot: 'bg-indigo-500',
  },
  completed: {
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50',
    dot: 'bg-emerald-500',
  },
  cancelled: {
    cls: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800/50',
    dot: 'bg-rose-500',
  },
};

const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status] || {
    cls: 'bg-gray-100 text-gray-600 border-gray-200',
    dot: 'bg-gray-400',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${cfg.cls}`}
    >
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
};

const isUpcomingSession = (item) => {
  const datePart = String(item?.session_date || '').slice(0, 10);
  const rawTime = String(item?.start_time || '');
  const timePart = rawTime.length === 5 ? `${rawTime}:00` : rawTime;
  const sessionStart = new Date(`${datePart}T${timePart}`);
  if (Number.isNaN(sessionStart.getTime())) {
    return false;
  }
  return sessionStart.getTime() > Date.now();
};

const CourseSessionsTable = ({
  sessions = [],
  pagination,
  loading,
  onPrev,
  onNext,
  onEdit,
  onCancel,
  canManage = true,
  showCourse = false,
}) => {
  const [reasonModal, setReasonModal] = useState({ open: false, session: null });
  const currentPage = pagination?.page || 1;
  const totalPages = pagination?.totalPages || 1;
  const headers = showCourse
    ? ['Date', 'Time', 'Course', 'Rider', 'Status', 'Actions']
    : ['Date', 'Time', 'Rider', 'Status', 'Actions'];

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-4 dark:border-gray-800 dark:bg-gray-800/50">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
            <ListChecks size={15} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Sessions</h2>
            <p className="text-[11px] text-gray-400">{sessions.length} on this page</p>
          </div>
        </div>
        <span className="text-xs text-gray-400">
          Page {currentPage} of {totalPages}
        </span>
      </div>

      <div className="hidden md:block">
        {sessions.length > 0 ? (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {headers.map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.map((item) => {
                const riderName = item.rider
                  ? `${item.rider.first_name || ''} ${item.rider.last_name || ''}`.trim()
                  : 'Group session';
                const riderId = item.rider?.id;
                const courseId = item.course?.id;
                const canEditOrCancel =
                  canManage && item.status === 'scheduled' && isUpcomingSession(item);
                const isCancelled = item.status === 'cancelled';
                return (
                  <tr
                    key={item.id}
                    className="group border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/80 dark:border-gray-800/50 dark:hover:bg-gray-800/30"
                  >
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1.5 font-semibold text-gray-800 dark:text-gray-100">
                        <CalendarDays size={13} className="text-gray-400" />
                        {item.session_date}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                        <Clock3 size={13} className="text-gray-400" />
                        {formatTime12h(item.start_time)} to {formatTime12h(item.end_time)}
                      </span>
                    </td>
                    {showCourse ? (
                      <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                        {courseId ? (
                          <Link
                            to={`/admin/courses/${courseId}`}
                            className="cursor-pointer transition hover:text-indigo-600 hover:underline dark:hover:text-indigo-400"
                          >
                            {item.course?.title || '-'}
                          </Link>
                        ) : (
                          item.course?.title || '-'
                        )}
                      </td>
                    ) : null}
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                      {riderId ? (
                        <Link
                          to={`/admin/rider/${riderId}`}
                          className="cursor-pointer transition hover:text-indigo-600 hover:underline dark:hover:text-indigo-400"
                        >
                          {riderName}
                        </Link>
                      ) : (
                        riderName
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {isCancelled ? (
                          <button
                            type="button"
                            onClick={() => setReasonModal({ open: true, session: item })}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/35"
                          >
                            <CircleAlert size={12} /> Reason
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => onEdit?.(item)}
                              disabled={!canEditOrCancel}
                              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              <Pencil size={12} /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => onCancel?.(item)}
                              disabled={!canEditOrCancel}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-100 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40"
                            >
                              <Ban size={12} /> Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : !loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10">
            <ListChecks size={28} className="text-gray-300" />
            <p className="text-sm text-gray-400">No sessions found.</p>
          </div>
        ) : null}
      </div>

      <div className="grid gap-2 p-4 md:hidden">
        {sessions.length === 0 && !loading ? (
          <p className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400 dark:border-gray-700">
            No sessions found.
          </p>
        ) : (
          sessions.map((item) => {
            const riderName = item.rider
              ? `${item.rider.first_name || ''} ${item.rider.last_name || ''}`.trim()
              : 'Group session';
            const riderId = item.rider?.id;
            const courseId = item.course?.id;
            const canEditOrCancel =
              canManage && item.status === 'scheduled' && isUpcomingSession(item);
            const isCancelled = item.status === 'cancelled';
            return (
              <div key={item.id} className="rounded-xl border border-gray-100 p-3.5 dark:border-gray-800">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 dark:text-gray-100">
                    <CalendarDays size={13} className="text-gray-400" />
                    {item.session_date}
                  </span>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mb-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                  <Clock3 size={12} /> {formatTime12h(item.start_time)} to {formatTime12h(item.end_time)}
                </p>
                {showCourse ? (
                  <p className="mb-1 text-xs text-gray-400">
                    Course:{' '}
                    {courseId ? (
                      <Link
                        to={`/admin/courses/${courseId}`}
                        className="cursor-pointer text-gray-500 transition hover:text-indigo-600 hover:underline dark:text-gray-300 dark:hover:text-indigo-400"
                      >
                        {item.course?.title || '-'}
                      </Link>
                    ) : (
                      item.course?.title || '-'
                    )}
                  </p>
                ) : null}
                <p className="mb-3 text-xs text-gray-400">
                  {riderId ? (
                    <Link
                      to={`/admin/rider/${riderId}`}
                      className="cursor-pointer text-gray-500 transition hover:text-indigo-600 hover:underline dark:text-gray-300 dark:hover:text-indigo-400"
                    >
                      {riderName}
                    </Link>
                  ) : (
                    riderName
                  )}
                </p>
                <div className="flex gap-1.5">
                  {isCancelled ? (
                    <button
                      type="button"
                      onClick={() => setReasonModal({ open: true, session: item })}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300"
                    >
                      <CircleAlert size={11} /> Reason
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onEdit?.(item)}
                        disabled={!canEditOrCancel}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      >
                        <Pencil size={11} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onCancel?.(item)}
                        disabled={!canEditOrCancel}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-100 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-400"
                      >
                        <Ban size={11} /> Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-3 dark:border-gray-800">
        <button
          type="button"
          disabled={!pagination?.hasPrev || loading}
          onClick={onPrev}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <ChevronLeft size={13} /> Prev
        </button>
        <span className="text-xs text-gray-400">
          {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          disabled={!pagination?.hasNext || loading}
          onClick={onNext}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Next <ChevronRight size={13} />
        </button>
      </div>

      <Modal
        isOpen={reasonModal.open}
        title="Cancellation Reason"
        onClose={() => setReasonModal({ open: false, session: null })}
      >
        <div className="grid gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Session
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-200">
            {reasonModal.session?.session_date || '-'} | {formatTime12h(reasonModal.session?.start_time)} to{' '}
            {formatTime12h(reasonModal.session?.end_time)}
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Reason
          </p>
          <p className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
            {reasonModal.session?.cancel_reason || 'No reason provided.'}
          </p>
        </div>
      </Modal>
    </section>
  );
};

export default memo(CourseSessionsTable);
