import {
  getStableModules,
  setStableModule,
  getGlobalModuleDefaults,
  setGlobalModuleDefaults,
} from '../services/module.service.js';

const handleError = (res, error) => {
  const msg = (error.message || '').toLowerCase();
  const isClientError =
    msg.includes('invalid') || msg.includes('not found') || msg.includes('required');
  return res.status(isClientError ? 400 : 500).json({
    message: error.message || 'Internal server error.',
  });
};

export const getStableModulesController = async (req, res) => {
  try {
    const data = await getStableModules(Number(req.params.stableId));
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const setStableModuleController = async (req, res) => {
  try {
    const { enabled, config } = req.body;
    if (enabled === undefined) {
      return res.status(400).json({ message: 'enabled (true/false) is required.' });
    }
    const data = await setStableModule(
      Number(req.params.stableId),
      req.params.moduleKey,
      enabled,
      req.user.id,
      config || null,
    );
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getGlobalModuleDefaultsController = async (req, res) => {
  try {
    const data = await getGlobalModuleDefaults();
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const setGlobalModuleDefaultsController = async (req, res) => {
  try {
    const { modules } = req.body;
    if (!modules || typeof modules !== 'object') {
      return res.status(400).json({ message: 'modules object is required.' });
    }
    const data = await setGlobalModuleDefaults(modules);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};
