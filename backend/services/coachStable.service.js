import { Op } from 'sequelize';
import { CoachStable, Stable, User } from '../models/index.js';

export const getCoachStables = async ({ coachId }) => {
  const links = await CoachStable.findAll({
    where: { coach_id: coachId, is_active: true },
    include: [{ model: Stable, as: 'stable', attributes: ['id', 'name', 'city', 'country', 'logo_url', 'rating'] }],
    order: [['is_primary', 'DESC'], ['joined_at', 'ASC']],
  });
  return { data: links.map(l => ({ ...l.get({ plain: true }), stable: l.stable })) };
};

export const linkCoachToStable = async ({ coachId, stableId, isPrimary = false }) => {
  const stable = await Stable.findByPk(stableId);
  if (!stable) throw new Error('Stable not found.');

  const [link, created] = await CoachStable.findOrCreate({
    where: { coach_id: coachId, stable_id: stableId },
    defaults: { coach_id: coachId, stable_id: stableId, is_primary: isPrimary, is_active: true },
  });

  if (!created && !link.is_active) {
    link.is_active = true;
    await link.save();
  }

  return link;
};

export const unlinkCoachFromStable = async ({ coachId, stableId }) => {
  const link = await CoachStable.findOne({ where: { coach_id: coachId, stable_id: stableId } });
  if (!link) throw new Error('Coach-stable link not found.');
  link.is_active = false;
  await link.save();
  return link;
};

export const getStableLinkedCoaches = async ({ stableId }) => {
  const links = await CoachStable.findAll({
    where: { stable_id: stableId, is_active: true },
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
    defaults: { coach_id: coachId, stable_id: stableId, is_primary: isPrimary, is_active: true },
  });

  if (!created && !link.is_active) {
    link.is_active = true;
    await link.save();
  }

  return link;
};

export const adminUnlinkCoachFromStable = async ({ stableId, coachId }) => {
  const link = await CoachStable.findOne({ where: { coach_id: coachId, stable_id: stableId } });
  if (!link) throw new Error('Coach-stable link not found.');
  link.is_active = false;
  await link.save();
  return link;
};
