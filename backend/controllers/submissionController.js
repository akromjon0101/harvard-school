import Submission from '../models/Submission.js';
import Exam from '../models/Exam.js';
import { runWritingGrading, runSpeakingGrading, runSpeakingPartsGrading, runSpeakingTextGrading } from './aiController.js';

const calculateIELTSBand = (score, total) => {
    if (!total || total === 0) return 0;
    if (!score || score === 0) return 0;
    const percentage = (score / total) * 100;
    if (percentage >= 97.5) return 9.0;
    if (percentage >= 87.5) return 8.5;
    if (percentage >= 81.25) return 8.0;
    if (percentage >= 75) return 7.5;
    if (percentage >= 67.5) return 7.0;
    if (percentage >= 60) return 6.5;
    if (percentage >= 51.25) return 6.0;
    if (percentage >= 45) return 5.5;
    if (percentage >= 38.75) return 5.0;
    return 4.0;
};

function norm(v) {
    if (v == null) return '';
    if (Array.isArray(v)) return v.map(x => String(x).trim().toLowerCase()).filter(Boolean).sort().join(',');
    return String(v).trim().toLowerCase();
}

function scoreQuestion(q, answers) {
    if (!q || typeof q !== 'object') return { score: 0, total: 0 };
    const start = q.startNumber ?? q.questionNumber ?? 1;
    const correctAnswers = Array.isArray(q.correctAnswers) && q.correctAnswers.length > 0
        ? q.correctAnswers.map(String).map(s => s.trim().toLowerCase())
        : (q.correctAnswer != null && q.correctAnswer !== '') ? [String(q.correctAnswer).trim().toLowerCase()] : [];
    if (correctAnswers.length === 0) return { score: 0, total: 0 };

    if (q.type === 'mcq-multi' && correctAnswers.length >= 2) {
        const studentArr = Array.isArray(answers[start]) ? answers[start] : (answers[start] != null ? [answers[start]] : []);
        const correctSet = new Set(correctAnswers.slice(0, 2));
        const studentSet = new Set(studentArr.map(x => String(x).trim().toLowerCase()));
        let score = 0;
        studentSet.forEach(s => { if (correctSet.has(s)) score++; });
        return { score, total: 2 };
    }

    let total = 1;
    if (q.type === 'table-completion' && q.tableData?.rows) {
        total = q.tableData.rows.reduce((acc, row) =>
            acc + (Array.isArray(row) ? row.filter(c => /\[gap\]/i.test(String(c))).length : 0), 0) || 1;
    } else {
        const qText = typeof q.questionText === 'string' ? q.questionText : '';
        const gaps = (qText.match(/\[gap\]/gi) || []).length;
        const matchLen = Array.isArray(q.matchingItems) ? q.matchingItems.length : 0;
        total = Math.max(gaps, matchLen, correctAnswers.length, 1);
    }

    let score = 0;
    for (let i = 0; i < total; i++) {
        const num = start + i;
        const studentAns = norm(answers[num]);
        const rawCorrect = (correctAnswers[i] ?? correctAnswers[0]) || '';
        // Support pipe-separated alternatives: "1912 | nineteen twelve"
        const accepted = rawCorrect.split('|').map(s => s.trim().toLowerCase()).filter(Boolean);
        if (accepted.length > 0 && accepted.some(a => a === studentAns)) score++;
    }
    return { score, total };
}

// Extracts module-specific answers from the namespaced answer map.
// Handles both legacy plain keys (answers[1]) and namespaced keys (answers['listening_1']).
function extractAnswers(allAnswers, module) {
    const prefix = `${module}_`
    const hasNamespaced = Object.keys(allAnswers).some(k => k.startsWith(prefix))
    if (!hasNamespaced) return allAnswers // legacy fallback — plain numeric keys
    const result = {}
    Object.entries(allAnswers).forEach(([k, v]) => {
        if (k.startsWith(prefix)) {
            result[Number(k.slice(prefix.length))] = v
        }
    })
    return result
}

function scoreModule(moduleSections, answers) {
    let score = 0, total = 0;
    const sectionBreakdown = [];
    const sections = Array.isArray(moduleSections) ? moduleSections : [];
    for (const section of sections) {
        const questions = Array.isArray(section?.questions) ? section.questions : [];
        let sectionScore = 0, sectionTotal = 0;
        for (const q of questions) {
            if (!q || typeof q !== 'object') continue;
            const { score: s, total: t } = scoreQuestion(q, answers);
            sectionScore += s;
            sectionTotal += t;
        }
        sectionBreakdown.push(sectionScore);
        score += sectionScore;
        total += sectionTotal;
    }
    return { score, total, sectionBreakdown };
}

