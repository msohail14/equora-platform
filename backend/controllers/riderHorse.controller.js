import { getRiderHorses, upsertRiderHorse, removeRiderHorse } from '../services/riderHorse.service.js';

const handleError = (res, error) => {
  console.error('[rider-horse]', error.message || error);
  return res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
};

export const getRiderHorsesController = async (req, res) => {
  try {
    const riderId = req.user?.id;
    if (!riderId) return res.status(401).json({ error: 'Not authenticated' });
    const data = await getRiderHorses(riderId);
    return res.status(200).json({ data });
  } catch (error) {
    return handleError(res, error);
  }
};

export const addRiderHorseController = async (req, res) => {
  try {
    const riderId = req.user?.id;
    if (!riderId) return res.status(401).json({ error: 'Not authenticated' });
    const { horse_id, stable_id, relationship_type } = req.body;
    if (!horse_id) return res.status(400).json({ error: 'horse_id is required' });

    const { record, created } = await upsertRiderHorse({
      riderId,
      horseId: horse_id,
      stableId: stable_id,
      relationshipType: relationship_type || 'favorite',
    });

    return res.status(created ? 201 : 200).json({ data: record });
  } catch (error) {
    return handleError(res, error);
  }
};

export const removeRiderHorseController = async (req, res) => {
  try {
    const riderId = req.user?.id;
    if (!riderId) return res.status(401).json({ error: 'Not authenticated' });
    const horseId = parseInt(req.params.horseId, 10);
    if (!horseId) return res.status(400).json({ error: 'Invalid horse ID' });

    const deleted = await removeRiderHorse(riderId, horseId);
    if (!deleted) return res.status(404).json({ error: 'Relationship not found' });
    return res.status(200).json({ message: 'Removed' });
  } catch (error) {
    return handleError(res, error);
  }
};
