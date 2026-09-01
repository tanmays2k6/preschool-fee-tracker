import express from 'express';
import { getDashboardStats, getDashboardCharts } from '../controllers/dashboard.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getDashboardStats);
router.get('/charts', protect, getDashboardCharts);
router.get('/statistics', protect, getDashboardStats); // Added alias for consistency

export default router;
