import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Submission from '../models/Submission.js';
import { adminAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/users — Admin only: list all users (no password)
router.get('/', adminAuth, async (req, res) => {
    try {
        const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/:id/stats — Admin only: user stats (tests, avg band)
router.get('/:id/stats', adminAuth, async (req, res) => {
    try {
        const submissions = await Submission.find({ user: req.params.id }, { estimatedBand: 1 });
        const totalTests = submissions.length;
        const avgScore = totalTests > 0
            ? Math.round((submissions.reduce((a, s) => a + (s.estimatedBand || 0), 0) / totalTests) * 10) / 10
            : 0;
        res.json({ totalTests, avgScore });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/users/:id/block — Admin only: toggle block/unblock
router.put('/:id/block', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id, { password: 0 });
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.role === 'admin') return res.status(403).json({ error: 'Cannot block admin users' });

        user.status = user.status === 'blocked' ? 'active' : 'blocked';
        await user.save();
        res.json({ message: `User ${user.status === 'blocked' ? 'blocked' : 'unblocked'}`, status: user.status });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/users/:id/reset-password — Admin only: set new password
router.post('/:id/reset-password', adminAuth, async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.password = newPassword; // pre-save hook will hash it
        await user.save();
        res.json({ message: 'Password reset successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/users/:id — Admin only: delete a user
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.role === 'admin') return res.status(403).json({ error: 'Cannot delete admin users' });
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
