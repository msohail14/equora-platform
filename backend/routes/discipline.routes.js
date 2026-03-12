import express from 'express';
import adminAuthMiddleware from '../middleware/admin-auth.middleware.js';
import { uploadDisciplineIcon } from '../middleware/upload.middleware.js';
import {
  createDisciplineController,
  deleteDisciplineController,
  getAllDisciplinesController,
  getDisciplineByIdController,
  updateDisciplineController,
} from '../controllers/discipline.controller.js';

const router = express.Router();

router.post('/', adminAuthMiddleware, uploadDisciplineIcon, createDisciplineController);
router.get('/', adminAuthMiddleware, getAllDisciplinesController);
router.get('/:id', adminAuthMiddleware, getDisciplineByIdController);
router.put('/:id', adminAuthMiddleware, uploadDisciplineIcon, updateDisciplineController);
router.delete('/:id', adminAuthMiddleware, deleteDisciplineController);

export default router;
