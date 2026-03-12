import express from 'express';
import { createExam, getExams, getExamById, updateExam, deleteExam } from '../controllers/examController.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', adminAuth, createExam);
router.get('/', auth, getExams);
router.get('/:id', auth, getExamById);
router.put('/:id', adminAuth, updateExam);
router.delete('/:id', adminAuth, deleteExam);

export default router;
