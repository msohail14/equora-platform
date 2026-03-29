import crypto from 'crypto';
import { Op } from 'sequelize';
import { Admin, CoachStable, Invitation, Stable, User } from '../models/index.js';
import { sendMail } from './mail.service.js';

const INVITATION_EXPIRES_DAYS = Number(process.env.INVITATION_EXPIRES_DAYS || 7);

/**
 * Create an invitation for a coach to join a stable.
 */
export const createInvitation = async ({ stableId, adminId, email, phone }) => {
  if (!email && !phone) {
    throw new Error('Either email or phone is required.');
  }

  if (phone && !/^\+?[1-9]\d{6,14}$/.test(phone.replace(/[\s-]/g, ''))) {
    throw new Error('Invalid phone number format.');
  }

  const stable = await Stable.findByPk(stableId);
  if (!stable) throw new Error('Stable not found.');

  const admin = await Admin.findByPk(adminId);
  if (!admin) throw new Error('Admin not found.');

  // Check for existing pending invitation
  const existing = await Invitation.findOne({
    where: {
      stable_id: stableId,
      status: 'pending',
      ...(email ? { email } : { phone }),
    },
  });
  if (existing) {
    throw new Error('An invitation is already pending for this contact.');
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + INVITATION_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

  const invitation = await Invitation.create({
    inviter_id: adminId,
    stable_id: stableId,
    email: email || null,
    phone: phone || null,
    role: 'coach',
    status: 'pending',
    token,
    expires_at: expiresAt,
  });

  // Send invitation email
  if (email) {
    const frontendUrl = process.env.FRONTEND_URL_PROD || process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteUrl = `${frontendUrl}/invitation/${token}`;

    await sendMail({
      to: email,
      subject: `You're invited to join ${stable.name} on Equora`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #059669;">Equora</h2>
          <p><strong>${admin.first_name || 'A stable manager'}</strong> has invited you to join <strong>${stable.name}</strong> as a coach.</p>
          <a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Accept Invitation
          </a>
          <p style="color: #6b7280; font-size: 14px; margin-top: 16px;">This invitation expires in ${INVITATION_EXPIRES_DAYS} days.</p>
        </div>
      `,
    });
  }

  return {
    message: `Invitation sent${email ? ` to ${email}` : ''}.`,
    invitation: { id: invitation.id, status: invitation.status, token: invitation.token },
  };
};

/**
 * Accept an invitation — creates or links coach account to stable.
 */
export const acceptInvitation = async ({ token, userId, firebaseUid }) => {
  const invitation = await Invitation.findOne({
    where: { token, status: 'pending' },
    include: [{ model: Stable, as: 'stable', attributes: ['id', 'name'] }],
  });

  if (!invitation) {
    throw new Error('Invalid or expired invitation.');
  }

  if (new Date() > new Date(invitation.expires_at)) {
    invitation.status = 'expired';
    await invitation.save();
    throw new Error('This invitation has expired.');
  }

  let user;

  if (userId) {
    // Existing authenticated user
    user = await User.findByPk(userId);
    if (!user) throw new Error('User not found.');
    if (user.role !== 'coach') {
      user.role = 'coach';
      await user.save();
    }
  } else if (invitation.email) {
    // Find by email
    user = await User.findOne({ where: { email: invitation.email } });
  } else if (invitation.phone) {
    // Find by phone
    user = await User.findOne({ where: { mobile_number: invitation.phone } });
  }

  // If no user found, we need them to create an account first
  // Return the invitation details so the frontend can redirect to signup
  if (!user) {
    return {
      message: 'Please create an account to accept this invitation.',
      requiresSignup: true,
      invitation: {
        id: invitation.id,
        stable_name: invitation.stable?.name,
        stable_id: invitation.stable_id,
        email: invitation.email,
        phone: invitation.phone,
      },
    };
  }

  // Create coach-stable link
  const [coachStable, created] = await CoachStable.findOrCreate({
    where: { coach_id: user.id, stable_id: invitation.stable_id },
    defaults: {
      coach_id: user.id,
      stable_id: invitation.stable_id,
      is_primary: false,
      is_active: true,
      status: 'pending',
    },
  });

  // Mark invitation as accepted
  invitation.status = 'accepted';
  await invitation.save();

  return {
    message: `You've been linked to ${invitation.stable?.name || 'the stable'}. Awaiting stable approval.`,
    coachStable: { id: coachStable.id, status: coachStable.status },
  };
};

/**
 * Get all invitations for a stable.
 */
export const getStableInvitations = async (stableId) => {
  const invitations = await Invitation.findAll({
    where: { stable_id: stableId },
    order: [['created_at', 'DESC']],
    include: [
      { model: Admin, as: 'inviter', attributes: ['id', 'first_name', 'last_name'] },
    ],
  });

  // Auto-expire old invitations
  const now = new Date();
  for (const inv of invitations) {
    if (inv.status === 'pending' && new Date(inv.expires_at) < now) {
      inv.status = 'expired';
      await inv.save();
    }
  }

  return invitations;
};

/**
 * Cancel a pending invitation.
 */
export const cancelInvitation = async (invitationId, adminId) => {
  const invitation = await Invitation.findByPk(invitationId);
  if (!invitation) throw new Error('Invitation not found.');
  if (invitation.status !== 'pending') throw new Error('Only pending invitations can be cancelled.');

  invitation.status = 'expired';
  await invitation.save();

  return { message: 'Invitation cancelled.' };
};
