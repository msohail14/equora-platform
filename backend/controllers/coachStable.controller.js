import {
  getCoachStables,
  linkCoachToStable,
  unlinkCoachFromStable,
  getStableLinkedCoaches,
  adminLinkCoachToStable,
  adminUnlinkCoachFromStable,
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
