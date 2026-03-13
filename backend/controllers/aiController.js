import Submission from '../models/Submission.js';
import Exam from '../models/Exam.js';
import { gradeWritingTask, gradeSpeakingText, gradeSpeakingWithContext, roundIELTSOverall } from '../services/aiGrader.js';
import { transcribeAudio } from '../services/transcriber.js';

// Auto-complete submission if exam has aiGradingEnabled and all grading is done
async function maybeAutoComplete(subDoc) {
    try {
        const examDoc = await Exam.findById(subDoc.exam).select('aiGradingEnabled').lean();
        if (!examDoc?.aiGradingEnabled) return;
        const ai = subDoc.aiGrading || {};
        const writingPending  = ai.writing?.some(w => w.status === 'processing');
        const speakingPending = ai.speaking?.status === 'processing';
        const speakingTextPending = ai.speakingTexts?.some(s => s.status === 'processing');
        if (!writingPending && !speakingPending && !speakingTextPending) {
            subDoc.status = 'completed';
            await subDoc.save();
            console.log(`[AI] Submission ${subDoc._id} auto-completed (aiGradingEnabled)`);
        }
    } catch (err) {
        console.error('[AI] maybeAutoComplete error:', err.message);
    }
}

// ── Band helpers ──────────────────────────────────────────────────────────────
function ieltsListeningBand(score, total) {
    if (!total || !score) return 0;
    const pct = (score / total) * 100;
    if (pct >= 97.5) return 9.0;
    if (pct >= 92.5) return 8.5;
    if (pct >= 87.5) return 8.0;
    if (pct >= 80.0) return 7.5;
    if (pct >= 75.0) return 7.0;
    if (pct >= 65.0) return 6.5;
    if (pct >= 57.5) return 6.0;
    if (pct >= 45.0) return 5.5;
    if (pct >= 40.0) return 5.0;
    if (pct >= 32.5) return 4.5;
    if (pct >= 25.0) return 4.0;
    if (pct >= 20.0) return 3.5;
    if (pct >= 15.0) return 3.0;
    if (pct >= 10.0) return 2.5;
    if (pct >=  7.5) return 2.0;
    return 1.0;
}

function ieltsReadingBand(score, total) {
    if (!total || !score) return 0;
    const pct = (score / total) * 100;
    if (pct >= 97.5) return 9.0;
    if (pct >= 92.5) return 8.5;
    if (pct >= 87.5) return 8.0;
    if (pct >= 82.5) return 7.5;
    if (pct >= 75.0) return 7.0;
    if (pct >= 67.5) return 6.5;
    if (pct >= 57.5) return 6.0;
    if (pct >= 47.5) return 5.5;
    if (pct >= 37.5) return 5.0;
    if (pct >= 32.5) return 4.5;
    if (pct >= 25.0) return 4.0;
    if (pct >= 20.0) return 3.5;
    if (pct >= 15.0) return 3.0;
    if (pct >= 10.0) return 2.5;
    if (pct >=  7.5) return 2.0;
    return 1.0;
}

// IELTS official overall band: average of included modules, rounded to nearest 0.5
function recalcBand(sub) {
    const bands = [];
    const ms = sub.moduleScores;
    if (ms?.listening?.total > 0) bands.push(ieltsListeningBand(ms.listening.score, ms.listening.total));
    if (ms?.reading?.total  > 0)  bands.push(ieltsReadingBand(ms.reading.score,  ms.reading.total));
    if (ms?.writing?.score  > 0)  bands.push(ms.writing.score);
    if (ms?.speaking?.score > 0)  bands.push(ms.speaking.score);
    if (bands.length > 0) {
        const avg = bands.reduce((a, b) => a + b, 0) / bands.length;
        sub.estimatedBand = roundIELTSOverall(avg);
    }
}

