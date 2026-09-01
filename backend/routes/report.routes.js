import express from 'express';
import { getMonthlyReport, getOutstandingReport } from '../controllers/report.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/monthly').get(protect, getMonthlyReport);
router.route('/outstanding').get(protect, getOutstandingReport);

export default router;
