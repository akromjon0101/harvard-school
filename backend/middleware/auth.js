import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load .env here too — ES module imports are resolved before server.js runs dotenv.config()
dotenv.config();

export const auth = async (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (token) {
        try {

            // No fallback - fail fast if JWT_SECRET is missing
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ error: 'User not found' });
            }

            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Token expired' });
            }
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ error: 'Invalid token' });
            }
            console.error('Auth error:', error);
            res.status(401).json({ error: 'Not authorized' });
        }
    } else {
        res.status(401).json({ error: 'No token provided' });
    }
};

export const adminAuth = async (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (token) {
        try {

            // No fallback - fail fast if JWT_SECRET is missing
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }

            if (user.role !== 'admin') {
                return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
            }

            req.user = user;
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Token expired' });
            }
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ error: 'Invalid token' });
            }
            console.error('Admin auth error:', error);
            res.status(401).json({ error: 'Not authorized' });
        }
    } else {
        res.status(401).json({ error: 'No token provided' });
    }
};
