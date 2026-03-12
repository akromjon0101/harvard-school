import express from 'express';
import OpenAI from 'openai';
import crypto from 'crypto';
import { adminAuth } from '../middleware/auth.js';
import { trackChat } from '../services/usageTracker.js';

const router = express.Router();

const openai = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your-openai-key-here'
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

// ── In-memory cache (hash → result) ──────────────────────────────────────────
// Avoids re-grading identical texts. Persists for server lifetime.
const gradeCache = new Map();

function cacheKey(writingText, speakingText) {
    return crypto.createHash('md5')
        .update((writingText || '') + '|||' + (speakingText || ''))
        .digest('hex');
}

function clamp10(n) {
    return Math.round(Math.min(10, Math.max(0, Number(n) || 0)) * 10) / 10;
}

// ── ONE combined API call for both writing + speaking ─────────────────────────
// Uses gpt-4o-mini (~17x cheaper than gpt-4o) with minimal prompt tokens.
async function gradeAll(writingText, speakingText) {
    // Build compact prompt — only include sections that exist
    const parts = [];
    if (writingText?.trim()) {
        parts.push(`WRITING:\n"""${writingText.trim()}"""`);
    }
    if (speakingText?.trim()) {
        parts.push(`SPEAKING:\n"""${speakingText.trim()}"""`);
    }

    const hasWriting  = Boolean(writingText?.trim());
    const hasSpeaking = Boolean(speakingText?.trim());

    // Minimal system prompt — fewer tokens = lower cost
    const systemMsg = 'English examiner. Grade 0-10. JSON only.';

    // Minimal user prompt — describe only what we need
    const schemaWriting  = hasWriting  ? '"writing_score":0,"writing_feedback":"","writing_criteria":{"grammar":0,"vocabulary":0,"structure":0,"coherence":0}' : '';
    const schemaSpeaking = hasSpeaking ? '"speaking_score":0,"speaking_feedback":"","speaking_criteria":{"pronunciation":0,"grammar":0,"logicalFlow":0,"conversational":0}' : '';
    const schema = [schemaWriting, schemaSpeaking].filter(Boolean).join(',');

    const userMsg =
        `Grade these responses (0-10 each criterion, overall average as score, 1-sentence feedback).\n\n` +
        parts.join('\n\n') +
        `\n\nReturn: {${schema}}`;

    const response = await openai.chat.completions.create({
        model:           'gpt-4o-mini',   // ~17x cheaper than gpt-4o
        temperature:     0.1,              // lower = more deterministic = more consistent tokens
        max_tokens:      300,              // cap output tokens
        response_format: { type: 'json_object' },
        messages: [
            { role: 'system', content: systemMsg },
            { role: 'user',   content: userMsg   },
        ],
    });

    // Track usage
    trackChat({
        model:        'gpt-4o-mini',
        inputTokens:  response.usage?.prompt_tokens     ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
        context:      'grade_combined',
    });

    const raw = JSON.parse(response.choices[0].message.content);

    // Clamp all numeric values to 0-10
    if (raw.writing_score  != null) raw.writing_score  = clamp10(raw.writing_score);
    if (raw.speaking_score != null) raw.speaking_score = clamp10(raw.speaking_score);
    if (raw.writing_criteria)  for (const k of Object.keys(raw.writing_criteria))  raw.writing_criteria[k]  = clamp10(raw.writing_criteria[k]);
    if (raw.speaking_criteria) for (const k of Object.keys(raw.speaking_criteria)) raw.speaking_criteria[k] = clamp10(raw.speaking_criteria[k]);

    return raw;
}

// ── POST /api/grade ───────────────────────────────────────────────────────────
router.post('/', adminAuth, async (req, res) => {
    const { student_id, writing_text, speaking_text, ai_check } = req.body;

    if (!student_id) {
        return res.status(400).json({ error: 'student_id is required' });
    }

    const result = {
        student_id:        String(student_id),
        writing_text:      writing_text  || '',
        speaking_text:     speaking_text || '',
        submission_time:   new Date().toISOString(),
        writing_score:     null,
        writing_feedback:  null,
        writing_criteria:  null,
        speaking_score:    null,
        speaking_feedback: null,
        speaking_criteria: null,
        ai_checked:        Boolean(ai_check),
    };

    if (!ai_check) {
        return res.json(result);
    }

    // ── Check cache first ─────────────────────────────────────────────────────
    const key = cacheKey(writing_text, speaking_text);
    if (gradeCache.has(key)) {
        const cached = gradeCache.get(key);
        return res.json({ ...result, ...cached, cached: true });
    }

    // ── AI not configured ─────────────────────────────────────────────────────
    if (!openai) {
        return res.status(503).json({ error: 'OPENAI_API_KEY is not configured' });
    }

    // ── Nothing to grade ─────────────────────────────────────────────────────
    if (!writing_text?.trim() && !speaking_text?.trim()) {
        return res.status(400).json({ error: 'Provide writing_text or speaking_text' });
    }

    try {
        const grades = await gradeAll(writing_text, speaking_text);

        const payload = {
            writing_score:     grades.writing_score     ?? null,
            writing_feedback:  grades.writing_feedback  ?? null,
            writing_criteria:  grades.writing_criteria  ?? null,
            speaking_score:    grades.speaking_score    ?? null,
            speaking_feedback: grades.speaking_feedback ?? null,
            speaking_criteria: grades.speaking_criteria ?? null,
        };

        // Cache result — same texts never re-graded
        gradeCache.set(key, payload);

        return res.json({ ...result, ...payload });
    } catch (err) {
        console.error('Grade error:', err.message);
        return res.status(500).json({ error: 'AI grading failed: ' + err.message });
    }
});

export default router;
