import { verifyAndLoginFirebase, linkFirebaseToAccount, verifyBypassOtp } from '../services/firebase-auth.service.js';

export const firebaseVerifyController = async (req, res) => {
  try {
    const { idToken, role, phone, email, displayName, mode } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'idToken is required.' });
    }
    const result = await verifyAndLoginFirebase({ idToken, role, phone, email, displayName, mode });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const firebaseLinkController = async (req, res) => {
  try {
    const { firebaseIdToken } = req.body;
    if (!firebaseIdToken) {
      return res.status(400).json({ error: 'firebaseIdToken is required.' });
    }
    const isAdmin = req.user?.type === 'admin';
    const userId = req.user?.id;
    const result = await linkFirebaseToAccount({ userId, isAdmin, firebaseIdToken });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const bypassOtpController = async (req, res) => {
  try {
    const { phone, otp, role, mode } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: 'phone and otp are required.' });
    }
    const result = await verifyBypassOtp({ phone, otp, role, mode });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
