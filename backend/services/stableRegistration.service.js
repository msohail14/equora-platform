import bcrypt from 'bcryptjs';
import Admin from '../models/admin.model.js';
import Stable from '../models/stable.model.js';
import StableRegistration from '../models/stableRegistration.model.js';

export const submitStableRegistration = async ({
  business_name,
  owner_first_name,
  owner_last_name,
  preferred_email,
  phone,
  city,
  country,
  description,
}) => {
  if (!business_name || !owner_first_name || !owner_last_name || !preferred_email) {
    throw new Error('Business name, owner name, and preferred email are required.');
  }

  const existing = await StableRegistration.findOne({
    where: { preferred_email, status: 'pending' },
  });
  if (existing) {
    throw new Error('A registration request with this email is already pending.');
  }

  const existingAdmin = await Admin.findOne({ where: { email: preferred_email } });
  if (existingAdmin) {
    throw new Error('An account with this email already exists. Please use a different email or login.');
  }

  const registration = await StableRegistration.create({
    business_name,
    owner_first_name,
    owner_last_name,
    preferred_email,
    phone: phone || null,
    city: city || null,
    country: country || null,
    description: description || null,
  });

  return {
    message: 'Registration submitted successfully. You will be notified once your application is reviewed.',
    registration: {
      id: registration.id,
      business_name: registration.business_name,
      status: registration.status,
    },
  };
};

export const getStableRegistrations = async ({ status, page = 1, limit = 20 }) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (p - 1) * l;

  const where = {};
  if (status) where.status = status;

  const { count, rows } = await StableRegistration.findAndCountAll({
    where,
    include: [{ model: Admin, as: 'reviewer', attributes: ['id', 'email', 'first_name', 'last_name'] }],
    order: [['created_at', 'DESC']],
    limit: l,
    offset,
  });

  return {
    data: rows,
    pagination: {
      total_items: count,
      current_page: p,
      per_page: l,
      total_pages: Math.ceil(count / l),
    },
  };
};

export const approveStableRegistration = async ({ registrationId, password, adminId }) => {
  if (!password) {
    throw new Error('Password is required to create the stable owner account.');
  }

  const registration = await StableRegistration.findByPk(registrationId);
  if (!registration) {
    throw new Error('Registration not found.');
  }
  if (registration.status !== 'pending') {
    throw new Error('Only pending registrations can be approved.');
  }

  const existingAdmin = await Admin.findOne({ where: { email: registration.preferred_email } });
  if (existingAdmin) {
    throw new Error('An admin account with this email already exists.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newAdmin = await Admin.create({
    email: registration.preferred_email,
    password_hash: hashedPassword,
    first_name: registration.owner_first_name,
    last_name: registration.owner_last_name,
    role: 'stable_owner',
  });

  const stable = await Stable.create({
    name: registration.business_name,
    location_address: [registration.city, registration.country].filter(Boolean).join(', ') || 'TBD',
    city: registration.city || null,
    country: registration.country || null,
    contact_phone: registration.phone || null,
    contact_email: registration.preferred_email,
    description: registration.description || null,
    admin_id: newAdmin.id,
    is_approved: true,
    is_active: true,
  });

  registration.status = 'approved';
  registration.reviewed_by = adminId;
  registration.reviewed_at = new Date();
  await registration.save();

  return {
    message: 'Registration approved. Stable and owner account created.',
    admin: {
      id: newAdmin.id,
      email: newAdmin.email,
      first_name: newAdmin.first_name,
      last_name: newAdmin.last_name,
    },
    stable: { id: stable.id, name: stable.name },
  };
};

export const rejectStableRegistration = async ({ registrationId, admin_notes, adminId }) => {
  const registration = await StableRegistration.findByPk(registrationId);
  if (!registration) {
    throw new Error('Registration not found.');
  }
  if (registration.status !== 'pending') {
    throw new Error('Only pending registrations can be rejected.');
  }

  registration.status = 'rejected';
  registration.admin_notes = admin_notes || null;
  registration.reviewed_by = adminId;
  registration.reviewed_at = new Date();
  await registration.save();

  return { message: 'Registration rejected.', registration };
};
