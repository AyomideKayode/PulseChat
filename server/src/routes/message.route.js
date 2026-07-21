// server/src/routes/message.route.js
import express from 'express';
import { getAllContacts } from '../controllers/message.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

// get all messages for a conversation
router.get('/contacts', protectRoute, getAllContacts);
// router.get('/chats', getChatPartners);
// router.get('/:id', getMessagesByUserId);

// router.get('/send', sendMessage);

// router.get('/receive', (req, res) => {
//   res.send('Receive Message Endpoint');
// });

export default router;
