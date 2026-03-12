import express from 'express';
import { gradeWritingHandler, gradeSpeakingHandler, gradeSpeakingPartsHandler, gradeSpeakingTextHandler, getAIStatus } from '../controllers/aiController.js';
import { adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Trigger AI grading (admin only)
router.post('/grade/:submissionId/writing',  adminAuth, gradeWritingHandler);
router.post('/grade/:submissionId/speaking', adminAuth, gradeSpeakingHandler);
router.post('/grade/:submissionId/speaking-parts', adminAuth, gradeSpeakingPartsHandler);
router.post('/grade/:submissionId/speaking-text', adminAuth, gradeSpeakingTextHandler);

// Poll AI grading status
router.get('/status/:submissionId', adminAuth, getAIStatus);

export default router;