export const createSubmission = async (req, res) => {
    try {
        const { exam, answers } = req.body;
        const userId = req.user?._id || req.user?.id || req.body.user;
        if (!userId) return res.status(400).json({ error: 'User not identified' });
        if (!exam) return res.status(400).json({ error: 'Exam ID required' });

        const examDoc = await Exam.findById(exam).lean();
        if (!examDoc) return res.status(404).json({ error: 'Exam not found' });

        const safeAnswers = (answers && typeof answers === 'object' && !Array.isArray(answers))
            ? answers
            : {};

        const modules = examDoc.modules || {};
        const listeningAnswers = extractAnswers(safeAnswers, 'listening');
        const readingAnswers   = extractAnswers(safeAnswers, 'reading');
        const listeningResult = scoreModule(modules.listening, listeningAnswers);
        const readingResult   = scoreModule(modules.reading,   readingAnswers);

        const lScore = listeningResult.score;
        const lTotal = listeningResult.total;
        const lSectionBreakdown = [...(listeningResult.sectionBreakdown || [])];
        const rScore = readingResult.score;
        const rTotal = readingResult.total;
        const rPassageBreakdown = [...(readingResult.sectionBreakdown || [])];

        const lBand = calculateIELTSBand(lScore, lTotal);
        const rBand = rTotal > 0 ? calculateIELTSBand(rScore, rTotal) : 0;
        const estimatedBand = lTotal > 0 && rTotal > 0
            ? Math.round((lBand + rBand) / 2 * 2) / 2
            : lTotal > 0 ? lBand : rBand;

        // Extract writing texts from answers (writing_0, writing_1, ...)
        const writingKeys = Object.keys(safeAnswers)
            .filter(k => /^writing_\d+$/.test(k))
            .sort((a, b) => {
                const ai = parseInt(a.replace('writing_', ''));
                const bi = parseInt(b.replace('writing_', ''));
                return ai - bi;
            });
        const writingTexts = writingKeys.map(k => safeAnswers[k] || '').filter(t => t.trim().length > 0);

        // Extract image URLs from writing sections (Task 1 chart/diagram image)
        const writingImages = (modules.writing || []).map(section => {
            const img = (section.media || []).find(m => m.type === 'image');
            return img?.url || '';
        });

        // Extract speaking audio URL (legacy single field)
        const speakingAudioUrl = safeAnswers.speakingAudioUrl || '';

        // Extract speaking parts from all speaking_audio_* keys:
        //   speaking_audio_1        → whole-part recording (Part 2 cue card)
        //   speaking_audio_0_q2     → per-question recording (Part 1 & 3 turn-by-turn)
        const speakingParts = [];
        Object.entries(safeAnswers).forEach(([k, v]) => {
            if (!v || typeof v !== 'string' || !v.startsWith('http')) return;
            const mPart = k.match(/^speaking_audio_(\d+)$/);
            const mQ    = k.match(/^speaking_audio_(\d+)_q(\d+)$/);
            if (mPart) {
                speakingParts.push({ partIndex: parseInt(mPart[1]), questionIndex: null, audioUrl: v });
            } else if (mQ) {
                speakingParts.push({ partIndex: parseInt(mQ[1]), questionIndex: parseInt(mQ[2]), audioUrl: v });
            }
        });
        speakingParts.sort((a, b) => a.partIndex - b.partIndex || (a.questionIndex ?? -1) - (b.questionIndex ?? -1));

        // Extract speaking text answers (admin exam mode: speaking_text_0, speaking_text_1, ...)
        const speakingTextKeys = Object.keys(safeAnswers)
            .filter(k => /^speaking_text_\d+$/.test(k))
            .sort((a, b) => parseInt(a.replace('speaking_text_', '')) - parseInt(b.replace('speaking_text_', '')));
        const speakingTexts = speakingTextKeys.map(k => safeAnswers[k] || '').filter(t => t.trim().length > 0);

        // Set status: if writing or speaking content exists → pending_review
        const hasWriting  = writingTexts.length > 0;
        const hasSpeaking = speakingParts.length > 0 || !!speakingAudioUrl || speakingTexts.length > 0;
        const status = (hasWriting || hasSpeaking) ? 'pending_review' : 'completed';

        const feedback = {
            strengths: lBand >= 7 ? "Demonstrates strong comprehension of both social and academic contexts." : "Basic understanding of primary details in Section 1.",
            weaknesses: lTotal === 0 && rTotal === 0 ? "No scorable questions in this exam." : "Review incorrect answers to improve.",
            recommendation: estimatedBand < 6 ? "Advise focusing on Section 1 & 2 accuracy before attempting academic lectures." : "Regular exposure to high-level academic discussions is recommended."
        };

        const newSubmission = new Submission({
            user: userId,
            exam,
            answers: safeAnswers,
            writingTexts,
            writingImages,
            speakingTexts,
            speakingAudioUrl,
            speakingParts,
            moduleScores: {
                listening: {
                    score: lScore,
                    total: lTotal,
                    sectionBreakdown: lSectionBreakdown,
                    weakSkills: []
                },
                reading: {
                    score: rScore,
                    total: rTotal,
                    passageBreakdown: rPassageBreakdown
                },
                writing: { score: 0, total: 9 },
                speaking: { score: 0, total: 9 }
            },
            estimatedBand,
            examinerFeedback: feedback,
            status
        });

        const saved = await newSubmission.save();
        res.status(201).json(saved);

        // Auto-trigger AI grading only if exam has aiGradingEnabled = true
        const savedId = saved._id.toString();
        if (examDoc.aiGradingEnabled) {
            if (hasWriting)           runWritingGrading(savedId).catch(err => console.error('[AI] Writing error:', err.message));
            if (speakingAudioUrl)     runSpeakingGrading(savedId).catch(err => console.error('[AI] Speaking error:', err.message));
            if (speakingParts.length) runSpeakingPartsGrading(savedId).catch(err => console.error('[AI] Speaking parts error:', err.message));
            if (speakingTexts.length) runSpeakingTextGrading(savedId).catch(err => console.error('[AI] Speaking text error:', err.message));
        }
    } catch (error) {
        console.error('Submission error:', error);
        res.status(400).json({ error: error.message });
    }
};