// ── Writing grading ───────────────────────────────────────────────────────────
export async function runWritingGrading(submissionId) {
    const sub = await Submission.findById(submissionId);
    if (!sub?.writingTexts?.length) return;

    // Fetch exam writing task prompts so AI knows what was asked
    let writingPrompts = [];
    try {
        const examDoc = await Exam.findById(sub.exam).select('modules.writing').lean();
        writingPrompts = (examDoc?.modules?.writing || []).map(s => s.passageContent || '');
    } catch { writingPrompts = []; }

    sub.aiGrading = sub.aiGrading || {};
    sub.aiGrading.writing = sub.writingTexts.map((_, i) => ({ taskIndex: i, status: 'processing' }));
    sub.markModified('aiGrading');
    await sub.save();

    for (let i = 0; i < sub.writingTexts.length; i++) {
        const text = sub.writingTexts[i];
        if (!text?.trim()) {
            sub.aiGrading.writing[i] = { taskIndex: i, status: 'error', error: 'Empty text' };
            sub.markModified('aiGrading');
            await sub.save();
            continue;
        }
        try {
            const imageUrl   = sub.writingImages?.[i] || '';
            const taskPrompt = writingPrompts[i] || '';
            console.log(`[AI] Writing Task ${i + 1} for ${submissionId}${imageUrl ? ' (with image)' : ''}${taskPrompt ? ' (with prompt)' : ''}`);
            const result = await gradeWritingTask(text, i, imageUrl, taskPrompt);
            sub.aiGrading.writing[i] = {
                taskIndex: i, status: 'done',
                band:             result.band,
                wordCount:        result.wordCount,
                criteria:         result.criteria,
                strengths:        result.strengths        || [],
                weaknesses:       result.weaknesses       || [],
                improvementAdvice:result.improvementAdvice|| [],
                questionAnalysis: result.questionAnalysis || '',
                relevanceCheck:   result.relevanceCheck   || '',
                chartType:        result.chartType        || '',
                keyDataPoints:    result.keyDataPoints    || [],
                dataAccuracy:     result.dataAccuracy     || '',
                feedback:         result.feedback,
                gradedAt:         new Date(),
            };
            console.log(`[AI] Writing Task ${i + 1} done — Band ${result.band}`);
        } catch (err) {
            console.error(`[AI] Writing Task ${i + 1} failed:`, err.message);
            sub.aiGrading.writing[i] = { taskIndex: i, status: 'error', error: err.message };
        }
        sub.markModified('aiGrading');
        await sub.save();
    }

    // Update moduleScores.writing with average band from all done tasks
    const doneTasks = sub.aiGrading.writing.filter(w => w.status === 'done');
    if (doneTasks.length > 0) {
        const avgBand = doneTasks.reduce((a, w) => a + (w.band || 0), 0) / doneTasks.length;
        const roundedBand = Math.round(avgBand * 2) / 2;
        const ms = sub.moduleScores?.toObject?.() ?? { ...sub.moduleScores };
        sub.moduleScores = { ...ms, writing: { score: roundedBand, total: 9 } };
        sub.markModified('moduleScores');
        recalcBand(sub);
        await sub.save();
        console.log(`[AI] Writing avg band: ${roundedBand} → estimatedBand: ${sub.estimatedBand}`);
    }
    await maybeAutoComplete(sub);
}

