import express from 'express';
import {
    getAllSubmissions,
    getUserSubmissions,
    getSubmissionById,
    createSubmission,
    updateSubmission,
    deleteSubmission
} from '../controllers/submissionController.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', adminAuth, getAllSubmissions);
router.get('/user/:userId', auth, getUserSubmissions);
router.get('/:id', auth, getSubmissionById);
router.post('/', auth, createSubmission);
router.put('/:id', adminAuth, updateSubmission);
router.delete('/:id', adminAuth, deleteSubmission);

export default router;
