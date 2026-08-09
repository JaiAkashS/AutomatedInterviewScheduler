import { Router } from 'express';
import { body } from 'express-validator';
import {
  createInterview,
  getInterviews,
  getInterviewById,
  cancelInterview,
  rescheduleInterviewRequest,
  deleteInterview,
} from '../controllers/interviewController';
import { authenticateUser } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticateUser);

router.post(
  '/',
  [
    body('title').notEmpty().withMessage('Interview title is required'),
    body('duration').isNumeric().withMessage('Duration must be a number'),
  ],
  validate,
  createInterview
);

router.get('/', getInterviews);
router.get('/:id', getInterviewById);
router.post('/:id/cancel', cancelInterview);
router.post('/:id/reschedule', rescheduleInterviewRequest);
router.delete('/:id', deleteInterview);

export default router;
