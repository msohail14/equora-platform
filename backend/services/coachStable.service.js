import { Op } from 'sequelize';
import { CoachStable, Stable, User } from '../models/index.js';

export const getCoachStables = async ({ coachId }) => {
  const links = await CoachStable.findAll({
    where: {
      coach_id: coachId,
      [Op.or]: [
        { is_active: true },
        { status: 'pending' },
      ],
    },
    include: [{ model: Stable, as: 'stable', attributes: ['id', 'name', 'city', 'country', 'logo_url', 'rating'] }],
    order: [['is_primary', 'DESC'], ['joined_at', 'ASC']],
  });
  return { data: links.map(l => ({ ...l.get({ plain: true }), stable: l.stable })) };
};

export const linkCoachToStable = async ({ coachId, stableId, isPrimary = false, requestMessage = null }) => {
  const stable = await Stable.findByPk(stableId);
  if (!stable) throw new Error('Stable not found.');

  const [link, created] = await CoachStable.findOrCreate({
    where: { coach_id: coachId, stable_id: stableId },
    defaults: {
      coach_id: coachId,
      stable_id: stableId,
      is_primary: isPrimary,
      is_active: false,
      status: 'pending',
      request_message: requestMessage,
    },
  });

  if (!created) {
    if (link.status === 'rejected' || !link.is_active) {
      link.status = 'pending';
      link.is_active = false;
      link.request_message = requestMessage;
      link.reviewed_at = null;
      link.reviewed_by = null;
      await link.save();
    } else if (link.status === 'approved' && link.is_active) {
      throw new Error('Already linked to this stable.');
    } else if (link.status === 'pending') {
      throw new Error('Request already pending.');
    }
  }

  return link;
};

export const unlinkCoachFromStable = async ({ coachId, stableId }) => {
  const link = await CoachStable.findOne({ where: { coach_id: coachId, stable_id: stableId } });
  if (!link) throw new Error('Coach-stable link not found.');
  link.is_active = false;
  link.status = 'rejected';
  await link.save();
  return link;
};

export const getStableLinkedCoaches = async ({ stableId }) => {
  const links = await CoachStable.findAll({
    where: { stable_id: stableId, status: 'approved', is_active: true },
    include: [{ model: User, as: 'coach', attributes: ['id', 'first_name', 'last_name', 'email', 'profile_picture_url', 'specialties', 'coach_type', 'is_verified'] }],
    order: [['is_primary', 'DESC'], ['joined_at', 'ASC']],
  });
  return { data: links.map(l => ({ ...l.get({ plain: true }), coach: l.coach })) };
};

export const adminLinkCoachToStable = async ({ stableId, coachId, isPrimary = false }) => {
  const coach = await User.findByPk(coachId);
  if (!coach || coach.role !== 'coach') throw new Error('Coach not found.');
  const stable = await Stable.findByPk(stableId);
  if (!stable) throw new Error('Stable not found.');

  const [link, created] = await CoachStable.findOrCreate({
    where: { coach_id: coachId, stable_id: stableId },
    defaults: { coach_id: coachId, stable_id: stableId, is_primary: isPrimary, is_active: true, status: 'approved' },
  });

  if (!created && !link.is_active) {
    link.is_active = true;
    link.status = 'approved';
    await link.save();
  }

  return link;
};

export const adminUnlinkCoachFromStable = async ({ stableId, coachId }) => {
  const link = await CoachStable.findOne({ where: { coach_id: coachId, stable_id: stableId } });
  if (!link) throw new Error('Coach-stable link not found.');
  link.is_active = false;
  link.status = 'rejected';
  await link.save();
  return link;
};

export const approveCoachRequest = async ({ stableId, coachId, reviewedBy }) => {
  const link = await CoachStable.findOne({ where: { coach_id: coachId, stable_id: stableId } });
  if (!link) throw new Error('Coach-stable link not found.');
  if (link.status === 'approved') throw new Error('Already approved.');
  link.status = 'approved';
  link.is_active = true;
  link.reviewed_at = new Date();
  link.reviewed_by = reviewedBy;
  await link.save();
  return link;
};

export const rejectCoachRequest = async ({ stableId, coachId, reviewedBy }) => {
  const link = await CoachStable.findOne({ where: { coach_id: coachId, stable_id: stableId } });
  if (!link) throw new Error('Coach-stable link not found.');
  link.status = 'rejected';
  link.is_active = false;
  link.reviewed_at = new Date();
  link.reviewed_by = reviewedBy;
  await link.save();
  return link;
};

export const getPendingCoachRequests = async ({ stableId }) => {
  const links = await CoachStable.findAll({
    where: { stable_id: stableId, status: 'pending' },
    include: [{ model: User, as: 'coach', attributes: ['id', 'first_name', 'last_name', 'email', 'profile_picture_url', 'specialties', 'coach_type'] }],
    order: [['joined_at', 'DESC']],
  });
  return { data: links.map(l => ({ ...l.get({ plain: true }), coach: l.coach })) };
};

export const updateCoachStableVisibility = async ({ coachId, stableId, visibility }) => {
  const link = await CoachStable.findOne({ where: { coach_id: coachId, stable_id: stableId } });
  if (!link) throw new Error('Coach-stable link not found.');
  link.visibility = visibility;
  await link.save();
  return link;
};
