import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Pencil,
  Plus,
  Save,
  Timer,
  Trash2,
  XCircle,
} from 'lucide-react';
import { formatTime12h } from '../../lib/timeFormat';
import Modal from '../ui/Modal';
import {
  createCoachWeeklyAvailabilityByAdminApi,
  deleteCoachWeeklyAvailabilityByAdminApi,
  getCoachWeeklyAvailabilityByAdminApi,
  updateCoachWeeklyAvailabilityByAdminApi,
} from '../../features/operations/operationsApi';

const DAYS = [
  { num: 1, short: 'Mon', long: 'Monday' },
  { num: 2, short: 'Tue', long: 'Tuesday' },
  { num: 3, short: 'Wed', long: 'Wednesday' },
  { num: 4, short: 'Thu', long: 'Thursday' },
  { num: 5, short: 'Fri', long: 'Friday' },
  { num: 6, short: 'Sat', long: 'Saturday' },
  { num: 7, short: 'Sun', long: 'Sunday' }
];

const emptyForm = {
  day_of_week: '1',
  start_time: '09:00',
  end_time: '10:00',
  slot_duration_minutes: '60',
  valid_from: '',
  valid_to: '',
  is_active: true,
};

const toInputTime = (value) => String(value || '').slice(0, 5);
const toApiTime = (value) => (value ? `${value}:00` : null);
const toMinutes = (value) => {
  const [h, m] = String(value || '')
    .split(':')
    .map((item) => Number(item));
  if (!Number.isInteger(h) || !Number.isInteger(m)) return null;
  return h * 60 + m;
};
const rangesOverlap = (aStart, aEnd, bStart, bEnd) => {
  const minDate = '0001-01-01';
  const maxDate = '9999-12-31';
  const startA = aStart || minDate;
  const endA = aEnd || maxDate;
  const startB = bStart || minDate;
  const endB = bEnd || maxDate;
  return startA <= endB && startB <= endA;
};

const getComparableMinute = (timeValue) => {
  const minutes = toMinutes(toInputTime(timeValue));
  return minutes === null ? Number.MAX_SAFE_INTEGER : minutes;
};

