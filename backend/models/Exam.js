import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    questionNumber: { type: Number, required: true },
    startNumber: Number,
    type: { type: String, required: true },
    questionText: String,
    options: [String],
    correctAnswer: String,
    correctAnswers: [String],
    matchingItems: [String],
    image: String,
    placement: { type: String, default: 'below' },
    tableData: { type: mongoose.Schema.Types.Mixed },
    boxTitle: String,  // e.g. "Information" for choose-from-box
    instructionText: String
});

const sectionSchema = new mongoose.Schema({
    title: String,
    instructions: String,
    questionRange: String,
    passageContent: String,
    media: [{
        type: { type: String, enum: ['image', 'audio'] },
        url: String
    }],
    questions: [questionSchema]
});

const examSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    aiGradingEnabled: { type: Boolean, default: false },
    modules: {
        listening: [sectionSchema],
        reading: [sectionSchema],
        writing: [sectionSchema],
        speaking: [sectionSchema]
    },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Exam', examSchema);
