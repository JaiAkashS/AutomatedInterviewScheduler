import { Router } from 'express';
import { body } from 'express-validator';
import { createCandidate, getCandidates, getCandidateById, getMyInterviews } from '../controllers/candidateController';
import { authenticateUser } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticateUser);

router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Candidate name is required'),
    body('email').isEmail().withMessage('Valid candidate email is required'),
  ],
  validate,
  createCandidate
);

router.get('/my-interviews', getMyInterviews);
router.get('/', getCandidates);
router.get('/:id', getCandidateById);

export default router;
