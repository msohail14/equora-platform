import {
  getCoachStables,
  linkCoachToStable,
  unlinkCoachFromStable,
  getStableLinkedCoaches,
  adminLinkCoachToStable,
  adminUnlinkCoachFromStable,
  approveCoachRequest,
  rejectCoachRequest,
  getPendingCoachRequests,
  updateCoachStableVisibility,
} from '../services/coachStable.service.js';

const handleError = (res, error) => {
  const isValidation = error.message.includes('not found') || error.message.includes('required');
  return res.status(isValidation ? 400 : 500).json({ message: error.message });
};

export const getMyStablesController = async (req, res) => {
  try {
    const data = await getCoachStables({ coachId: req.user.id });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const linkMyStableController = async (req, res) => {
  try {
    const data = await linkCoachToStable({
      coachId: req.user.id,
      stableId: req.body.stable_id,
      isPrimary: req.body.is_primary || false,
      requestMessage: req.body.request_message || null,
    });
    return res.status(201).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const unlinkMyStableController = async (req, res) => {
  try {
    const data = await unlinkCoachFromStable({
      coachId: req.user.id,
      stableId: req.params.stableId,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getStableCoachesAdminController = async (req, res) => {
  try {
    const data = await getStableLinkedCoaches({ stableId: req.params.id });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const linkStableCoachAdminController = async (req, res) => {
  try {
    const data = await adminLinkCoachToStable({
      stableId: req.params.id,
      coachId: req.body.coach_id,
      isPrimary: req.body.is_primary || false,
    });
    return res.status(201).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const unlinkStableCoachAdminController = async (req, res) => {
  try {
    const data = await adminUnlinkCoachFromStable({
      stableId: req.params.id,
      coachId: req.params.coachId,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateVisibilityController = async (req, res, next) => {
  try {
    const coachId = req.user.id;
    const { stableId } = req.params;
    const { visibility } = req.body;
    if (!['public', 'featured_riders_only'].includes(visibility)) {
      return res.status(400).json({ error: 'Invalid visibility value' });
    }
    const result = await updateCoachStableVisibility({ coachId, stableId, visibility });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getPendingRequestsController = async (req, res, next) => {
  try {
    const { stableId } = req.params;
    const result = await getPendingCoachRequests({ stableId });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const approveRequestController = async (req, res, next) => {
  try {
    const { stableId, coachId } = req.params;
    const result = await approveCoachRequest({ stableId, coachId, reviewedBy: req.user.id });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const rejectRequestController = async (req, res, next) => {
  try {
    const { stableId, coachId } = req.params;
    const result = await rejectCoachRequest({ stableId, coachId, reviewedBy: req.user.id });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
