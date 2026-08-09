import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, logout, getMe, candidateLogin } from '../controllers/authController';
import { authenticateUser } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

router.post(
  '/candidate/login',
  [body('email').isEmail().withMessage('Valid email is required')],
  validate,
  candidateLogin
);

router.post('/logout', logout);
router.get('/me', authenticateUser, getMe);

export default router;
