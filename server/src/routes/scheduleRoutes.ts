import { Router } from 'express';
import { body } from 'express-validator';
import {
  getInterviewByToken,
  getSlotsByToken,
  confirmSlotByToken,
  rescheduleByToken,
  cancelByToken,
} from '../controllers/scheduleController';
import { validate } from '../middleware/validate';

const router = Router();

// Candidate public endpoints (unauthenticated, token-protected)
router.get('/:token', getInterviewByToken);
router.get('/:token/slots', getSlotsByToken);

router.post(
  '/:token/confirm',
  [
    body('start').notEmpty().withMessage('Start time is required'),
    body('end').notEmpty().withMessage('End time is required'),
  ],
  validate,
  confirmSlotByToken
);

router.post('/:token/reschedule', rescheduleByToken);
router.post('/:token/cancel', cancelByToken);

export default router;
