import { Router } from 'express';
import { getAuthUrl, handleCallback, disconnectCalendar, getCalendarStatus } from '../controllers/googleController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

router.get('/auth', authenticateUser, getAuthUrl);
router.get('/callback', handleCallback);
router.post('/disconnect', authenticateUser, disconnectCalendar);
router.get('/status', authenticateUser, getCalendarStatus);

export default router;