const CoachWeeklyScheduleCalendar = ({ coachId }) => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const data = await getCoachWeeklyAvailabilityByAdminApi(coachId, { include_inactive: true });
      setSlots(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message || 'Failed to load weekly schedule.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!coachId) return;
    fetchSlots();
  }, [coachId]);

  const slotsByDay = useMemo(() => {
    const map = new Map(DAYS.map((day) => [day.num, []]));
    const sortedSlots = [...slots].sort((a, b) => {
      const dayDiff = Number(a.day_of_week) - Number(b.day_of_week);
      if (dayDiff !== 0) return dayDiff;
      return getComparableMinute(a.start_time) - getComparableMinute(b.start_time);
    });

    sortedSlots.forEach((slot) => {
      const list = map.get(Number(slot.day_of_week)) || [];
      list.push(slot);
      map.set(Number(slot.day_of_week), list);
    });

    return map;
  }, [slots]);

  const openAdd = (dayNum = 1) => {
    setEditingSlot(null);
    setForm({ ...emptyForm, day_of_week: String(dayNum) });
    setShowForm(true);
  };

  const openEdit = (slot) => {
    setEditingSlot(slot);
    setForm({
      day_of_week: String(slot.day_of_week),
      start_time: toInputTime(slot.start_time),
      end_time: toInputTime(slot.end_time),
      slot_duration_minutes: String(slot.slot_duration_minutes ?? 60),
      valid_from: slot.valid_from || '',
      valid_to: slot.valid_to || '',
      is_active: slot.is_active !== false,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setForm(emptyForm);
    setEditingSlot(null);
    setShowForm(false);
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    const candidateDay = Number(form.day_of_week);
    const candidateStart = toMinutes(form.start_time);
    const candidateEnd = toMinutes(form.end_time);
    const candidateValidFrom = form.valid_from || null;
    const candidateValidTo = form.valid_to || null;

    if (candidateStart === null || candidateEnd === null || candidateEnd <= candidateStart) {
      toast.error('End time must be greater than start time.');
      return;
    }

    const hasOverlap = slots.some((slot) => {
      if (Number(slot.day_of_week) !== candidateDay) return false;
      if (editingSlot && slot.id === editingSlot.id) return false;

      const slotStart = toMinutes(toInputTime(slot.start_time));
      const slotEnd = toMinutes(toInputTime(slot.end_time));
      if (slotStart === null || slotEnd === null) return false;

      const timeOverlap = candidateStart < slotEnd && candidateEnd > slotStart;
      if (!timeOverlap) return false;

      return rangesOverlap(
        candidateValidFrom,
        candidateValidTo,
        slot.valid_from || null,
        slot.valid_to || null
      );
    });

    if (hasOverlap) {
      toast.error('This slot overlaps with an existing schedule for the same day.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        day_of_week: candidateDay,
        start_time: toApiTime(form.start_time),
        end_time: toApiTime(form.end_time),
        slot_duration_minutes: Number(form.slot_duration_minutes),
        valid_from: form.valid_from || null,
        valid_to: form.valid_to || null,
        is_active: form.is_active,
      };
      if (editingSlot) {
        await updateCoachWeeklyAvailabilityByAdminApi({
          coachId,
          availabilityId: editingSlot.id,
          payload,
        });
        toast.success('Schedule updated successfully.');
      } else {
        await createCoachWeeklyAvailabilityByAdminApi({ coachId, payload });
        toast.success('Schedule added successfully.');
      }
      closeForm();
      await fetchSlots();
    } catch (error) {
      toast.error(error.message || 'Failed to save schedule.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCoachWeeklyAvailabilityByAdminApi({
        coachId,
        availabilityId: deleteTarget.id,
      });
      toast.success('Schedule deleted successfully.');
      setDeleteTarget(null);
      await fetchSlots();
    } catch (error) {
      toast.error(error.message || 'Failed to delete schedule.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="h-1 w-full bg-gradient-to-r from-teal-400 via-violet-500 to-indigo-500" />
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
        <h3 className="flex items-center gap-2 text-base font-bold text-gray-800 dark:text-gray-100">
          <CalendarDays size={18} className="text-teal-500" />
          Weekly Availability
        </h3>
        <button
          type="button"
          onClick={() => openAdd(1)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-2 text-xs font-bold text-white shadow transition hover:from-teal-600 hover:to-cyan-600"
        >
          <Plus size={14} /> Add Schedule
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-12">
          <Loader2 size={22} className="animate-spin text-violet-500" />
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading schedule...</span>
        </div>
      ) : (
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {DAYS.map((day) => {
            const daySlots = slotsByDay.get(day.num) || [];
            return (
              <div key={day.num} className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/30">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{day.long}</p>
                </div>
                <div className="space-y-2">
                  {daySlots.length ? (
                    daySlots.map((slot) => (
                      <div
                        key={slot.id}
                        className={`rounded-lg border p-2 ${
                          slot.is_active
                            ? 'border-teal-200 bg-teal-50 dark:border-teal-900/50 dark:bg-teal-900/15'
                            : 'border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800'
                        }`}
                      >
                        <p className="flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-200">
                          <Clock3 size={12} />
                          {formatTime12h(slot.start_time)} to {formatTime12h(slot.end_time)}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Timer size={12} />
                          {slot.slot_duration_minutes} min
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {slot.valid_from || '-'} to {slot.valid_to || '-'}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              slot.is_active
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {slot.is_active ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                            {slot.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              className="rounded-md border border-emerald-200 bg-emerald-50 p-1 text-emerald-700 hover:bg-emerald-100"
                              onClick={() => openEdit(slot)}
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              type="button"
                              className="rounded-md border border-rose-200 bg-rose-50 p-1 text-rose-700 hover:bg-rose-100"
                              onClick={() => setDeleteTarget(slot)}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-gray-500">No slots</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={showForm}
        title={editingSlot ? 'Edit Schedule Slot' : 'Add Schedule Slot'}
        onClose={closeForm}
      >
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Day</span>
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={form.day_of_week}
              onChange={(e) => setForm((prev) => ({ ...prev, day_of_week: e.target.value }))}
            >
              {DAYS.map((day) => (
                <option key={day.num} value={day.num}>{day.long}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Slot Duration</span>
            <input
              type="number"
              min={1}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={form.slot_duration_minutes}
              onChange={(e) => setForm((prev) => ({ ...prev, slot_duration_minutes: e.target.value }))}
              required
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Start Time</span>
            <input
              type="time"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={form.start_time}
              onChange={(e) => setForm((prev) => ({ ...prev, start_time: e.target.value }))}
              required
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">End Time</span>
            <input
              type="time"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={form.end_time}
              onChange={(e) => setForm((prev) => ({ ...prev, end_time: e.target.value }))}
              required
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Valid From</span>
            <input
              type="date"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={form.valid_from}
              onChange={(e) => setForm((prev) => ({ ...prev, valid_from: e.target.value }))}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Valid To</span>
            <input
              type="date"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={form.valid_to}
              onChange={(e) => setForm((prev) => ({ ...prev, valid_to: e.target.value }))}
            />
          </label>
          <label className="grid gap-1.5 sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</span>
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              value={form.is_active ? 'true' : 'false'}
              onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.value === 'true' }))}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : editingSlot ? <Save size={14} /> : <Plus size={14} />}
              {saving ? 'Saving...' : editingSlot ? 'Update Slot' : 'Add Slot'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(deleteTarget)}
        title="Delete Schedule Slot"
        onClose={() => setDeleteTarget(null)}
      >
        <div className="grid gap-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            This action cannot be undone. Are you sure you want to delete this schedule slot?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
            >
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Delete
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CoachWeeklyScheduleCalendar;
