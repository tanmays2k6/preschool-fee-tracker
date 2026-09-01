import express from 'express';
import { getFees, getFeesByStudent, createFee, updateFee, deleteFee } from '../controllers/fee.controller.js';
import { protect, admin } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/').get(protect, getFees).post(protect, admin, createFee);
router.route('/student/:studentId').get(protect, getFeesByStudent);
router.route('/:id').put(protect, admin, updateFee).delete(protect, admin, deleteFee);

export default router;
