import express from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { protect, admin } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/').get(protect, getSettings).put(protect, admin, updateSettings);

export default router;
