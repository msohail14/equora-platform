import jwt from 'jsonwebtoken';
import { verifyFirebaseIdToken } from '../config/firebase.js';
import { Admin, Stable, User } from '../models/index.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const OTP_BYPASS_ENABLED = () => {
  const enabled = process.env.FIREBASE_OTP_BYPASS === 'true';
  if (enabled && process.env.NODE_ENV === 'production') {
    console.error(
      '⚠️  SECURITY WARNING: FIREBASE_OTP_BYPASS=true in production! ' +
      'This allows anyone to authenticate with code 123456. ' +
      'Set FIREBASE_OTP_BYPASS=false immediately.'
    );
  }
  return enabled;
};
const BYPASS_OTP_CODE = process.env.OTP_BYPASS_CODE || '123456';

const issueJwt = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

/**
 * Verify a Firebase ID token and find or create the corresponding local user.
 * Returns our own JWT for subsequent API calls.
 */
export const verifyAndLoginFirebase = async ({ idToken, role, phone, email, displayName, mode = 'login' }) => {
  let firebaseUid;
  let firebasePhone;
  let firebaseEmail;

  if (OTP_BYPASS_ENABLED() && idToken === 'bypass_token') {
    // Dev/test bypass mode — no actual Firebase verification
    firebaseUid = `bypass_${phone || email}`;
    firebasePhone = phone || null;
    firebaseEmail = email || null;
  } else {
    const decoded = await verifyFirebaseIdToken(idToken);
    firebaseUid = decoded.uid;
    firebasePhone = decoded.phone_number || phone || null;
    firebaseEmail = decoded.email || email || null;
  }

  if (!role) {
    throw new Error('Role is required (rider, coach, or stable_owner).');
  }

  // Stable owner → Admin model
  if (role === 'stable_owner') {
    return findOrCreateAdmin({ firebaseUid, phone: firebasePhone, email: firebaseEmail, displayName, mode });
  }

  // Rider or Coach → User model
  return findOrCreateUser({ firebaseUid, phone: firebasePhone, email: firebaseEmail, role, displayName, mode });
};

const findOrCreateUser = async ({ firebaseUid, phone, email, role, displayName, mode = 'login' }) => {
  // Try to find by firebase_uid first
  let user = await User.findOne({ where: { firebase_uid: firebaseUid } });

  if (!user && email) {
    // Check if a user with this email already exists (link Firebase to existing account)
    user = await User.findOne({ where: { email } });
    if (user) {
      if (user.firebase_uid && user.firebase_uid !== firebaseUid) {
        throw new Error('This email is already linked to a different account.');
      }
      user.firebase_uid = firebaseUid;
      user.auth_method = phone ? 'firebase_phone' : 'firebase_email';
      if (phone && !user.mobile_number) user.mobile_number = phone;
      await user.save();
    }
  }

  if (!user && phone) {
    // Check if a user with this phone already exists
    user = await User.findOne({ where: { mobile_number: phone } });
    if (user) {
      if (user.firebase_uid && user.firebase_uid !== firebaseUid) {
        throw new Error('This phone number is already linked to a different account.');
      }
      user.firebase_uid = firebaseUid;
      user.auth_method = 'firebase_phone';
      await user.save();
    }
  }

  if (!user) {
    // Login mode: reject unknown users
    if (mode === 'login') {
      throw new Error('This phone number is not registered. Please sign up first.');
    }

    // Signup mode: create new user
    const names = (displayName || '').split(' ');
    user = await User.create({
      email: email || null,
      mobile_number: phone || null,
      password_hash: null,
      firebase_uid: firebaseUid,
      auth_method: phone ? 'firebase_phone' : 'firebase_email',
      role,
      first_name: names[0] || null,
      last_name: names.slice(1).join(' ') || null,
      is_email_verified: !!email,
      is_active: true,
    });
  }

  const token = issueJwt({ id: user.id, email: user.email, role: user.role });
  const safeUser = user.toJSON();
  delete safeUser.password_hash;
  delete safeUser.firebase_uid;

  return {
    message: user.wasNewRecord !== false ? 'Account created.' : 'Login successful.',
    user: safeUser,
    token,
    isNewUser: !user.created_at || (Date.now() - new Date(user.created_at).getTime()) < 5000,
  };
};

