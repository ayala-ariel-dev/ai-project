import express from 'express';

import {
  analyzeMultipleChoice,
  analyzeTrueFalse,
} from '../controllers/study.controller.js';

const router = express.Router();

router.post('/quiz/multiple-choice', analyzeMultipleChoice);
router.post('/quiz/true-false', analyzeTrueFalse);


export default router;