// server/src/routes/message.route.ts

import { Router } from 'express';
import multer from 'multer';
import { getAllContacts, getMessages, uploadFile } from '../controllers/message.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/contacts', protectRoute, getAllContacts);
router.get('/:userId', protectRoute, getMessages);
router.post('/upload', protectRoute, upload.single('image'), uploadFile);

export default router;
