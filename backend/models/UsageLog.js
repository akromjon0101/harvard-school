import mongoose from 'mongoose';

// OpenAI pricing (per unit)
export const PRICING = {
    'gpt-4o':          { input: 2.50  / 1_000_000, output: 10.00 / 1_000_000 }, // per token
    'gpt-4o-mini':     { input: 0.150 / 1_000_000, output: 0.600 / 1_000_000 },
    'whisper-1':       { perMinute: 0.006 },   // per audio minute
    'tts-1':           { perChar:   0.000015 }, // $15 / 1M chars
    'tts-1-hd':        { perChar:   0.000030 }, // $30 / 1M chars
};

const usageLogSchema = new mongoose.Schema({
    // Which OpenAI service
    service: {
        type: String,
        enum: ['chat', 'whisper', 'tts'],
        required: true,
    },
    model: { type: String, required: true },

    // Token counts (chat)
    inputTokens:  { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },

    // Audio duration in seconds (whisper)
    audioDurationSec: { type: Number, default: 0 },

    // Characters (tts)
    characters: { type: Number, default: 0 },

    // Calculated cost in USD
    costUsd: { type: Number, required: true },

    // Context
    context: { type: String, default: '' }, // e.g. 'writing_grade', 'speaking_transcribe', 'tts'
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    createdAt: { type: Date, default: Date.now },
});

usageLogSchema.index({ createdAt: -1 });
usageLogSchema.index({ service: 1, createdAt: -1 });

export default mongoose.model('UsageLog', usageLogSchema);