// ── Speaking grading — legacy single audio URL ────────────────────────────────
export async function runSpeakingGrading(submissionId) {
    const sub = await Submission.findById(submissionId);
    const audioUrl = sub?.speakingAudioUrl;
    if (!audioUrl) return;

    sub.aiGrading = sub.aiGrading || {};
    sub.aiGrading.speaking = { status: 'processing' };
    sub.markModified('aiGrading');
    await sub.save();

    try {
        console.log(`[AI] Transcribing speaking for ${submissionId}`);
        const transcript = await transcribeAudio(audioUrl);
        console.log(`[AI] Grading speaking (${transcript.length} chars)`);
        const result = await gradeSpeakingText(transcript);

        sub.aiGrading.speaking = {
            status: 'done', transcript,
            band:             result.band,
            criteria:         result.criteria,
            strengths:        result.strengths        || [],
            weaknesses:       result.weaknesses       || [],
            improvementAdvice:result.improvementAdvice|| [],
            questionAnalysis: result.questionAnalysis || '',
            relevanceCheck:   result.relevanceCheck   || '',
            feedback:         result.feedback,
            gradedAt:         new Date(),
        };

        // Update moduleScores.speaking
        const ms = sub.moduleScores?.toObject?.() ?? { ...sub.moduleScores };
        sub.moduleScores = { ...ms, speaking: { score: result.band, total: 9 } };
        sub.markModified('moduleScores');
        recalcBand(sub);
        console.log(`[AI] Speaking done — Band ${result.band} → estimatedBand: ${sub.estimatedBand}`);
    } catch (err) {
        console.error(`[AI] Speaking grading failed:`, err.message);
        sub.aiGrading.speaking = { status: 'error', error: err.message };
    }

    sub.markModified('aiGrading');
    await sub.save();
    await maybeAutoComplete(sub);
}

// ── Speaking parts — transcribe each part then grade per-part with context ─────
export async function runSpeakingPartsGrading(submissionId) {
    const sub = await Submission.findById(submissionId);
    if (!sub?.speakingParts?.length) return;

    sub.aiGrading = sub.aiGrading || {};
    sub.aiGrading.speaking = { status: 'processing' };
    sub.markModified('aiGrading');
    await sub.save();

    try {
        // 1. Transcribe any part that doesn't have a transcript yet
        for (let i = 0; i < sub.speakingParts.length; i++) {
            const part = sub.speakingParts[i];
            if (part.transcript?.trim() || !part.audioUrl) continue;

            console.log(`[AI] Transcribing Part ${part.partIndex + 1} for ${submissionId}`);
            try {
                const transcript = await transcribeAudio(part.audioUrl);
                sub.speakingParts[i].transcript = transcript;
                sub.speakingParts[i].transcriptStatus = 'done';
                console.log(`[AI] Part ${part.partIndex + 1} transcribed (${transcript.length} chars)`);
            } catch (err) {
                console.error(`[AI] Part ${part.partIndex + 1} transcription failed:`, err.message);
                sub.speakingParts[i].transcriptStatus = 'error';
            }
            sub.markModified('speakingParts');
            await sub.save();
        }

        // 2. Reload and collect parts that have transcripts
        const fresh = await Submission.findById(submissionId);
        const parts = (fresh.speakingParts || [])
            .filter(p => p.transcript?.trim())
            .sort((a, b) => a.partIndex - b.partIndex);

        if (!parts.length) {
            fresh.aiGrading.speaking = { status: 'error', error: 'All parts failed transcription' };
            fresh.markModified('aiGrading');
            await fresh.save();
            return;
        }

        // 3. Fetch exam speaking sections for question context per part
        let speakingSections = [];
        try {
            const examDoc = await Exam.findById(fresh.exam).select('modules.speaking').lean();
            speakingSections = examDoc?.modules?.speaking || [];
        } catch { speakingSections = []; }

        // 4. Grade each part separately with its questions
        fresh.aiGrading.speakingTexts = parts.map(p => ({ partIndex: p.partIndex, status: 'processing' }));
        fresh.markModified('aiGrading');
        await fresh.save();

        const bandResults = [];

        for (let idx = 0; idx < parts.length; idx++) {
            const part = parts[idx];
            const i = part.partIndex;
            const section   = speakingSections[i] || {};
            const partLabel = section.title || `Part ${i + 1}`;
            const questions = (section.questions || []).map(q => q.questionText || '').filter(Boolean);

            console.log(`[AI] Grading ${partLabel} for ${submissionId} (${questions.length} questions)`);
            try {
                const result = await gradeSpeakingWithContext(part.transcript, partLabel, questions);
                fresh.aiGrading.speakingTexts[idx] = {
                    partIndex: i, status: 'done', transcript: part.transcript,
                    band:             result.band,
                    criteria:         result.criteria,
                    strengths:        result.strengths         || [],
                    weaknesses:       result.weaknesses        || [],
                    improvementAdvice:result.improvementAdvice || [],
                    questionAnalysis: result.questionAnalysis  || '',
                    relevanceCheck:   result.relevanceCheck    || '',
                    feedback:         result.feedback,
                    gradedAt:         new Date(),
                };
                bandResults.push(result.band);
                console.log(`[AI] ${partLabel} done — Band ${result.band}`);
            } catch (err) {
                console.error(`[AI] ${partLabel} grading failed:`, err.message);
                fresh.aiGrading.speakingTexts[idx] = { partIndex: i, status: 'error', error: err.message };
            }
            fresh.markModified('aiGrading');
            await fresh.save();
        }

        // 5. Overall band = average of all graded parts
        if (bandResults.length > 0) {
            const avgBand = bandResults.reduce((a, b) => a + b, 0) / bandResults.length;
            const roundedBand = Math.round(avgBand * 2) / 2;
            fresh.aiGrading.speaking = { status: 'done', band: roundedBand, gradedAt: new Date() };
            const ms = fresh.moduleScores?.toObject?.() ?? { ...fresh.moduleScores };
            fresh.moduleScores = { ...ms, speaking: { score: roundedBand, total: 9 } };
            fresh.markModified('moduleScores');
            recalcBand(fresh);
            fresh.markModified('aiGrading');
            await fresh.save();
            console.log(`[AI] Speaking parts avg band: ${roundedBand} → estimatedBand: ${fresh.estimatedBand}`);
        } else {
            fresh.aiGrading.speaking = { status: 'error', error: 'All parts failed grading' };
            fresh.markModified('aiGrading');
            await fresh.save();
        }
        await maybeAutoComplete(fresh);

    } catch (err) {
        console.error(`[AI] Speaking parts grading failed:`, err.message);
        const reload = await Submission.findById(submissionId);
        if (reload) {
            reload.aiGrading = reload.aiGrading || {};
            reload.aiGrading.speaking = { status: 'error', error: err.message };
            reload.markModified('aiGrading');
            await reload.save();
            await maybeAutoComplete(reload);
        }
    }
}

