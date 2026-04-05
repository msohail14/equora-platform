import { isModuleEnabled } from '../services/module.service.js';

/**
 * Middleware factory that gates access to endpoints behind a module toggle.
 * If the module is not enabled for the resolved stable, returns 403.
 *
 * Resolves stable_id from (in order):
 *   1. req.params.stableId
 *   2. req.body.stable_id
 *   3. req.query.stable_id
 *   4. req.stableId (set by prior middleware)
 */
export const requireModule = (moduleKey) => async (req, res, next) => {
  const stableId =
    req.params.stableId ||
    req.body?.stable_id ||
    req.query?.stable_id ||
    req.stableId;

  if (!stableId) {
    return res.status(400).json({ message: 'stable_id is required for this feature.' });
  }

  try {
    const enabled = await isModuleEnabled(Number(stableId), moduleKey);
    if (!enabled) {
      return res.status(403).json({
        message: `The '${moduleKey}' module is not enabled for this stable.`,
        module: moduleKey,
        enabled: false,
      });
    }
    return next();
  } catch (error) {
    return res.status(500).json({ message: 'Failed to check module status.' });
  }
};
