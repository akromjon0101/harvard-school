import express from 'express';
import { adminAuth } from '../middleware/auth.js';
import { getUsageStats } from '../services/usageTracker.js';
import AppSettings from '../models/AppSettings.js';

const router = express.Router();

// Helper — get or create settings doc
async function getSettings() {
    let s = await AppSettings.findById('main');
    if (!s) s = await AppSettings.create({ _id: 'main' });
    return s;
}

// GET /api/openai-usage
router.get('/', adminAuth, async (req, res) => {
    try {
        const now       = new Date();
        const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

        const [stats, settings] = await Promise.all([
            getUsageStats({ startDate }),
            getSettings(),
        ]);

        const budget    = settings.openaiMonthlyBudget;
        const used      = stats.totalCost;
        const remaining = Math.max(0, budget - used);
        const usagePct  = budget > 0 ? Math.round((used / budget) * 100) : 0;

        res.json({
            monthlyUsage: used,
            hardLimit:    budget,
            remaining,
            usagePct,
            breakdown:  stats.breakdown,
            recentLogs: stats.recentLogs,
            period:     { start: startDate, end: now.toISOString().split('T')[0] },
        });
    } catch (err) {
        console.error('openai-usage GET error:', err.message);
        res.status(500).json({ error: 'Unable to fetch usage data' });
    }
});

// PUT /api/openai-usage/budget  — update monthly budget
router.put('/budget', adminAuth, async (req, res) => {
    const { budget } = req.body;
    const val = parseFloat(budget);

    if (isNaN(val) || val <= 0) {
        return res.status(400).json({ error: 'Budget must be a positive number' });
    }

    try {
        await AppSettings.findByIdAndUpdate(
            'main',
            { openaiMonthlyBudget: val },
            { upsert: true, new: true }
        );
        res.json({ ok: true, budget: val });
    } catch (err) {
        console.error('openai-usage PUT budget error:', err.message);
        res.status(500).json({ error: 'Failed to update budget' });
    }
});

export default router;
