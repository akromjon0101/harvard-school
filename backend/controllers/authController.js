import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
    }
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

const sendTokenResponse = (user, statusCode, res) => {
    const token = generateToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax'
    };

    res.status(statusCode)
        .cookie('token', token, cookieOptions)
        .json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
};

export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ error: 'User already exists' });

        user = new User({ name, email, password, role: role || 'student' });
        await user.save();

        sendTokenResponse(user, 201, res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (user.status === 'blocked') {
            return res.status(403).json({ error: 'Your account has been blocked. Please contact support.' });
        }

        // Track last login
        user.lastLogin = new Date();
        await user.save();

        sendTokenResponse(user, 200, res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const logout = async (req, res) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({ success: true, message: 'Logged out successfully' });
};

export const updateProfile = async (req, res) => {
    try {
        const { name, email, currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const ok = await user.matchPassword(currentPassword);
        if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });

        if (email && email !== user.email) {
            const exists = await User.findOne({ email });
            if (exists) return res.status(400).json({ error: 'Email already in use' });
            user.email = email;
        }
        if (name) user.name = name;
        if (newPassword) user.password = newPassword;

        await user.save();
        const updated = { id: user._id, name: user.name, email: user.email, role: user.role };
        res.json({ user: updated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
