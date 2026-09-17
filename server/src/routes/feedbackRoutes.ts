import { Router } from 'express';
import { body } from 'express-validator';
import {
  submitFeedback,
  getFeedbackForInterview,
  getMyFeedbackForInterview,
  getFeedbackForCandidate,
  deleteFeedback,
} from '../controllers/feedbackController';
import { authenticateUser } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// All feedback operations require authenticated user (Recruiter / Interviewer / Admin)
router.use(authenticateUser);

router.post(
  '/',
  [
    body('interviewId').notEmpty().withMessage('interviewId is required'),
    body('overallRecommendation')
      .isIn(['STRONG_YES', 'YES', 'NEUTRAL', 'NO', 'STRONG_NO'])
      .withMessage('Valid overallRecommendation is required'),
    body('notes').notEmpty().withMessage('Evaluation notes are required'),
  ],
  validate,
  submitFeedback
);

router.get('/interview/:interviewId', getFeedbackForInterview);
router.get('/interview/:interviewId/mine', getMyFeedbackForInterview);
router.get('/candidate/:candidateId', getFeedbackForCandidate);
router.delete('/:id', deleteFeedback);

export default router;
