import UsageLog, { PRICING } from '../models/UsageLog.js';

// Log a chat completion call
export async function trackChat({ model = 'gpt-4o', inputTokens = 0, outputTokens = 0, context = '', userId = null }) {
    try {
        const p       = PRICING[model] || PRICING['gpt-4o'];
        const costUsd = inputTokens * p.input + outputTokens * p.output;
        await UsageLog.create({ service: 'chat', model, inputTokens, outputTokens, costUsd, context, userId });
    } catch (err) {
        console.error('usageTracker.trackChat error:', err.message);
    }
}

// Log a Whisper transcription call
// durationSec: audio length in seconds (estimate from file size if unknown)
export async function trackWhisper({ durationSec = 0, context = '', userId = null }) {
    try {
        const minutes = durationSec / 60;
        const costUsd = minutes * PRICING['whisper-1'].perMinute;
        await UsageLog.create({
            service: 'whisper', model: 'whisper-1',
            audioDurationSec: durationSec, costUsd, context, userId,
        });
    } catch (err) {
        console.error('usageTracker.trackWhisper error:', err.message);
    }
}

// Log a TTS call
export async function trackTTS({ characters = 0, context = 'tts', userId = null }) {
    try {
        const costUsd = characters * PRICING['tts-1'].perChar;
        await UsageLog.create({ service: 'tts', model: 'tts-1', characters, costUsd, context, userId });
    } catch (err) {
        console.error('usageTracker.trackTTS error:', err.message);
    }
}

// Aggregate stats for a given date range
export async function getUsageStats({ startDate, endDate } = {}) {
    const match = {};
    if (startDate || endDate) {
        match.createdAt = {};
        if (startDate) match.createdAt.$gte = new Date(startDate);
        if (endDate)   match.createdAt.$lte = new Date(endDate);
    }

    const [totals, byService, recent] = await Promise.all([
        // Total cost
        UsageLog.aggregate([
            { $match: match },
            { $group: { _id: null, totalCost: { $sum: '$costUsd' }, count: { $sum: 1 } } },
        ]),

        // Cost broken down by service
        UsageLog.aggregate([
            { $match: match },
            { $group: { _id: '$service', cost: { $sum: '$costUsd' }, count: { $sum: 1 } } },
        ]),

        // Last 10 entries
        UsageLog.find(match).sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    const totalCost = totals[0]?.totalCost ?? 0;
    const breakdown = {};
    byService.forEach(s => { breakdown[s._id] = { cost: s.cost, count: s.count }; });

    return { totalCost, breakdown, recentLogs: recent };
}
