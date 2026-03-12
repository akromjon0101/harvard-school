import mongoose from 'mongoose';

// ─── Individual Question ───────────────────────────────────────────────────────
const questionSchema = new mongoose.Schema({
    questionNumber: { type: Number, required: true },

    questionType: {
        type: String,
        enum: [
            'multiple-choice',      // A/B/C/D radio
            'true-false-not-given', // TRUE / FALSE / NOT GIVEN
            'yes-no-not-given',     // YES / NO / NOT GIVEN
            'matching-headings',    // Match paragraph to heading
            'matching-information', // Match statement to paragraph letter
            'sentence-completion',  // Complete sentence, max N words
            'summary-completion',   // Fill gaps in a summary paragraph
            'short-answer',         // NO MORE THAN N WORDS
            'fill-blank',           // Generic gap-fill (legacy support)
            'matching',             // Match two column lists
            'table-completion',     // Fill cells in a table
            'diagram-completion',   // Label a diagram
            'note-completion',      // Complete notes
        ],
        required: true
    },

    // Used by most types as the stem / label
    questionText: { type: String, required: true },

    // ── Multiple Choice ──────────────────────────────────────────────────────
    options: [String],              // ['A. option text', 'B. option text', ...]
    numberOfAnswers: { type: Number, default: 1 }, // 1 = single, 2+ = multi-select

    // ── Matching Headings / Information ─────────────────────────────────────
    // For matching-headings: correctAnswer = heading letter e.g. 'v'
    // headingsList is stored at the questionGroup level (shared across questions)

    // ── Sentence / Summary / Note / Table / Diagram Completion ──────────────
    maxWords: { type: Number, default: 3 }, // NO MORE THAN N WORDS

    // ── Matching (two-column) ────────────────────────────────────────────────
    items: [String],             // left column
    matchOptions: [String],      // right column
    correctMatches: mongoose.Schema.Types.Mixed, // { item: matchOption }

    // ── Diagram Completion ───────────────────────────────────────────────────
    imageUrl: String,
    blanks: [{
        blankNumber: Number,
        label: String
    }],

    // ── Universal answer ─────────────────────────────────────────────────────
    correctAnswer: {
        type: mongoose.Schema.Types.Mixed, // String | String[]
        required: true
    },

    points: { type: Number, default: 1 }
});

// ─── Question Group ────────────────────────────────────────────────────────────
// Groups let us show shared instructions + heading lists once for a block of
// questions (e.g. "Questions 1–5: Complete the summary below.")
const questionGroupSchema = new mongoose.Schema({
    groupType: {
        type: String,
        enum: [
            'multiple-choice',
            'true-false-not-given',
            'yes-no-not-given',
            'matching-headings',
            'matching-information',
            'sentence-completion',
            'summary-completion',
            'short-answer',
            'fill-blank',
            'matching',
            'table-completion',
            'diagram-completion',
            'note-completion',
        ],
        required: true
    },

    // e.g. "Questions 1–5"
    questionRange: String,

    // Shown above the question block, e.g.
    // "Do the following statements agree with the information in Reading Passage 1?"
    instructions: String,

    // ── Matching Headings: shared heading bank ────────────────────────────────
    // [{ letter: 'i', text: 'The history of...' }, { letter: 'ii', text: '...' }]
    headingsList: [{
        letter: String,
        text: String
    }],

    // ── Summary Completion: shared paragraph with ___ blanks ─────────────────
    summaryText: String, // e.g. "Urban farms use ___ to grow crops without soil."

    // ── Diagram / Image shared across questions in this group ─────────────────
    imageUrl: String,

    questions: [questionSchema]
});

// ─── Passage ───────────────────────────────────────────────────────────────────
const passageSchema = new mongoose.Schema({
    passageNumber: { type: Number, required: true, min: 1, max: 3 },
    title: { type: String, required: true },
    content: { type: String, required: true }, // HTML / plain text

    // Structured question groups (replaces flat questions array)
    questionGroups: [questionGroupSchema],

    // Legacy flat questions (kept for backwards compatibility)
    questions: [questionSchema]
});

// ─── Reading Test ──────────────────────────────────────────────────────────────
const readingTestSchema = new mongoose.Schema({
    testName: { type: String, required: true },
    description: String,
    testType: { type: String, enum: ['academic', 'general'], default: 'academic' },
    passages: [passageSchema],
    duration: { type: Number, default: 60 },
    isPublished: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

readingTestSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.model('ReadingTest', readingTestSchema);
