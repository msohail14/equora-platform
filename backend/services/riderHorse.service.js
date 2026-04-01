import { Op } from 'sequelize';
import RiderHorse from '../models/riderHorse.model.js';
import { Horse, Stable, Discipline } from '../models/index.js';

/**
 * Get all horses linked to a rider, ordered by relationship type then name
 */
export const getRiderHorses = async (riderId) => {
  const links = await RiderHorse.findAll({
    where: { rider_id: riderId },
    include: [
      {
        model: Horse,
        as: 'horse',
        include: [
          { model: Stable, as: 'stable', attributes: ['id', 'name'] },
          { model: Discipline, as: 'discipline', attributes: ['id', 'name'] },
        ],
      },
    ],
    order: [['relationship_type', 'ASC'], ['created_at', 'DESC']],
  });

  return links.map((link) => {
    const plain = link.get({ plain: true });
    return {
      ...plain.horse,
      relationship_type: plain.relationship_type,
      rider_horse_id: plain.id,
    };
  });
};

/**
 * Add or update a rider-horse relationship (upsert)
 */
export const upsertRiderHorse = async ({ riderId, horseId, stableId, relationshipType = 'favorite' }) => {
  const [record, created] = await RiderHorse.findOrCreate({
    where: { rider_id: riderId, horse_id: horseId },
    defaults: {
      rider_id: riderId,
      horse_id: horseId,
      stable_id: stableId || null,
      relationship_type: relationshipType,
    },
  });

  if (!created && record.relationship_type !== relationshipType) {
    record.relationship_type = relationshipType;
    record.updated_at = new Date();
    await record.save();
  }

  return { record, created };
};

/**
 * Remove a rider-horse link
 */
export const removeRiderHorse = async (riderId, horseId) => {
  const deleted = await RiderHorse.destroy({
    where: { rider_id: riderId, horse_id: horseId },
  });
  return deleted > 0;
};

/**
 * Auto-favorite: called after a booking is completed with a horse
 */
export const autoFavoriteHorse = async ({ riderId, horseId, stableId }) => {
  if (!riderId || !horseId) return null;
  const { record } = await upsertRiderHorse({
    riderId,
    horseId,
    stableId,
    relationshipType: 'favorite',
  });
  return record;
};
