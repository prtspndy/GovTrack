import { Router } from 'express';
import {
  createRequest,
  getMyRequests,
  getRequestById,
  cancelRequest,
  uploadAdditionalDocument,
  downloadUploadedDocument,
  downloadFinalDocument
} from '../controllers/requestController.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadMiddleware } from '../middleware/upload.js';

const router = Router();

router.use(authenticateToken as any);

router.post('/', uploadMiddleware.any(), createRequest as any);
router.get('/my', getMyRequests as any);
router.get('/:id', getRequestById as any);
router.patch('/:id/cancel', cancelRequest as any);
router.post('/:id/documents', uploadMiddleware.single('file'), uploadAdditionalDocument as any);
router.get('/:id/documents/:documentId/download', downloadUploadedDocument as any);
router.get('/:id/final-document/download', downloadFinalDocument as any);

export default router;
