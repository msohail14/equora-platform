import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Admin, MagicLinkToken, Stable, User } from '../models/index.js';
import { sendMail } from './mail.service.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const MAGIC_LINK_EXPIRES_MINUTES = Number(process.env.MAGIC_LINK_EXPIRES_MINUTES || 15);

/**
 * Send a magic link email for login or signup.
 */
export const sendMagicLink = async ({ email, purpose, role }) => {
  if (!email) throw new Error('Email is required.');
  if (!['login', 'signup'].includes(purpose)) throw new Error('Invalid purpose.');

  // Check if user/admin already exists
  let userId = null;
  let adminId = null;

  if (role === 'stable_owner') {
    const admin = await Admin.findOne({ where: { email } });
    if (admin) {
      adminId = admin.id;
      if (purpose === 'signup') purpose = 'login'; // Already has account
    }
  } else {
    const user = await User.findOne({ where: { email } });
    if (user) {
      userId = user.id;
      if (purpose === 'signup') purpose = 'login';
    }
  }

  // Invalidate any existing unused tokens for this email
  await MagicLinkToken.update(
    { is_used: true },
    { where: { email, is_used: false } }
  );

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRES_MINUTES * 60 * 1000);

  await MagicLinkToken.create({
    email,
    token,
    purpose,
    role: role || null,
    user_id: userId,
    admin_id: adminId,
    expires_at: expiresAt,
  });

  const frontendUrl = process.env.FRONTEND_URL_PROD || process.env.FRONTEND_URL || 'http://localhost:5173';
  const magicLinkUrl = `${frontendUrl}/auth/magic-link/${token}`;

  await sendMail({
    to: email,
    subject: purpose === 'login' ? 'Sign in to Equora' : 'Complete your Equora registration',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #059669;">Equora</h2>
        <p>${purpose === 'login' ? 'Click the button below to sign in:' : 'Click the button below to complete your registration:'}</p>
        <a href="${magicLinkUrl}" style="display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
          ${purpose === 'login' ? 'Sign In' : 'Complete Registration'}
        </a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 16px;">This link expires in ${MAGIC_LINK_EXPIRES_MINUTES} minutes.</p>
        <p style="color: #6b7280; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  return { message: `Magic link sent to ${email}. Check your inbox.` };
};

/**
 * Verify a magic link token and return a JWT.
 */
export const verifyMagicLinkToken = async (token) => {
  const record = await MagicLinkToken.findOne({ where: { token, is_used: false } });

  if (!record) {
    throw new Error('Invalid or expired magic link.');
  }

  if (new Date() > new Date(record.expires_at)) {
    record.is_used = true;
    await record.save();
    throw new Error('Magic link has expired. Please request a new one.');
  }

  // Mark as used
  record.is_used = true;
  await record.save();

  const { email, purpose, role, user_id, admin_id } = record;

  // Stable owner flow → Admin model
  if (role === 'stable_owner') {
    let admin;
    if (admin_id) {
      admin = await Admin.findByPk(admin_id);
    } else {
      admin = await Admin.findOne({ where: { email } });
    }

    if (!admin && purpose === 'signup') {
      admin = await Admin.create({
        email,
        password_hash: null,
        auth_method: 'magic_link',
        role: 'stable_owner',
        is_email_verified: true,
      });
    }

    if (!admin) throw new Error('Account not found.');

    if (admin.auth_method === 'email_password') {
      admin.auth_method = 'magic_link';
    }
    admin.is_email_verified = true;
    await admin.save();

    const jwtToken = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role, type: 'admin' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const safeAdmin = admin.toJSON();
    delete safeAdmin.password_hash;
    const stable = await Stable.findOne({ where: { admin_id: admin.id }, attributes: ['id'] });
    if (stable) safeAdmin.stable_id = stable.id;

    return { message: 'Login successful.', user: safeAdmin, token: jwtToken };
  }

  // Rider/Coach flow → User model
  let user;
  if (user_id) {
    user = await User.findByPk(user_id);
  } else {
    user = await User.findOne({ where: { email } });
  }

  if (!user && purpose === 'signup') {
    user = await User.create({
      email,
      password_hash: null,
      auth_method: 'magic_link',
      role: role || 'rider',
      is_email_verified: true,
      is_active: true,
    });
  }

  if (!user) throw new Error('Account not found.');

  user.is_email_verified = true;
  await user.save();

  const jwtToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const safeUser = user.toJSON();
  delete safeUser.password_hash;

  return { message: 'Login successful.', user: safeUser, token: jwtToken };
};