// ── Speaking text grading — admin text input mode ─────────────────────────────
export async function runSpeakingTextGrading(submissionId) {
    const sub = await Submission.findById(submissionId);
    if (!sub?.speakingTexts?.length) return;

    // Fetch exam speaking sections to get question context per part
    let speakingSections = [];
    try {
        const examDoc = await Exam.findById(sub.exam).select('modules.speaking').lean();
        speakingSections = examDoc?.modules?.speaking || [];
    } catch { speakingSections = []; }

    sub.aiGrading = sub.aiGrading || {};
    sub.aiGrading.speakingTexts = sub.speakingTexts.map((_, i) => ({ partIndex: i, status: 'processing' }));
    sub.markModified('aiGrading');
    await sub.save();

    for (let i = 0; i < sub.speakingTexts.length; i++) {
        const text = sub.speakingTexts[i];
        if (!text?.trim()) {
            sub.aiGrading.speakingTexts[i] = { partIndex: i, status: 'error', error: 'Empty text' };
            sub.markModified('aiGrading');
            await sub.save();
            continue;
        }
        try {
            const section   = speakingSections[i] || {};
            const partLabel = section.title || `Part ${i + 1}`;
            const questions = (section.questions || []).map(q => q.questionText || '').filter(Boolean);
            console.log(`[AI] Speaking text ${partLabel} for ${submissionId} (${questions.length} questions)`);
            const result = await gradeSpeakingWithContext(text, partLabel, questions);
            sub.aiGrading.speakingTexts[i] = {
                partIndex: i, status: 'done', transcript: text,
                band:             result.band,
                criteria:         result.criteria,
                strengths:        result.strengths        || [],
                weaknesses:       result.weaknesses       || [],
                improvementAdvice:result.improvementAdvice|| [],
                questionAnalysis: result.questionAnalysis || '',
                relevanceCheck:   result.relevanceCheck   || '',
                feedback:         result.feedback,
                gradedAt:         new Date(),
            };
            console.log(`[AI] Speaking text ${partLabel} done — Band ${result.band}`);
        } catch (err) {
            console.error(`[AI] Speaking text Part ${i + 1} failed:`, err.message);
            sub.aiGrading.speakingTexts[i] = { partIndex: i, status: 'error', error: err.message };
        }
        sub.markModified('aiGrading');
        await sub.save();
    }

    // Update moduleScores.speaking with average band
    const doneParts = sub.aiGrading.speakingTexts.filter(s => s.status === 'done');
    if (doneParts.length > 0) {
        const avgBand = doneParts.reduce((a, s) => a + (s.band || 0), 0) / doneParts.length;
        const roundedBand = Math.round(avgBand * 2) / 2;
        const ms = sub.moduleScores?.toObject?.() ?? { ...sub.moduleScores };
        sub.moduleScores = { ...ms, speaking: { score: roundedBand, total: 9 } };
        sub.markModified('moduleScores');
        recalcBand(sub);
        await sub.save();
        console.log(`[AI] Speaking text avg band: ${roundedBand} → estimatedBand: ${sub.estimatedBand}`);
    }
    await maybeAutoComplete(sub);
}

