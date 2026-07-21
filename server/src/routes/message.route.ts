// server/src/routes/message.route.ts

import { Router } from 'express';
import { getAllContacts } from '../controllers/message.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/contacts', protectRoute, getAllContacts);

export default router;
