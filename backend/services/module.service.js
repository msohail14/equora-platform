import StableModule from '../models/stableModule.model.js';
import PlatformSetting from '../models/platformSetting.model.js';

// All available modules and their default state
const ALL_MODULES = {
  horse_maintenance: { label: 'Horse Maintenance', defaultEnabled: false },
  stall_management: { label: 'Stall Management', defaultEnabled: false },
  task_checklists: { label: 'Task Checklists', defaultEnabled: false },
  equipment_inventory: { label: 'Equipment Inventory', defaultEnabled: false },
  incident_reporting: { label: 'Incident Reporting', defaultEnabled: false },
  advanced_analytics: { label: 'Advanced Analytics', defaultEnabled: false },
  payment_collection: { label: 'Payment Collection', defaultEnabled: false },
};

/**
 * Resolve whether a module is enabled for a given stable.
 * Priority: per-stable override > global default > hardcoded default (false)
 */
export const isModuleEnabled = async (stableId, moduleKey) => {
  // 1. Check per-stable override
  const override = await StableModule.findOne({
    where: { stable_id: stableId, module_key: moduleKey },
  });
  if (override) return override.enabled;

  // 2. Check global default from platform_settings
  const globalSetting = await PlatformSetting.findOne({
    where: { key: 'default_stable_modules' },
  });
  if (globalSetting?.value && typeof globalSetting.value === 'object') {
    const val = globalSetting.value[moduleKey];
    if (val !== undefined) return Boolean(val);
  }

  // 3. Hardcoded default
  return ALL_MODULES[moduleKey]?.defaultEnabled ?? false;
};

/**
 * Get all module states for a stable.
 */
export const getStableModules = async (stableId) => {
  const overrides = await StableModule.findAll({
    where: { stable_id: stableId },
  });
  const overrideMap = {};
  for (const o of overrides) {
    overrideMap[o.module_key] = {
      enabled: o.enabled,
      enabled_by: o.enabled_by,
      enabled_at: o.enabled_at,
      config: o.config,
    };
  }

  // Get global defaults
  const globalSetting = await PlatformSetting.findOne({
    where: { key: 'default_stable_modules' },
  });
  const globalDefaults = globalSetting?.value || {};

  // Merge: per-stable > global > hardcoded
  const result = {};
  for (const [key, meta] of Object.entries(ALL_MODULES)) {
    const override = overrideMap[key];
    result[key] = {
      key,
      label: meta.label,
      enabled: override ? override.enabled : (globalDefaults[key] ?? meta.defaultEnabled),
      overridden: Boolean(override),
      enabled_by: override?.enabled_by || null,
      enabled_at: override?.enabled_at || null,
      config: override?.config || null,
    };
  }
  return { data: result };
};

/**
 * Toggle a module for a specific stable (super admin only).
 */
export const setStableModule = async (stableId, moduleKey, enabled, adminId, config = null) => {
  if (!ALL_MODULES[moduleKey]) {
    throw new Error(`Invalid module key: '${moduleKey}'. Valid modules: ${Object.keys(ALL_MODULES).join(', ')}`);
  }

  const [record, created] = await StableModule.findOrCreate({
    where: { stable_id: stableId, module_key: moduleKey },
    defaults: {
      stable_id: stableId,
      module_key: moduleKey,
      enabled: Boolean(enabled),
      enabled_by: adminId,
      enabled_at: new Date(),
      config: config || null,
    },
  });

  if (!created) {
    record.enabled = Boolean(enabled);
    record.enabled_by = adminId;
    record.enabled_at = new Date();
    if (config !== undefined && config !== null) {
      record.config = config;
    }
    record.updated_at = new Date();
    await record.save();
  }

  return {
    message: `Module '${moduleKey}' ${enabled ? 'enabled' : 'disabled'} for stable ${stableId}.`,
    data: record,
  };
};

/**
 * Get global default module states.
 */
export const getGlobalModuleDefaults = async () => {
  const setting = await PlatformSetting.findOne({
    where: { key: 'default_stable_modules' },
  });

  const defaults = setting?.value || {};
  const result = {};
  for (const [key, meta] of Object.entries(ALL_MODULES)) {
    result[key] = {
      key,
      label: meta.label,
      enabled: defaults[key] ?? meta.defaultEnabled,
    };
  }
  return { data: result };
};

/**
 * Update global default module states (super admin only).
 */
export const setGlobalModuleDefaults = async (modules) => {
  const validModules = {};
  for (const [key, value] of Object.entries(modules)) {
    if (ALL_MODULES[key]) {
      validModules[key] = Boolean(value);
    }
  }

  const [setting, created] = await PlatformSetting.findOrCreate({
    where: { key: 'default_stable_modules' },
    defaults: { key: 'default_stable_modules', value: validModules },
  });

  if (!created) {
    // Merge with existing
    const existing = setting.value || {};
    setting.value = { ...existing, ...validModules };
    setting.updated_at = new Date();
    await setting.save();
  }

  return {
    message: 'Global module defaults updated.',
    data: setting.value,
  };
};

export { ALL_MODULES };
