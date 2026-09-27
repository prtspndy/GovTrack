import { Router } from 'express';
import { register, login, getMe, updateProfile, logout } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticateToken as any, getMe as any);
router.patch('/profile', authenticateToken as any, updateProfile as any);

export default router;
