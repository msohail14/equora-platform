import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import {
  getRiderHorsesController,
  addRiderHorseController,
  removeRiderHorseController,
} from '../controllers/riderHorse.controller.js';

const router = Router();

// GET /rider-horses — get my horses
router.get('/', authMiddleware, getRiderHorsesController);

// POST /rider-horses — add horse to my horses
router.post('/', authMiddleware, addRiderHorseController);

// DELETE /rider-horses/:horseId — remove horse from my horses
router.delete('/:horseId', authMiddleware, removeRiderHorseController);

export default router;
