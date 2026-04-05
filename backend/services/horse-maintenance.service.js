import { Op } from 'sequelize';
import HorseMaintenance from '../models/horseMaintenance.model.js';
import Horse from '../models/horse.model.js';
import Stable from '../models/stable.model.js';

const ensureHorseOwnedByAdmin = async (horseId, adminId) => {
  const horse = await Horse.findByPk(horseId, {
    include: [{ model: Stable, as: 'stable' }],
  });
  if (!horse) throw new Error('Horse not found.');
  if (Number(horse.stable?.admin_id) !== Number(adminId)) {
    throw new Error('Access denied. This horse does not belong to your stable.');
  }
  return horse;
};

/**
 * Create a maintenance log entry for a horse.
 */
export const createMaintenanceLog = async ({
  horseId, adminId, type, title, description, providerName, cost,
  datePerformed, nextDueDate, attachments,
}) => {
  const horse = await ensureHorseOwnedByAdmin(horseId, adminId);

  if (!type || !title || !datePerformed) {
    throw new Error('type, title, and date_performed are required.');
  }

  const log = await HorseMaintenance.create({
    horse_id: horseId,
    stable_id: horse.stable_id,
    type,
    title,
    description: description || null,
    provider_name: providerName || null,
    cost: cost != null ? Number(cost) : null,
    date_performed: datePerformed,
    next_due_date: nextDueDate || null,
    attachments: attachments || null,
    created_by: adminId,
  });

  return { message: 'Maintenance log created.', data: log };
};

/**
 * Get maintenance history for a horse (paginated, newest first).
 */
export const getMaintenanceLogs = async ({ horseId, adminId, type, page = 1, limit = 20 }) => {
  await ensureHorseOwnedByAdmin(horseId, adminId);

  const offset = (Math.max(1, Number(page)) - 1) * Number(limit);
  const where = { horse_id: horseId };
  if (type) where.type = type;

  const { rows, count } = await HorseMaintenance.findAndCountAll({
    where,
    order: [['date_performed', 'DESC'], ['created_at', 'DESC']],
    limit: Number(limit),
    offset,
  });

  return {
    data: rows,
    pagination: {
      total: count,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(count / Number(limit)),
    },
  };
};

/**
 * Get upcoming/overdue maintenance items for a horse.
 */
export const getUpcomingMaintenance = async ({ horseId, adminId }) => {
  await ensureHorseOwnedByAdmin(horseId, adminId);

  const today = new Date().toISOString().slice(0, 10);

  const overdue = await HorseMaintenance.findAll({
    where: {
      horse_id: horseId,
      next_due_date: { [Op.lt]: today },
    },
    order: [['next_due_date', 'ASC']],
  });

  const upcoming = await HorseMaintenance.findAll({
    where: {
      horse_id: horseId,
      next_due_date: { [Op.gte]: today },
    },
    order: [['next_due_date', 'ASC']],
    limit: 20,
  });

  return {
    data: {
      overdue,
      upcoming,
      overdue_count: overdue.length,
      upcoming_count: upcoming.length,
    },
  };
};

/**
 * Update a maintenance log entry.
 */
export const updateMaintenanceLog = async ({ horseId, logId, adminId, payload }) => {
  await ensureHorseOwnedByAdmin(horseId, adminId);

  const log = await HorseMaintenance.findOne({
    where: { id: logId, horse_id: horseId },
  });
  if (!log) throw new Error('Maintenance log not found.');

  if (payload.type !== undefined) log.type = payload.type;
  if (payload.title !== undefined) log.title = payload.title;
  if (payload.description !== undefined) log.description = payload.description || null;
  if (payload.provider_name !== undefined) log.provider_name = payload.provider_name || null;
  if (payload.cost !== undefined) log.cost = payload.cost != null ? Number(payload.cost) : null;
  if (payload.date_performed !== undefined) log.date_performed = payload.date_performed;
  if (payload.next_due_date !== undefined) log.next_due_date = payload.next_due_date || null;
  if (payload.attachments !== undefined) log.attachments = payload.attachments || null;
  log.updated_at = new Date();

  await log.save();
  return { message: 'Maintenance log updated.', data: log };
};

/**
 * Delete a maintenance log entry.
 */
export const deleteMaintenanceLog = async ({ horseId, logId, adminId }) => {
  await ensureHorseOwnedByAdmin(horseId, adminId);

  const log = await HorseMaintenance.findOne({
    where: { id: logId, horse_id: horseId },
  });
  if (!log) throw new Error('Maintenance log not found.');

  await log.destroy();
  return { message: 'Maintenance log deleted.' };
};

/**
 * Get maintenance overview for all horses in a stable (for dashboard).
 */
export const getMaintenanceOverview = async ({ adminId, stableId }) => {
  // Verify admin owns this stable
  const stable = await Stable.findByPk(stableId);
  if (!stable) throw new Error('Stable not found.');
  if (Number(stable.admin_id) !== Number(adminId)) {
    throw new Error('Access denied.');
  }

  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const overdue = await HorseMaintenance.findAll({
    where: {
      stable_id: stableId,
      next_due_date: { [Op.lt]: today },
    },
    include: [{ model: Horse, as: 'horse', attributes: ['id', 'name', 'status'] }],
    order: [['next_due_date', 'ASC']],
  });

  const dueSoon = await HorseMaintenance.findAll({
    where: {
      stable_id: stableId,
      next_due_date: { [Op.between]: [today, sevenDaysFromNow] },
    },
    include: [{ model: Horse, as: 'horse', attributes: ['id', 'name', 'status'] }],
    order: [['next_due_date', 'ASC']],
  });

  const recentLogs = await HorseMaintenance.findAll({
    where: { stable_id: stableId },
    include: [{ model: Horse, as: 'horse', attributes: ['id', 'name', 'status'] }],
    order: [['date_performed', 'DESC']],
    limit: 10,
  });

  // Count injured horses
  const injuredHorses = await Horse.count({
    where: { stable_id: stableId, status: 'injured' },
  });

  return {
    data: {
      overdue,
      due_soon: dueSoon,
      recent_logs: recentLogs,
      summary: {
        overdue_count: overdue.length,
        due_soon_count: dueSoon.length,
        injured_horses: injuredHorses,
        needs_attention: overdue.length + injuredHorses,
      },
    },
  };
};
