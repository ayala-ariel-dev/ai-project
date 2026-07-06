import express from 'express';
import { startRolePlay, sendRolePlayMessage, getFeedback } from '../controllers/rolePlay.controller.js';

const router = express.Router();

router.post('/', startRolePlay);            // להתחלת סשן
router.post('/message', sendRolePlayMessage); // שליחת הודעה במשחק
router.post('/feedback', getFeedback);       // קבלת משוב על הבנת המשתמש

export default router;
