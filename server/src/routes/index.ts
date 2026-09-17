import { Router } from 'express';
import authRoutes from './authRoutes';
import googleRoutes from './googleRoutes';
import interviewRoutes from './interviewRoutes';
import candidateRoutes from './candidateRoutes';
import scheduleRoutes from './scheduleRoutes';
import templateRoutes from './templateRoutes';
import feedbackRoutes from './feedbackRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/google', googleRoutes);
router.use('/interviews', interviewRoutes);
router.use('/candidates', candidateRoutes);
router.use('/schedule', scheduleRoutes);
router.use('/templates', templateRoutes);
router.use('/feedback', feedbackRoutes);


export default router;
