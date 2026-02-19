import express from 'express';
import {
  signup,
  login,
  logout,
  updateProfile,
} from '../controllers/auth.controller.js';

import { protectRoute } from '../middleware/auth.middleware.js';
import { arcjetProtection } from '../middleware/arcjet.middleware.js';

const router = express.Router();

router.use(arcjetProtection); // Apply Arcjet protection to all auth routes

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.put('/update-profile', protectRoute, updateProfile);
// check if user is authenticated
router.get('/check', protectRoute, (req, res) => {
  return res.status(200).json(req.user);
});

export default router;
