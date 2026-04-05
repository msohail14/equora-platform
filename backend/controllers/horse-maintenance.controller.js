import {
  createMaintenanceLog,
  getMaintenanceLogs,
  getUpcomingMaintenance,
  updateMaintenanceLog,
  deleteMaintenanceLog,
  getMaintenanceOverview,
} from '../services/horse-maintenance.service.js';

const handleError = (res, error) => {
  const msg = (error.message || '').toLowerCase();
  const isClientError =
    msg.includes('required') ||
    msg.includes('not found') ||
    msg.includes('access denied') ||
    msg.includes('invalid');
  return res.status(isClientError ? 400 : 500).json({
    message: error.message || 'Internal server error.',
  });
};

export const createMaintenanceLogController = async (req, res) => {
  try {
    const data = await createMaintenanceLog({
      horseId: Number(req.params.horseId),
      adminId: req.user.id,
      type: req.body.type,
      title: req.body.title,
      description: req.body.description,
      providerName: req.body.provider_name,
      cost: req.body.cost,
      datePerformed: req.body.date_performed,
      nextDueDate: req.body.next_due_date,
      attachments: req.body.attachments,
    });
    return res.status(201).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getMaintenanceLogsController = async (req, res) => {
  try {
    const data = await getMaintenanceLogs({
      horseId: Number(req.params.horseId),
      adminId: req.user.id,
      type: req.query.type,
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getUpcomingMaintenanceController = async (req, res) => {
  try {
    const data = await getUpcomingMaintenance({
      horseId: Number(req.params.horseId),
      adminId: req.user.id,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateMaintenanceLogController = async (req, res) => {
  try {
    const data = await updateMaintenanceLog({
      horseId: Number(req.params.horseId),
      logId: Number(req.params.logId),
      adminId: req.user.id,
      payload: req.body,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const deleteMaintenanceLogController = async (req, res) => {
  try {
    const data = await deleteMaintenanceLog({
      horseId: Number(req.params.horseId),
      logId: Number(req.params.logId),
      adminId: req.user.id,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getMaintenanceOverviewController = async (req, res) => {
  try {
    const data = await getMaintenanceOverview({
      adminId: req.user.id,
      stableId: Number(req.params.stableId),
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};