// ── Route handlers ─────────────────────────────────────────────────────────────
export const gradeWritingHandler = async (req, res) => {
    try {
        const sub = await Submission.findById(req.params.submissionId);
        if (!sub) return res.status(404).json({ error: 'Submission not found' });
        if (!sub.writingTexts?.length) return res.status(400).json({ error: 'No writing texts found' });
        res.json({ message: 'AI writing grading started', submissionId: sub._id });
        runWritingGrading(sub._id.toString()).catch(console.error);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const gradeSpeakingHandler = async (req, res) => {
    try {
        const sub = await Submission.findById(req.params.submissionId);
        if (!sub) return res.status(404).json({ error: 'Submission not found' });
        if (!sub.speakingAudioUrl) return res.status(400).json({ error: 'No speaking audio found' });
        res.json({ message: 'AI speaking grading started', submissionId: sub._id });
        runSpeakingGrading(sub._id.toString()).catch(console.error);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const gradeSpeakingPartsHandler = async (req, res) => {
    try {
        const sub = await Submission.findById(req.params.submissionId);
        if (!sub) return res.status(404).json({ error: 'Submission not found' });
        if (!sub.speakingParts?.length) return res.status(400).json({ error: 'No speaking parts found' });
        res.json({ message: 'AI speaking parts grading started', submissionId: sub._id });
        runSpeakingPartsGrading(sub._id.toString()).catch(console.error);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const gradeSpeakingTextHandler = async (req, res) => {
    try {
        const sub = await Submission.findById(req.params.submissionId);
        if (!sub) return res.status(404).json({ error: 'Submission not found' });
        if (!sub.speakingTexts?.length) return res.status(400).json({ error: 'No speaking text answers found' });
        res.json({ message: 'AI speaking text grading started', submissionId: sub._id });
        runSpeakingTextGrading(sub._id.toString()).catch(console.error);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getAIStatus = async (req, res) => {
    try {
        const sub = await Submission.findById(req.params.submissionId).select('aiGrading');
        if (!sub) return res.status(404).json({ error: 'Submission not found' });
        res.json(sub.aiGrading || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
