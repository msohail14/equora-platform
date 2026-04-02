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
  if (invitation.inviter_id !== adminId) throw new Error('You can only cancel your own invitations.');
  if (invitation.status !== 'pending') throw new Error('Only pending invitations can be cancelled.');

  invitation.status = 'expired';
  await invitation.save();

  return { message: 'Invitation cancelled.' };
};

// ── Coach → Rider Invitations ──────────────────────────────────────────────

/**
 * Generate a short, unique invite code (e.g. "EQ-7X3K")
 */
const generateInviteCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 to avoid confusion
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `EQ-${code}`;
};

/**
 * Coach creates a rider invite (with optional email/phone, generates invite code).
 */
export const createRiderInvitation = async ({ coachId, email, phone }) => {
  const coach = await User.findByPk(coachId);
  if (!coach) throw new Error('Coach not found.');

  // Generate unique invite code (retry up to 5 times for collisions)
  let inviteCode;
  for (let attempt = 0; attempt < 5; attempt++) {
    inviteCode = generateInviteCode();
    const exists = await Invitation.findOne({ where: { invite_code: inviteCode } });
    if (!exists) break;
    if (attempt === 4) throw new Error('Failed to generate unique invite code. Please try again.');
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days for rider invites

  const invitation = await Invitation.create({
    inviter_id: coachId,
    coach_id: coachId,
    stable_id: null,
    email: email || null,
    phone: phone || null,
    role: 'rider',
    status: 'pending',
    token,
    invite_code: inviteCode,
    expires_at: expiresAt,
  });

  // Send email if provided
  if (email) {
    try {
      const coachName = `${coach.first_name || ''} ${coach.last_name || ''}`.trim() || 'A coach';
      await sendMail({
        to: email,
        subject: `${coachName} invites you to Equora`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #059669;">Equora</h2>
            <p><strong>${coachName}</strong> invites you to join Equora for equestrian training.</p>
            <p>Use this invite code when signing up:</p>
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: 700; letter-spacing: 2px; color: #059669;">
              ${inviteCode}
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 16px;">This code expires in 30 days.</p>
          </div>
        `,
      });
    } catch (e) {
      console.warn('[invitation] Failed to send rider invite email:', e.message);
    }
  }

  return {
    message: `Invite created${email ? ` and sent to ${email}` : ''}.`,
    invitation: {
      id: invitation.id,
      invite_code: inviteCode,
      status: invitation.status,
    },
  };
};

/**
 * Get all rider invitations sent by a coach.
 */
export const getCoachRiderInvitations = async (coachId) => {
  const invitations = await Invitation.findAll({
    where: { coach_id: coachId, role: 'rider' },
    order: [['created_at', 'DESC']],
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
 * Verify an invite code during rider signup.
 */
export const verifyInviteCode = async (inviteCode) => {
  const invitation = await Invitation.findOne({
    where: { invite_code: inviteCode.toUpperCase(), status: 'pending', role: 'rider' },
  });

  if (!invitation) {
    throw new Error('Invalid or expired invite code.');
  }

  if (new Date() > new Date(invitation.expires_at)) {
    invitation.status = 'expired';
    await invitation.save();
    throw new Error('This invite code has expired.');
  }

  const coach = await User.findByPk(invitation.coach_id, {
    attributes: ['id', 'first_name', 'last_name', 'profile_picture_url'],
  });

  return {
    valid: true,
    coach_id: invitation.coach_id,
    coach_name: coach ? `${coach.first_name || ''} ${coach.last_name || ''}`.trim() : null,
    invitation_id: invitation.id,
  };
};

/**
 * Accept a rider invitation (called after successful signup/login).
 */
export const acceptRiderInvitation = async ({ inviteCode, riderId }) => {
  const invitation = await Invitation.findOne({
    where: { invite_code: inviteCode.toUpperCase(), status: 'pending', role: 'rider' },
  });

  if (!invitation) throw new Error('Invalid or expired invite code.');

  if (new Date() > new Date(invitation.expires_at)) {
    invitation.status = 'expired';
    await invitation.save();
    throw new Error('This invite code has expired.');
  }

  invitation.status = 'accepted';
  invitation.rider_id = riderId;
  await invitation.save();

  return {
    message: 'Invitation accepted. You are now linked to the coach.',
    coach_id: invitation.coach_id,
  };
};
