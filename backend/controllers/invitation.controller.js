import { createInvitation, acceptInvitation, getStableInvitations, cancelInvitation } from '../services/invitation.service.js';

export const createInvitationController = async (req, res) => {
  try {
    const { stableId, email, phone } = req.body;
    const adminId = req.user?.id;
    if (!stableId) {
      return res.status(400).json({ error: 'stableId is required.' });
    }
    const result = await createInvitation({ stableId, adminId, email, phone });
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const acceptInvitationController = async (req, res) => {
  try {
    const { token } = req.params;
    const { userId, firebaseUid } = req.body;
    const result = await acceptInvitation({ token, userId, firebaseUid });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const getStableInvitationsController = async (req, res) => {
  try {
    const { stableId } = req.params;
    const invitations = await getStableInvitations(stableId);
    return res.status(200).json({ data: invitations });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const cancelInvitationController = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;
    const result = await cancelInvitation(id, adminId);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
