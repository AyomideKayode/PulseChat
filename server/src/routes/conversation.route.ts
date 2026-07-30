// server/src/routes/conversation.route.ts

import { Router } from 'express';
import { getConversations, getOrCreateConversation } from '../controllers/message.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', protectRoute, getConversations);
router.post('/:userId', protectRoute, getOrCreateConversation);

export default router;
