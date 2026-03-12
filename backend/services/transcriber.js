import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import os from 'os';
import https from 'https';
import http from 'http';
import { trackWhisper } from './usageTracker.js';

const openai = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your-openai-key-here'
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

// Download audio file from URL to a temp file, return temp file path
function downloadToTemp(url) {
    return new Promise((resolve, reject) => {
        let parsedUrl;
        try { parsedUrl = new URL(url); } catch {
            return reject(new Error('Invalid audio URL'));
        }

        const ext = path.extname(parsedUrl.pathname) || '.webm';
        const tmpFile = path.join(os.tmpdir(), `ielts_speaking_${Date.now()}${ext}`);
        const file = fs.createWriteStream(tmpFile);
        const proto = url.startsWith('https') ? https : http;

        proto.get(url, (res) => {
            if (res.statusCode !== 200) {
                fs.unlink(tmpFile, () => {});
                return reject(new Error(`Download failed: HTTP ${res.statusCode}`));
            }
            res.pipe(file);
            file.on('finish', () => { file.close(); resolve(tmpFile); });
        }).on('error', (err) => {
            fs.unlink(tmpFile, () => {});
            reject(err);
        });
    });
}

// Estimate audio duration in seconds from file size (rough: ~16KB/s for webm/ogg)
function estimateDurationSec(filePath) {
    try {
        const bytes = fs.statSync(filePath).size;
        return Math.max(1, Math.round(bytes / 16000));
    } catch { return 30; } // fallback: 30s
}

// Transcribe a local file path using OpenAI Whisper (used by practice routes)
export async function transcribeLocalFile(filePath) {
    if (!openai) throw new Error('OPENAI_API_KEY is not configured');

    const durationSec = estimateDurationSec(filePath);
    try {
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: 'whisper-1',
            language: 'en',
            response_format: 'text',
        });
        trackWhisper({ durationSec, context: 'practice_transcribe' });
        return typeof transcription === 'string' ? transcription : transcription.text || '';
    } finally {
        fs.unlink(filePath, () => {});
    }
}

// Transcribe audio URL using OpenAI Whisper
export async function transcribeAudio(audioUrl) {
    if (!openai) throw new Error('OPENAI_API_KEY is not configured');

    const tmpFile = await downloadToTemp(audioUrl);
    const durationSec = estimateDurationSec(tmpFile);

    try {
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(tmpFile),
            model: 'whisper-1',
            language: 'en',
            response_format: 'text',
        });
        trackWhisper({ durationSec, context: 'submission_transcribe' });
        return typeof transcription === 'string' ? transcription : transcription.text || '';
    } finally {
        fs.unlink(tmpFile, () => {});
    }
}
