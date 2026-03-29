import { sendMagicLink, verifyMagicLinkToken } from '../services/magic-link.service.js';

export const sendMagicLinkController = async (req, res) => {
  try {
    const { email, purpose, role } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    const result = await sendMagicLink({ email, purpose: purpose || 'login', role });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const verifyMagicLinkController = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ error: 'Token is required.' });
    }
    const result = await verifyMagicLinkToken(token);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
