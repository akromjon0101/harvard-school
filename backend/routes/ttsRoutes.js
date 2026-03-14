import express from 'express';
import OpenAI from 'openai';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { trackTTS } from '../services/usageTracker.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const openai = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your-openai-key-here'
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

// TTS cache dir inside uploads so it's served as static
const TTS_CACHE_DIR = path.join(__dirname, '..', 'uploads', 'tts_cache');
if (!fs.existsSync(TTS_CACHE_DIR)) {
    fs.mkdirSync(TTS_CACHE_DIR, { recursive: true });
}

// POST /api/tts
// body: { text: string, voice?: 'fable'|'nova'|'alloy'|'echo'|'onyx'|'shimmer' }
// Returns: { url: string }  — full URL to the cached mp3
router.post('/', async (req, res) => {
    const { text, voice = 'fable' } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ error: 'text is required' });
    }

    if (!openai) {
        return res.status(503).json({ error: 'TTS service not configured' });
    }

    // Cache by (voice + text) so repeated calls are free
    const hash      = crypto.createHash('md5').update(`tts-1-hd:${voice}:${text.trim()}`).digest('hex');
    const cacheFile = path.join(TTS_CACHE_DIR, `${hash}.mp3`);

    if (fs.existsSync(cacheFile)) {
        const url = `${req.protocol}://${req.get('host')}/uploads/tts_cache/${hash}.mp3`;
        return res.json({ url });
    }

    try {
        const response = await openai.audio.speech.create({
            model:           'tts-1-hd',
            voice,
            input:           text.trim(),
            response_format: 'mp3',
        });

        const buffer = Buffer.from(await response.arrayBuffer());
        fs.writeFileSync(cacheFile, buffer);

        // Track usage (only for newly generated audio, not cache hits)
        trackTTS({ characters: text.trim().length, context: 'speaking_tts' });

        const url = `${req.protocol}://${req.get('host')}/uploads/tts_cache/${hash}.mp3`;
        res.json({ url });
    } catch (err) {
        console.error('TTS error:', err.message);
        res.status(500).json({ error: 'TTS generation failed' });
    }
});

export default router;
