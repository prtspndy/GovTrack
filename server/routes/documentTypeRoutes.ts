import { Router } from 'express';
import {
  getAllDocumentTypes,
  getDocumentTypeById,
  createDocumentType,
  updateDocumentType,
  toggleDocumentTypeStatus
} from '../controllers/documentTypeController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/role.js';

const router = Router();

// Public / Citizen
router.get('/', getAllDocumentTypes);
router.get('/:id', getDocumentTypeById);

// Admin only
router.post('/', authenticateToken as any, authorizeRoles('admin') as any, createDocumentType as any);
router.put('/:id', authenticateToken as any, authorizeRoles('admin') as any, updateDocumentType as any);
router.patch('/:id/status', authenticateToken as any, authorizeRoles('admin') as any, toggleDocumentTypeStatus as any);

export default router;
