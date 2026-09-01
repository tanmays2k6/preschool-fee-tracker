import express from 'express';
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentFeeStatus,
  getClassFeeOverview,
  getClassMonthlyFeeStatus,
} from '../controllers/student.controller.js';
import { protect, admin } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/').get(protect, getStudents).post(protect, admin, createStudent);
router.route('/class-fee-overview').get(protect, getClassFeeOverview);
router.route('/class/:className/monthly-status').get(protect, getClassMonthlyFeeStatus);
router.route('/:id/fee-status').get(protect, getStudentFeeStatus);
router.route('/:id').get(protect, getStudentById).put(protect, admin, updateStudent).delete(protect, admin, deleteStudent);

export default router;


