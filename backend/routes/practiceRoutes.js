import express from 'express';
import multer from 'multer';
import path from 'path';
import os from 'os';
import { gradePracticeWriting, gradePracticeSpeaking } from '../services/aiGrader.js';
import { transcribeLocalFile } from '../services/transcriber.js';

const router = express.Router();

// Store audio in OS temp dir (auto-cleaned by transcriber after use)
const upload = multer({
    dest: os.tmpdir(),
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB — Whisper limit
    fileFilter: (req, file, cb) => {
        const ok = /\.(mp3|wav|m4a|ogg|webm|mp4)$/i.test(path.extname(file.originalname))
            || file.mimetype.startsWith('audio/')
            || file.mimetype === 'video/webm';
        cb(ok ? null : new Error('Unsupported audio format'), ok);
    },
});

// ── POST /api/practice/speaking ───────────────────────────────────────────
// Body (multipart): audio (file), question (string), userId (string)
router.post('/speaking', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No audio file provided' });

        const question = req.body.question || '';

        // 1. Transcribe
        const transcript = await transcribeLocalFile(req.file.path);
        if (!transcript?.trim()) {
            return res.status(422).json({ error: 'Could not transcribe audio — check microphone quality' });
        }

        // 2. Grade
        const result = await gradePracticeSpeaking(transcript, question);

        res.json({
            result: {
                ...result,
                transcript,
            }
        });
    } catch (err) {
        console.error('[practice/speaking]', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/practice/writing ────────────────────────────────────────────
// Body (JSON): submittedText (string), question (string), userId (string)
router.post('/writing', async (req, res) => {
    try {
        const { submittedText, question } = req.body;
        if (!submittedText?.trim()) return res.status(400).json({ error: 'submittedText is required' });

        const result = await gradePracticeWriting(submittedText, question || '');

        res.json({ result });
    } catch (err) {
        console.error('[practice/writing]', err.message);
        res.status(500).json({ error: err.message });
    }
});

export default router;