const findOrCreateAdmin = async ({ firebaseUid, phone, email, displayName, mode = 'login' }) => {
  let admin = await Admin.findOne({ where: { firebase_uid: firebaseUid } });

  if (!admin && email) {
    admin = await Admin.findOne({ where: { email } });
    if (admin) {
      admin.firebase_uid = firebaseUid;
      admin.auth_method = phone ? 'firebase_phone' : 'firebase_email';
      if (phone && !admin.mobile_number) admin.mobile_number = phone;
      await admin.save();
    }
  }

  if (!admin && phone) {
    admin = await Admin.findOne({ where: { mobile_number: phone } });
    if (admin) {
      admin.firebase_uid = firebaseUid;
      admin.auth_method = 'firebase_phone';
      await admin.save();
    }
  }

  if (!admin) {
    if (mode === 'login') {
      throw new Error('This account is not registered. Please sign up first.');
    }
    const names = (displayName || '').split(' ');
    admin = await Admin.create({
      email: email || `${firebaseUid}@firebase.local`,
      password_hash: null,
      firebase_uid: firebaseUid,
      auth_method: phone ? 'firebase_phone' : 'firebase_email',
      mobile_number: phone || null,
      is_email_verified: !!email,
      role: 'stable_owner',
      first_name: names[0] || null,
      last_name: names.slice(1).join(' ') || null,
    });
  }

  const token = jwt.sign(
    { id: admin.id, email: admin.email, role: admin.role, type: 'admin' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const safeAdmin = admin.toJSON();
  delete safeAdmin.password_hash;
  delete safeAdmin.firebase_uid;

  // Attach stable_id if exists
  const stable = await Stable.findOne({ where: { admin_id: admin.id }, attributes: ['id'] });
  if (stable) safeAdmin.stable_id = stable.id;

  return {
    message: 'Login successful.',
    user: safeAdmin,
    token,
    isNewUser: !admin.created_at || (Date.now() - new Date(admin.created_at).getTime()) < 5000,
  };
};

/**
 * Link a Firebase UID to an existing authenticated user account.
 */
export const linkFirebaseToAccount = async ({ userId, isAdmin, firebaseIdToken }) => {
  const decoded = await verifyFirebaseIdToken(firebaseIdToken);
  const firebaseUid = decoded.uid;
  const authMethod = decoded.phone_number ? 'firebase_phone' : 'firebase_email';

  if (isAdmin) {
    const admin = await Admin.findByPk(userId);
    if (!admin) throw new Error('Admin not found.');
    admin.firebase_uid = firebaseUid;
    admin.auth_method = authMethod;
    if (decoded.phone_number) admin.mobile_number = decoded.phone_number;
    await admin.save();
    return { message: 'Firebase account linked.' };
  }

  const user = await User.findByPk(userId);
  if (!user) throw new Error('User not found.');
  user.firebase_uid = firebaseUid;
  user.auth_method = authMethod;
  if (decoded.phone_number && !user.mobile_number) user.mobile_number = decoded.phone_number;
  await user.save();
  return { message: 'Firebase account linked.' };
};

/**
 * Dev/test bypass: verify a hardcoded OTP without Firebase.
 * Only works when FIREBASE_OTP_BYPASS=true.
 */
export const verifyBypassOtp = async ({ phone, otp, role, mode = 'login' }) => {
  if (!OTP_BYPASS_ENABLED()) {
    throw new Error('OTP bypass is not enabled.');
  }
  if (otp !== BYPASS_OTP_CODE) {
    throw new Error('Invalid OTP code.');
  }

  // Use the bypass flow through verifyAndLoginFirebase
  return verifyAndLoginFirebase({
    idToken: 'bypass_token',
    role,
    phone,
    mode,
  });
};