export const updateSubmission = async (req, res) => {
    try {
        const { examinerFeedback, writingBand, speakingBand, status } = req.body;
        const sub = await Submission.findById(req.params.id);
        if (!sub) return res.status(404).json({ error: 'Submission not found' });

        if (examinerFeedback) {
            sub.examinerFeedback = {
                strengths: examinerFeedback.strengths ?? sub.examinerFeedback?.strengths ?? '',
                weaknesses: examinerFeedback.weaknesses ?? sub.examinerFeedback?.weaknesses ?? '',
                recommendation: examinerFeedback.recommendation ?? sub.examinerFeedback?.recommendation ?? ''
            };
        }

        if (writingBand !== undefined && writingBand !== '') {
            sub.moduleScores = {
                ...sub.moduleScores.toObject?.() ?? sub.moduleScores,
                writing: { score: parseFloat(writingBand) || 0, total: 9 }
            };
            sub.markModified('moduleScores');
        }

        if (speakingBand !== undefined && speakingBand !== '') {
            const current = sub.moduleScores?.toObject?.() ?? { ...sub.moduleScores };
            sub.moduleScores = {
                ...current,
                speaking: { score: parseFloat(speakingBand) || 0, total: 9 }
            };
            sub.markModified('moduleScores');
        }

        if (status) sub.status = status;

        // Recalculate estimatedBand including writing/speaking if graded
        const bands = [];
        const ms = sub.moduleScores;
        if (ms?.listening?.total > 0) bands.push(calculateIELTSBand(ms.listening.score, ms.listening.total));
        if (ms?.reading?.total > 0) bands.push(calculateIELTSBand(ms.reading.score, ms.reading.total));
        if (ms?.writing?.score > 0) bands.push(ms.writing.score);
        if (ms?.speaking?.score > 0) bands.push(ms.speaking.score);
        if (bands.length > 0) {
            const avg = bands.reduce((a, b) => a + b, 0) / bands.length;
            sub.estimatedBand = Math.round(avg * 2) / 2;
        }

        await sub.save();
        const updated = await Submission.findById(sub._id)
            .populate('user', 'name email')
            .populate('exam', 'title');
        res.json(updated);
    } catch (error) {
        console.error('Update submission error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getUserSubmissions = async (req, res) => {
    try {
        const submissions = await Submission.find({ user: req.params.userId })
            .populate('exam', 'title testLevel')
            .sort({ submittedAt: -1 });
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllSubmissions = async (req, res) => {
    try {
        const submissions = await Submission.find()
            .populate('user', 'name email')
            .populate('exam', 'title')
            .sort({ submittedAt: -1 });
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getSubmissionById = async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.id)
            .populate('exam')
            .populate('user', 'name email');
        if (!submission) return res.status(404).json({ error: 'Submission not found' });
        res.json(submission);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteSubmission = async (req, res) => {
    try {
        await Submission.findByIdAndDelete(req.params.id);
        res.json({ message: 'Submission deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
