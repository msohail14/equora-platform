import { CoachStable, CoachStableSchedule } from '../models/index.js';

export const createSchedule = async (coachStableId, payload) => {
  const link = await CoachStable.findByPk(coachStableId);
  if (!link) throw new Error('Coach-stable link not found.');

  const schedule = await CoachStableSchedule.create({
    coach_stable_id: coachStableId,
    day_of_week: payload.day_of_week,
    start_time: payload.start_time,
    end_time: payload.end_time,
    slot_duration_minutes: payload.slot_duration_minutes || 45,
    is_active: payload.is_active !== undefined ? payload.is_active : true,
    valid_from: payload.valid_from || null,
    valid_to: payload.valid_to || null,
  });

  return schedule;
};

export const getSchedules = async (coachStableId) => {
  const link = await CoachStable.findByPk(coachStableId);
  if (!link) throw new Error('Coach-stable link not found.');

  const schedules = await CoachStableSchedule.findAll({
    where: { coach_stable_id: coachStableId },
    order: [['day_of_week', 'ASC'], ['start_time', 'ASC']],
  });

  return { data: schedules };
};

export const updateSchedule = async (scheduleId, payload) => {
  const schedule = await CoachStableSchedule.findByPk(scheduleId);
  if (!schedule) throw new Error('Schedule not found.');

  const allowed = ['day_of_week', 'start_time', 'end_time', 'slot_duration_minutes', 'is_active', 'valid_from', 'valid_to'];
  for (const key of allowed) {
    if (payload[key] !== undefined) {
      schedule[key] = payload[key];
    }
  }
  schedule.updated_at = new Date();
  await schedule.save();

  return schedule;
};

export const deleteSchedule = async (scheduleId) => {
  const schedule = await CoachStableSchedule.findByPk(scheduleId);
  if (!schedule) throw new Error('Schedule not found.');

  await schedule.destroy();
  return { message: 'Schedule deleted.' };
};

// Helper: find CoachStable link by coach + stable IDs
export const findCoachStableLink = async (coachId, stableId) => {
  const link = await CoachStable.findOne({
    where: { coach_id: coachId, stable_id: stableId },
  });
  if (!link) throw new Error('Coach is not linked to this stable.');
  return link;
};
