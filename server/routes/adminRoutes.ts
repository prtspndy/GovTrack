import { Router } from 'express';
import {
  getAllRequests,
  getRequestById,
  updateRequestStatus,
  verifyDocument,
  requestAdditionalDocument,
  uploadFinalDocument,
  getDashboardStats,
  getUsers,
  toggleUserStatus,
  getAuditLogs
} from '../controllers/adminController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/role.js';
import { uploadMiddleware } from '../middleware/upload.js';

const router = Router();

// Secure all admin routes
router.use(authenticateToken as any);
router.use(authorizeRoles('admin') as any);

router.get('/requests', getAllRequests as any);
router.get('/requests/:id', getRequestById as any);
router.patch('/requests/:id/status', updateRequestStatus as any);
router.patch('/requests/:id/documents/:documentId/verify', verifyDocument as any);
router.post('/requests/:id/additional-document', requestAdditionalDocument as any);
router.post('/requests/:id/final-document', uploadMiddleware.single('file'), uploadFinalDocument as any);

router.get('/dashboard', getDashboardStats as any);
router.get('/users', getUsers as any);
router.patch('/users/:id/status', toggleUserStatus as any);
router.get('/audit-logs', getAuditLogs as any);

export default router;
