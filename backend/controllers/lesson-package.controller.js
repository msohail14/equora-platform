import {
  createPackage,
  deletePackage,
  getCoachPackages,
  getPackageById,
  updatePackage,
  purchasePackage,
  getMyPackages,
} from '../services/lesson-package.service.js';

const handleError = (res, error) => {
  const isValidationError =
    error.message.includes('required') ||
    error.message.includes('not found') ||
    error.message.includes('access denied') ||
    error.message.includes('must be');

  return res.status(isValidationError ? 400 : 500).json({
    message: error.message || 'Internal server error.',
  });
};

export const createPackageController = async (req, res) => {
  try {
    const data = await createPackage({
      coachId: req.user.id,
      payload: req.body,
    });
    return res.status(201).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getCoachPackagesController = async (req, res) => {
  try {
    const data = await getCoachPackages({
      coachId: req.params.id,
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getPackageByIdController = async (req, res) => {
  try {
    const data = await getPackageById({ packageId: req.params.id });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const updatePackageController = async (req, res) => {
  try {
    const data = await updatePackage({
      coachId: req.user.id,
      packageId: req.params.id,
      payload: req.body,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const purchasePackageController = async (req, res) => {
  try {
    const data = await purchasePackage({
      riderId: req.user.id,
      packageId: req.params.id,
      paymentId: req.body.payment_id,
    });
    return res.status(201).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const deletePackageController = async (req, res) => {
  try {
    const data = await deletePackage({
      coachId: req.user.id,
      packageId: req.params.id,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getMyPackagesController = async (req, res) => {
  try {
    const data = await getMyPackages({
      riderId: req.user.id,
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};
