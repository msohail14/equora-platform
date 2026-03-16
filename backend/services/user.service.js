import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import User from '../models/user.model.js';
import { deleteFileIfExists, toAbsolutePathFromPublic } from '../utils/file.util.js';
import { sendOtpEmail, sendResetPasswordLinkEmail, sendResetTokenEmail } from './mail.service.js';

const publicUserFields = [
  'id',
  'email',
  'mobile_number',
  'role',
  'first_name',
  'last_name',
  'city',
  'state',
  'country',
  'pincode',
  'date_of_birth',
  'gender',
  'fei_number',
  'riding_level',
  'specialties',
  'bio',
  'profile_picture_url',
  'is_email_verified',
  'is_active',
  'created_at',
];

const allowedGenders = ['male', 'female', 'other', 'prefer_not_to_say'];
const normalizeGender = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const normalized = String(value).trim().toLowerCase();
  if (!allowedGenders.includes(normalized)) {
    throw new Error(`gender must be one of: ${allowedGenders.join(', ')}.`);
  }
  return normalized;
};

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const getOtpExpiryDate = () => {
  const expiryMinutes = Number(process.env.EMAIL_OTP_EXPIRES_MINUTES || 10);
  return new Date(Date.now() + expiryMinutes * 60 * 1000);
};

const getJwtToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const normalizeRidingLevel = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const normalized = String(value).trim().toLowerCase();
  if (!['beginner', 'intermediate', 'advanced'].includes(normalized)) {
    return null;
  }
  return normalized;
};

export const signupUser = async ({
  email,
  password,
  role,
  first_name,
  last_name,
  mobile_number,
  profile_picture_url,
  city,
  state,
  country,
  pincode,
  date_of_birth,
  gender,
  fei_number,
  riding_level,
  specialties,
  bio,
}) => {
  if (!email || !password || !role) {
    throw new Error('Email, password, and role are required.');
  }

  if (!['rider', 'coach'].includes(role)) {
    throw new Error("Role must be either 'rider' or 'coach'.");
  }

  const existingUser = await User.findOne({ where: { email } });
  const hashedPassword = await bcrypt.hash(password, 10);
  const normalizedGender = normalizeGender(gender);
  const normalizedRidingLevel = normalizeRidingLevel(riding_level);
  const verificationOtp = generateOtp();
  const verificationExpiry = getOtpExpiryDate();
  const expiryMinutes = Number(process.env.EMAIL_OTP_EXPIRES_MINUTES || 10);

  if (existingUser && existingUser.is_email_verified) {
    throw new Error('Email already exists.');
  }

  if (existingUser && !existingUser.is_email_verified) {
    const previousProfilePictureUrl = existingUser.profile_picture_url;

    existingUser.password_hash = hashedPassword;
    existingUser.role = role;
    existingUser.first_name = first_name || null;
    existingUser.last_name = last_name || null;
    existingUser.mobile_number = mobile_number || null;
    existingUser.city = city || null;
    existingUser.state = state || null;
    existingUser.country = country || null;
    existingUser.pincode = pincode || null;
    existingUser.date_of_birth = date_of_birth || null;
    existingUser.gender = normalizedGender;
    existingUser.fei_number = fei_number ?? existingUser.fei_number;
    existingUser.riding_level = normalizedRidingLevel ?? existingUser.riding_level;
    existingUser.specialties = specialties ?? existingUser.specialties;
    existingUser.bio = bio ?? existingUser.bio;
    existingUser.profile_picture_url = profile_picture_url ?? existingUser.profile_picture_url;
    existingUser.is_email_verified = true;
    existingUser.email_verification_otp = null;
    existingUser.email_verification_expires = null;
    await existingUser.save();

    if (profile_picture_url && previousProfilePictureUrl && previousProfilePictureUrl !== profile_picture_url) {
      try {
        await deleteFileIfExists(toAbsolutePathFromPublic(previousProfilePictureUrl));
      } catch (_error) {
        // Do not fail signup if old file cleanup fails.
      }
    }

    const token = getJwtToken(existingUser);
    const safeExistingUser = await User.findByPk(existingUser.id, { attributes: publicUserFields });
    return {
      message: 'Signup successful.',
      user: safeExistingUser,
      token,
    };
  }

  const user = await User.create({
    email,
    password_hash: hashedPassword,
    role,
    first_name: first_name || null,
    last_name: last_name || null,
    mobile_number: mobile_number || null,
    city: city || null,
    state: state || null,
    country: country || null,
    pincode: pincode || null,
    date_of_birth: date_of_birth || null,
    gender: normalizedGender,
    fei_number: fei_number || null,
    riding_level: normalizedRidingLevel || null,
    specialties: specialties ?? null,
    bio: bio || null,
    profile_picture_url: profile_picture_url || null,
    is_email_verified: true,
  });

  const token = getJwtToken(user);
  const safeUser = await User.findByPk(user.id, { attributes: publicUserFields });
  return {
    message: 'Signup successful.',
    user: safeUser,
    token,
  };
};

export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error('Invalid email or password.');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password.');
  }

  if (!user.is_email_verified) {
    throw new Error('Email is not verified. Please verify using OTP.');
  }
  if (!user.is_active) {
    throw new Error('Account is deactivated. Please contact admin.');
  }

  const token = getJwtToken(user);
  const safeUser = await User.findByPk(user.id, { attributes: publicUserFields });

  return { user: safeUser, token };
};

