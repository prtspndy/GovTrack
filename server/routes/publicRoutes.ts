import { Router } from 'express';
import { trackRequestPublic, getPublicDocumentTypes } from '../controllers/publicController.js';

const router = Router();

router.get('/track/:requestNumber', trackRequestPublic);
router.get('/document-types', getPublicDocumentTypes);

export default router;
