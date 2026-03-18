import express from 'express';
import ObstacleType from '../models/obstacleType.model.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const types = await ObstacleType.findAll({
      where: { is_active: true },
      order: [['category', 'ASC'], ['name', 'ASC']],
    });
    return res.status(200).json({ data: types });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
