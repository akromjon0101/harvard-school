import express from 'express';
import {
    getAllListeningTests,
    getListeningTest,
    createListeningTest,
    updateListeningTest,
    deleteListeningTest,
    addQuestion,
    updateQuestion,
    deleteQuestion
} from '../controllers/listeningController.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Test routes - Authenticated
router.get('/', auth, getAllListeningTests);
router.get('/:id', auth, getListeningTest);
router.post('/', adminAuth, createListeningTest); // Admin only
router.put('/:id', adminAuth, updateListeningTest); // Admin only
router.delete('/:id', adminAuth, deleteListeningTest); // Admin only

// Question routes - Admin only
router.post('/:id/questions', adminAuth, addQuestion);
router.put('/:testId/questions/:questionId', adminAuth, updateQuestion);
router.delete('/:testId/questions/:questionId', adminAuth, deleteQuestion);

export default router;
