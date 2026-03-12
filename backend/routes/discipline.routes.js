import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
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

router.get('/public', getAllDisciplinesController);
router.get('/public/:id', getDisciplineByIdController);

router.post('/', adminAuthMiddleware, uploadDisciplineIcon, createDisciplineController);
router.get('/', adminAuthMiddleware, getAllDisciplinesController);
router.get('/:id', adminAuthMiddleware, getDisciplineByIdController);
router.put('/:id', adminAuthMiddleware, uploadDisciplineIcon, updateDisciplineController);
router.delete('/:id', adminAuthMiddleware, deleteDisciplineController);

export default router;
