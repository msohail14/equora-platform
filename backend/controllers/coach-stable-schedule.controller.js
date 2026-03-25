import {
  createSchedule,
  getSchedules,
  updateSchedule,
  deleteSchedule,
  findCoachStableLink,
} from '../services/coach-stable-schedule.service.js';

const handleError = (res, error) => {
  const is400 = error.message.includes('not found') || error.message.includes('not linked') || error.message.includes('required');
  return res.status(is400 ? 400 : 500).json({ message: error.message });
};

// Admin: manage schedules for any coach at any stable
export const adminCreateScheduleController = async (req, res) => {
  try {
    const link = await findCoachStableLink(req.params.coachId, req.params.stableId);
    const schedule = await createSchedule(link.id, req.body);
    return res.status(201).json(schedule);
  } catch (error) {
    return handleError(res, error);
  }
};

export const adminGetSchedulesController = async (req, res) => {
  try {
    const link = await findCoachStableLink(req.params.coachId, req.params.stableId);
    const data = await getSchedules(link.id);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const adminUpdateScheduleController = async (req, res) => {
  try {
    const schedule = await updateSchedule(req.params.scheduleId, req.body);
    return res.status(200).json(schedule);
  } catch (error) {
    return handleError(res, error);
  }
};

export const adminDeleteScheduleController = async (req, res) => {
  try {
    const data = await deleteSchedule(req.params.scheduleId);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

// Coach self-management: manage own schedules at a stable
export const coachCreateScheduleController = async (req, res) => {
  try {
    const link = await findCoachStableLink(req.user.id, req.params.stableId);
    const schedule = await createSchedule(link.id, req.body);
    return res.status(201).json(schedule);
  } catch (error) {
    return handleError(res, error);
  }
};

export const coachGetSchedulesController = async (req, res) => {
  try {
    const link = await findCoachStableLink(req.user.id, req.params.stableId);
    const data = await getSchedules(link.id);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};
