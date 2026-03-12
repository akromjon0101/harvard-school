import express from 'express';
import {
    getAllReadingTests,
    getReadingTest,
    createReadingTest,
    updateReadingTest,
    deleteReadingTest,
    addPassage,
    updatePassage,
    deletePassage
} from '../controllers/readingController.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Test routes - Authenticated
router.get('/', auth, getAllReadingTests);
router.get('/:id', auth, getReadingTest);
router.post('/', adminAuth, createReadingTest); // Admin only
router.put('/:id', adminAuth, updateReadingTest); // Admin only
router.delete('/:id', adminAuth, deleteReadingTest); // Admin only

// Passage routes - Admin only
router.post('/:id/passages', adminAuth, addPassage);
router.put('/:testId/passages/:passageId', adminAuth, updatePassage);
router.delete('/:testId/passages/:passageId', adminAuth, deletePassage);

export default router;
