import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    exam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    moduleScores: {
        listening: {
            score: Number,
            total: Number,
            sectionBreakdown: [Number],
            weakSkills: [String]
        },
        reading: {
            score: Number,
            total: Number,
            passageBreakdown: [Number]
        },
        writing: { score: Number, total: Number },
        speaking: { score: Number, total: Number }
    },
    estimatedBand: Number,
    answers: mongoose.Schema.Types.Mixed,
    // Extracted writing task answers (writing_0, writing_1, ...)
    writingTexts: [String],
    // Image URLs for each writing task (index-aligned with writingTexts)
    writingImages: [String],
    // Extracted speaking text answers (admin exam mode — speaking_text_0, etc.)
    speakingTexts: [String],
    // Speaking audio file URL if submitted (legacy — single file)
    speakingAudioUrl: { type: String, default: '' },
    // Speaking parts — one entry per spoken part (Part 1, 2, 3)
    speakingParts: [{
        partIndex:        { type: Number },
        questionIndex:    { type: Number, default: null }, // null = whole-part recording
        audioUrl:         { type: String },
        transcript:       { type: String, default: '' },
        transcriptStatus: { type: String, enum: ['pending', 'processing', 'done', 'error'], default: 'pending' },
    }],
    examinerFeedback: {
        strengths: String,
        weaknesses: String,
        recommendation: String
    },
    status: {
        type: String,
        enum: ['pending_review', 'checked', 'completed'],
        default: 'completed'
    },
    // ── AI grading results ───────────────────────────────────────────────
    aiGrading: {
        writing: [{
            taskIndex:        { type: Number },
            status:           { type: String, enum: ['pending', 'processing', 'done', 'error'], default: 'pending' },
            band:             { type: Number },
            wordCount:        { type: Number },
            criteria: {
                taskAchievement:  { band: Number, comment: String },
                coherenceCohesion:{ band: Number, comment: String },
                lexicalResource:  { band: Number, comment: String },
                grammaticalRange: { band: Number, comment: String },
            },
            strengths:        [String],
            weaknesses:       [String],
            improvementAdvice:[String],
            questionAnalysis: { type: String },
            relevanceCheck:   { type: String },
            chartType:        { type: String },
            keyDataPoints:    [String],
            dataAccuracy:     { type: String },
            feedback:         { type: String },
            gradedAt:         { type: Date },
            error:            { type: String },
        }],
        speaking: {
            status:           { type: String, enum: ['pending', 'processing', 'done', 'error'] },
            transcript:       { type: String },
            band:             { type: Number },
            criteria: {
                fluencyCoherence: { band: Number, comment: String },
                lexicalResource:  { band: Number, comment: String },
                grammaticalRange: { band: Number, comment: String },
                pronunciation:    { band: Number, comment: String },
            },
            strengths:        [String],
            weaknesses:       [String],
            improvementAdvice:[String],
            questionAnalysis: { type: String },
            relevanceCheck:   { type: String },
            feedback:         { type: String },
            gradedAt:         { type: Date },
            error:            { type: String },
        },
        speakingTexts: [{
            partIndex:        { type: Number },
            status:           { type: String, enum: ['pending', 'processing', 'done', 'error'], default: 'pending' },
            transcript:       { type: String },
            band:             { type: Number },
            criteria: {
                fluencyCoherence: { band: Number, comment: String },
                lexicalResource:  { band: Number, comment: String },
                grammaticalRange: { band: Number, comment: String },
                pronunciation:    { band: Number, comment: String },
            },
            strengths:        [String],
            weaknesses:       [String],
            improvementAdvice:[String],
            questionAnalysis: { type: String },
            relevanceCheck:   { type: String },
            feedback:         { type: String },
            gradedAt:         { type: Date },
            error:            { type: String },
        }]
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: false });

submissionSchema.index({ user: 1, submittedAt: -1 });
submissionSchema.index({ exam: 1 });
submissionSchema.index({ status: 1 });

export default mongoose.model('Submission', submissionSchema);