export const verifyEmailOtp = async ({ email, otp }) => {
  if (!email || !otp) {
    throw new Error('Email and otp are required.');
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error('Invalid email or otp.');
  }

  if (user.is_email_verified) {
    const safeUser = await User.findByPk(user.id, { attributes: publicUserFields });
    const token = getJwtToken(user);
    return {
      message: 'Email is already verified.',
      user: safeUser,
      token,
    };
  }

  const now = new Date();
  if (
    user.email_verification_otp !== otp ||
    !user.email_verification_expires ||
    user.email_verification_expires <= now
  ) {
    throw new Error('Invalid or expired otp.');
  }

  user.is_email_verified = true;
  user.email_verification_otp = null;
  user.email_verification_expires = null;
  await user.save();

  const safeUser = await User.findByPk(user.id, { attributes: publicUserFields });
  const token = getJwtToken(user);

  return {
    message: 'Email verified successfully.',
    user: safeUser,
    token,
  };
};

export const resendEmailOtp = async ({ email }) => {
  if (!email) {
    throw new Error('Email is required.');
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return { message: 'If the email exists, an OTP has been sent.' };
  }

  if (user.is_email_verified) {
    return { message: 'Email is already verified.' };
  }

  const verificationOtp = generateOtp();
  const verificationExpiry = getOtpExpiryDate();
  const expiryMinutes = Number(process.env.EMAIL_OTP_EXPIRES_MINUTES || 10);

  user.email_verification_otp = verificationOtp;
  user.email_verification_expires = verificationExpiry;
  await user.save();

  await sendOtpEmail({
    to: user.email,
    otp: verificationOtp,
    name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User',
  });

  return {
    message: `OTP resent successfully (valid for ${expiryMinutes} minutes).`,
  };
};

export const forgotPassword = async ({ email }) => {
  if (!email) {
    throw new Error('Email is required.');
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return {
      message: 'If the email exists, a reset token has been generated.',
    };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiryMinutes = Number(process.env.RESET_TOKEN_EXPIRES_MINUTES || 15);
  const expiryDate = new Date(Date.now() + expiryMinutes * 60 * 1000);

  user.reset_password_token = resetToken;
  user.reset_password_expires = expiryDate;
  await user.save();

  const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${frontendBaseUrl.replace(/\/+$/, '')}/reset-password?token=${resetToken}`;


  await sendResetPasswordLinkEmail({
    to: user.email,
    resetLink,
    name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User',
    expiresMinutes: expiryMinutes,
  });

  return {
    message: 'Password reset instructions sent to email successfully.',
  };
};

export const resetPassword = async ({ token, new_password }) => {
  if (!token || !new_password) {
    throw new Error('Token and new_password are required.');
  }

  const user = await User.findOne({
    where: {
      reset_password_token: token,
      reset_password_expires: {
        [Op.gt]: new Date(),
      },
    },
  });

  if (!user) {
    throw new Error('Invalid or expired reset token.');
  }

  user.password_hash = await bcrypt.hash(new_password, 10);
  user.reset_password_token = null;
  user.reset_password_expires = null;
  await user.save();

  return { message: 'Password reset successfully.' };
};

export const changePassword = async ({ userId, current_password, new_password }) => {
  if (!current_password || !new_password) {
    throw new Error('current_password and new_password are required.');
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found.');
  }

  const isPasswordValid = await bcrypt.compare(current_password, user.password_hash);
  if (!isPasswordValid) {
    throw new Error('Current password is incorrect.');
  }

  user.password_hash = await bcrypt.hash(new_password, 10);
  await user.save();

  return { message: 'Password changed successfully.' };
};

export const changeProfile = async ({
  userId,
  first_name,
  last_name,
  mobile_number,
  city,
  state,
  country,
  pincode,
  date_of_birth,
  gender,
  profile_picture_url,
}) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found.');
  }

  const previousProfilePictureUrl = user.profile_picture_url;

  user.first_name = first_name ?? user.first_name;
  user.last_name = last_name ?? user.last_name;
  user.mobile_number = mobile_number ?? user.mobile_number;
  user.city = city ?? user.city;
  user.state = state ?? user.state;
  user.country = country ?? user.country;
  user.pincode = pincode ?? user.pincode;
  user.date_of_birth = date_of_birth ?? user.date_of_birth;
  if (gender !== undefined) {
    user.gender = normalizeGender(gender);
  }
  user.profile_picture_url = profile_picture_url ?? user.profile_picture_url;
  await user.save();

  if (profile_picture_url && previousProfilePictureUrl && previousProfilePictureUrl !== profile_picture_url) {
    const previousAbsolutePath = toAbsolutePathFromPublic(previousProfilePictureUrl);
    try {
      await deleteFileIfExists(previousAbsolutePath);
    } catch (_error) {
      // Do not fail profile update if old file cleanup fails.
    }
  }

  const safeUser = await User.findByPk(user.id, { attributes: publicUserFields });
  return { message: 'Profile updated successfully.', user: safeUser };
};

export const getMyProfile = async (userId) => {
  const user = await User.findByPk(userId, { attributes: publicUserFields });
  if (!user) {
    throw new Error('User not found.');
  }
  return user;
};
