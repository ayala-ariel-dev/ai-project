import express from 'express';
import { getCurrentUser, loginWithGoogle } from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/google', loginWithGoogle);
router.get('/me', requireAuth, getCurrentUser);

export default router;
