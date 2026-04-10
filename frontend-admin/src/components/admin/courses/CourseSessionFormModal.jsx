import { memo, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarDays, CheckCircle2, Clock3, Loader2, XCircle } from 'lucide-react';
import Modal from '../../ui/Modal';
import AppButton from '../../ui/AppButton';
import FormInput from '../../ui/FormInput';
import { formatTime12h } from '../../../lib/timeFormat';

const selectCls =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';

const DAY_NAMES = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const normalizeTimeForInput = (timeValue) => String(timeValue || '').slice(0, 5);

const formatDateShort = (dateValue) => {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
};

const formatTimeLabel = formatTime12h;

const CourseSessionFormModal = ({
  isOpen,
  title,
  onClose,
  form,
  onChange,
  onSubmit,
  submitting = false,
  isOneToOne = false,
  riders = [],
  isEdit = false,
  coachId,
  loadCoachAvailability,
}) => {
  const [availability, setAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);

  useEffect(() => {
    if (!isOpen || !coachId || typeof loadCoachAvailability !== 'function') {
      return;
    }

    let isCancelled = false;

    const run = async () => {
      setAvailabilityLoading(true);
      setAvailabilityError('');
      try {
        const data = await loadCoachAvailability(coachId, { days: 7 });
        if (isCancelled) return;
        const safeSchedule = Array.isArray(data?.schedule) ? data.schedule : [];
        setAvailability({
          coach: data?.coach || null,
          range: data?.range || null,
          schedule: safeSchedule,
        });
        const firstDayWithSlots = safeSchedule.findIndex((item) => (item?.slots || []).length > 0);
        setSelectedDayIndex(firstDayWithSlots >= 0 ? firstDayWithSlots : null);
      } catch (error) {
        if (isCancelled) return;
        setAvailability(null);
        setSelectedDayIndex(null);
        setAvailabilityError(error.message || 'Failed to load coach availability.');
      } finally {
        if (!isCancelled) {
          setAvailabilityLoading(false);
        }
      }
    };

    run();

    return () => {
      isCancelled = true;
    };
  }, [coachId, isOpen, loadCoachAvailability]);

  const activeDay = useMemo(() => {
    if (!availability?.schedule?.length) return null;
    if (selectedDayIndex === null || selectedDayIndex < 0 || selectedDayIndex >= availability.schedule.length) {
      return null;
    }
    return availability.schedule[selectedDayIndex];
  }, [availability?.schedule, selectedDayIndex]);

  const onPickSlot = (day, slot) => {
    onChange('session_date', day.date);
    onChange('start_time', normalizeTimeForInput(slot.start_time));
    onChange('end_time', normalizeTimeForInput(slot.end_time));
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} title={title} onClose={onClose}>
      <div className="grid gap-4 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <section className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Coach Availability</p>
              {availability?.range ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {availability.range.from_date} to {availability.range.to_date}
                </p>
              ) : null}
            </div>
            {availability?.coach ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                {availability.coach.is_active ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                {availability.coach.is_active ? 'Active' : 'Inactive'}
              </span>
            ) : null}
          </div>

          {availabilityLoading ? (
            <div className="flex min-h-28 items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Loader2 size={16} className="animate-spin" />
              Loading slots...
            </div>
          ) : availabilityError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-300">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertCircle size={12} />
                Availability unavailable
              </div>
              <p className="mt-1">{availabilityError}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1">
                {(availability?.schedule || []).map((day, index) => {
                  const hasSlots = (day?.slots || []).length > 0;
                  const isSelected = selectedDayIndex === index;
                  return (
                    <button
                      key={day.date || index}
                      type="button"
                      disabled={!hasSlots}
                      onClick={() => setSelectedDayIndex(index)}
                      className={`rounded-lg px-1 py-1.5 text-center transition ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : hasSlots
                          ? 'cursor-pointer border border-transparent text-gray-700 hover:bg-indigo-50 dark:text-gray-300 dark:hover:bg-indigo-950/30'
                          : 'cursor-not-allowed text-gray-300 dark:text-gray-600'
                      }`}
                    >
                      <p className="text-[9px] font-semibold uppercase tracking-wide">
                        {DAY_NAMES[Number(day.day_of_week)] || '-'}
                      </p>
                      <p className="text-xs font-bold">{String(day.date || '').slice(8, 10)}</p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 rounded-lg border border-gray-200 p-2 dark:border-gray-800">
                {activeDay ? (
                  <>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      {formatDateShort(activeDay.date)} | {(activeDay.slots || []).length} slots
                    </p>
                    <div className="max-h-56 space-y-1.5 overflow-auto pr-0.5">
                      {(activeDay.slots || []).map((slot, idx) => (
                        <button
                          key={`${activeDay.date}-${slot.start_time}-${idx}`}
                          type="button"
                          onClick={() => onPickSlot(activeDay, slot)}
                          className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-2 text-left transition hover:bg-indigo-100 dark:border-indigo-900/40 dark:bg-indigo-950/25 dark:hover:bg-indigo-950/45"
                        >
                          <span className="flex items-center gap-1.5 text-xs font-medium text-gray-800 dark:text-gray-100">
                            <Clock3 size={12} className="text-indigo-500" />
                            {formatTimeLabel(slot.start_time)} to {formatTimeLabel(slot.end_time)}
                          </span>
                          <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                            {slot.slot_duration_minutes}m
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex min-h-24 flex-col items-center justify-center text-center">
                    <CalendarDays size={16} className="mb-1 text-gray-300 dark:text-gray-600" />
                    <p className="text-xs text-gray-400 dark:text-gray-500">No slots available in this period.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        <form className="grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
          {isOneToOne ? (
            <label className="grid gap-1.5 sm:col-span-2">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Rider</span>
              <select
                className={selectCls}
                value={form.rider_id}
                onChange={(e) => onChange('rider_id', e.target.value)}
                disabled={isEdit}
                required
              >
                <option value="">Select Rider</option>
                {riders.map((item) => (
                  <option key={item.id} value={item.rider?.id || ''}>
                    {item.rider
                      ? `${item.rider.first_name || ''} ${item.rider.last_name || ''}`.trim()
                      : '-'}{' '}
                    ({item.rider?.email || '-'})
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <FormInput
            label="Session Date"
            name="session_date"
            type="date"
            value={form.session_date}
            onChange={(e) => onChange('session_date', e.target.value)}
            required
          />
          <FormInput
            label="Start Time"
            name="start_time"
            type="time"
            value={form.start_time}
            onChange={(e) => onChange('start_time', e.target.value)}
            required
          />
          <FormInput
            label="End Time"
            name="end_time"
            type="time"
            value={form.end_time}
            onChange={(e) => onChange('end_time', e.target.value)}
            required
          />

          <div className="sm:col-span-2">
            <div className="flex flex-wrap gap-2 pt-1">
              <AppButton type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : isEdit ? 'Update Session' : 'Create Session'}
              </AppButton>
              <AppButton type="button" variant="secondary" onClick={onClose}>
                Cancel
              </AppButton>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default memo(CourseSessionFormModal);
