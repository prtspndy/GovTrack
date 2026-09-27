import { Router } from 'express';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken as any);

router.get('/', getNotifications as any);
router.patch('/:id/read', markAsRead as any);
router.patch('/read-all', markAllAsRead as any);

export default router;
