import express from 'express';
import {
    getAllWritingTests,
    getWritingTest,
    createWritingTest,
    updateWritingTest,
    deleteWritingTest,
    addTask,
    updateTask,
    deleteTask
} from '../controllers/writingController.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Test routes - Authenticated
router.get('/', auth, getAllWritingTests);
router.get('/:id', auth, getWritingTest);
router.post('/', adminAuth, createWritingTest); // Admin only
router.put('/:id', adminAuth, updateWritingTest); // Admin only
router.delete('/:id', adminAuth, deleteWritingTest); // Admin only

// Task routes - Admin only
router.post('/:id/tasks', adminAuth, addTask);
router.put('/:testId/tasks/:taskId', adminAuth, updateTask);
router.delete('/:testId/tasks/:taskId', adminAuth, deleteTask);

export default router;
