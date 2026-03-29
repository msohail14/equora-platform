import { onboardStable, stableSetupWizard, onboardCoach, getSetupStatus } from '../services/onboarding.service.js';
import { setUserCredentials } from '../services/user.service.js';

export const onboardStableController = async (req, res) => {
  try {
    const adminId = req.user?.id;
    const { stableName, locationAddress, city, country, contactPhone, contactEmail, description, latitude, longitude } = req.body;
    const result = await onboardStable({
      adminId, stableName, locationAddress, city, country, contactPhone, contactEmail, description, latitude, longitude,
    });
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const stableSetupWizardController = async (req, res) => {
  try {
    const adminId = req.user?.id;
    const { stableId, coaches, horses, availability } = req.body;
    if (!stableId) {
      return res.status(400).json({ error: 'stableId is required.' });
    }
    const result = await stableSetupWizard({ adminId, stableId, coaches, horses, availability });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const onboardCoachController = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { bio, defaultDuration, approvalMode, coachType, specialties } = req.body;
    const result = await onboardCoach({ userId, bio, defaultDuration, approvalMode, coachType, specialties });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const getSetupStatusController = async (req, res) => {
  try {
    const adminId = req.user?.id;
    const result = await getSetupStatus(adminId);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const setCredentialsController = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { email, password } = req.body;
    const result = await setUserCredentials(userId, { email, password });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
