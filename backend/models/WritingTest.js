import mongoose from 'mongoose';

const writingTaskSchema = new mongoose.Schema({
    taskNumber: {
        type: Number,
        required: true,
        min: 1,
        max: 2
    },
    taskType: {
        type: String,
        enum: ['task1', 'task2'],
        required: true
    },
    questionText: {
        type: String,
        required: true
    },
    instructions: String,
    minWords: {
        type: Number,
        default: function () {
            return this.taskNumber === 1 ? 150 : 250;
        }
    }
});

const writingTestSchema = new mongoose.Schema({
    testName: {
        type: String,
        required: true
    },
    description: String,
    tasks: [writingTaskSchema],
    duration: {
        type: Number,
        default: 60 // minutes
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

writingTestSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.model('WritingTest', writingTestSchema);
