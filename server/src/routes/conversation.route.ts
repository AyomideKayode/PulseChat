// server/src/routes/conversation.route.ts

import { Router } from 'express'
import { getConversations } from '../controllers/message.controller.js'
import { protectRoute } from '../middleware/auth.middleware.js'

const router = Router()

router.get('/', protectRoute, getConversations)

export default router
