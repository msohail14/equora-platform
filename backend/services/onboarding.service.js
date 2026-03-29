import { Admin, CoachStable, Horse, Stable, User } from '../models/index.js';
import { createInvitation } from './invitation.service.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Stable onboarding — create Admin + Stable in one step.
 * Called after Firebase/magic link authentication.
 */
export const onboardStable = async ({ adminId, stableName, locationAddress, city, country, contactPhone, contactEmail, description, latitude, longitude }) => {
  if (!stableName) throw new Error('Stable name is required.');

  const admin = await Admin.findByPk(adminId);
  if (!admin) throw new Error('Admin not found.');

  // Check if admin already has a stable
  const existingStable = await Stable.findOne({ where: { admin_id: adminId } });
  if (existingStable) {
    return {
      message: 'Stable already exists.',
      stable: existingStable,
    };
  }

  const stable = await Stable.create({
    name: stableName,
    location_address: locationAddress || null,
    city: city || null,
    country: country || null,
    contact_phone: contactPhone || admin.mobile_number || null,
    contact_email: contactEmail || admin.email || null,
    description: description || null,
    latitude: latitude || null,
    longitude: longitude || null,
    admin_id: adminId,
    is_approved: true,
    is_active: true,
  });

  return {
    message: 'Stable created successfully.',
    stable,
  };
};

/**
 * Stable setup wizard — bulk add coaches (invitations), horses, and availability.
 */
export const stableSetupWizard = async ({ adminId, stableId, coaches, horses, availability }) => {
  const stable = await Stable.findOne({ where: { id: stableId, admin_id: adminId } });
  if (!stable) throw new Error('Stable not found or unauthorized.');

  const results = { coachInvitations: [], horsesAdded: [], availabilitySet: false };

  // Invite coaches
  if (coaches && Array.isArray(coaches)) {
    for (const coach of coaches) {
      try {
        const inv = await createInvitation({
          stableId,
          adminId,
          email: coach.email || null,
          phone: coach.phone || null,
        });
        results.coachInvitations.push(inv);
      } catch (e) {
        results.coachInvitations.push({ error: e.message, contact: coach.email || coach.phone });
      }
    }
  }

  // Add horses
  if (horses && Array.isArray(horses)) {
    for (const horse of horses) {
      if (!horse.name) continue;
      const created = await Horse.create({
        name: horse.name,
        breed: horse.breed || null,
        description: horse.description || null,
        stable_id: stableId,
        age: horse.age || null,
        training_level: horse.training_level || null,
        status: 'available',
      });
      results.horsesAdded.push({ id: created.id, name: created.name });
    }
  }

  // Set availability (operating hours)
  if (availability) {
    stable.operating_hours = availability;
    await stable.save();
    results.availabilitySet = true;
  }

  return {
    message: 'Setup wizard completed.',
    results,
  };
};

/**
 * Coach onboarding — update coach profile after account creation.
 */
export const onboardCoach = async ({ userId, bio, defaultDuration, approvalMode, coachType, specialties }) => {
  const user = await User.findByPk(userId);
  if (!user) throw new Error('User not found.');
  if (user.role !== 'coach') {
    user.role = 'coach';
  }

  if (bio !== undefined) user.bio = bio;
  if (defaultDuration !== undefined) user.default_duration = defaultDuration;
  if (approvalMode !== undefined) user.approval_mode = approvalMode;
  if (coachType !== undefined) user.coach_type = coachType;
  if (specialties !== undefined) user.specialties = specialties;

  await user.save();

  const safeUser = user.toJSON();
  delete safeUser.password_hash;
  delete safeUser.firebase_uid;

  return {
    message: 'Coach profile updated.',
    user: safeUser,
  };
};

/**
 * Get setup completion status for a stable (checklist).
 */
export const getSetupStatus = async (adminId) => {
  const stable = await Stable.findOne({ where: { admin_id: adminId } });
  if (!stable) return { hasStable: false, completion: 0, checklist: [] };

  const horseCount = await Horse.count({ where: { stable_id: stable.id } });
  const coachCount = await CoachStable.count({ where: { stable_id: stable.id } });
  const hasAvailability = !!stable.operating_hours;
  const hasDescription = !!stable.description;

  const checklist = [
    { key: 'stable_created', label: 'Create your stable', done: true },
    { key: 'add_horses', label: 'Add your horses', done: horseCount > 0 },
    { key: 'invite_coaches', label: 'Invite coaches', done: coachCount > 0 },
    { key: 'set_availability', label: 'Set availability', done: hasAvailability },
    { key: 'add_description', label: 'Add stable description', done: hasDescription },
  ];

  const completion = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100);

  return {
    hasStable: true,
    stableId: stable.id,
    completion,
    checklist,
  };
};
