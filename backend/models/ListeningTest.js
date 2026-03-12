import mongoose from 'mongoose';

const listeningQuestionSchema = new mongoose.Schema({
    questionNumber: {
        type: Number,
        required: true
    },
    questionType: {
        type: String,
        enum: [
            'mcq-single',           // Multiple Choice - Single Answer
            'mcq-multiple',         // Multiple Choice - Multiple Answers
            'matching',             // Matching
            'map-labelling',        // Map Labelling
            'plan-labelling',       // Plan Labelling
            'diagram-labelling',    // Diagram Labelling
            'form-completion',      // Form Completion
            'note-completion',      // Note Completion
            'table-completion',     // Table Completion
            'flowchart-completion', // Flow-chart Completion
            'sentence-completion',  // Sentence Completion
            'short-answer',         // Short-answer Questions
            'diagram-completion',   // Diagram Completion
            'picture-choice',       // Picture Selection (Visual MCQ)
            'classification',       // Classification
            'number-completion'     // Number Completion
        ],
        required: true
    },
    questionText: {
        type: String,
        required: true
    },

    // Multiple Choice fields (mcq-single, mcq-multiple)
    options: [String],
    numberOfAnswers: {
        type: Number,
        default: 1 // 1, 2, or 3 for multiple answers
    },

    // Matching fields
    items: [String], // Items to match
    matchOptions: [String], // Options to match with
    correctMatches: mongoose.Schema.Types.Mixed, // Object: { item: option }

    // Labelling fields (map, plan, diagram)
    imageUrl: String, // Base64 or URL
    labels: [{
        position: { x: Number, y: Number },
        labelNumber: Number
    }],

    // Completion fields (form, note, table, flowchart, sentence)
    templateType: String, // 'form', 'note', 'table', 'flowchart'
    template: mongoose.Schema.Types.Mixed, // String or structured object
    blanks: [{
        blankNumber: Number,
        position: String // Description of where the blank is
    }],
    maxWords: {
        type: Number,
        default: 3 // NO MORE THAN THREE WORDS AND/OR A NUMBER
    },

    // Sentence completion specific
    sentences: [String], // Sentences with blanks marked as ___

    // Picture choice fields
    pictureOptions: [String], // Array of image URLs/base64

    // Classification fields
    categories: [String], // Category names
    correctClassification: mongoose.Schema.Types.Mixed, // Object: { item: category }

    // Number completion fields
    acceptedFormats: [String], // e.g., ['£50', '50', 'fifty pounds']

    // Universal correct answer field (flexible for all types)
    correctAnswer: {
        type: mongoose.Schema.Types.Mixed, // String, Array, or Object depending on type
        required: true
    },

    // Additional metadata
    section: {
        type: Number,
        min: 1,
        max: 4,
        default: 1
    },
    points: {
        type: Number,
        default: 1
    }
});

const listeningTestSchema = new mongoose.Schema({
    testName: {
        type: String,
        required: true
    },
    description: String,
    // Separate audio files for each section
    section1Audio: { type: String, required: false },
    section2Audio: { type: String, required: false },
    section3Audio: { type: String, required: false },
    section4Audio: { type: String, required: false },
    // Keep legacy audioUrl for backward compatibility if needed, or remove it
    audioUrl: { type: String, required: false },
    questions: [listeningQuestionSchema],
    duration: {
        type: Number,
        default: 30 // minutes
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

listeningTestSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.model('ListeningTest', listeningTestSchema);
