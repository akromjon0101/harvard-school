import express from 'express';
import { register, login, logout, updateProfile, adminLogin } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/admin-login', adminLogin);
router.get('/logout', logout);
router.put('/profile', auth, updateProfile);

export default router;
