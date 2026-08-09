import { Router } from 'express';
import { body } from 'express-validator';
import { createTemplate, getTemplates, getTemplateById, deleteTemplate } from '../controllers/templateController';
import { authenticateUser } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticateUser);

router.post(
  '/',
  [
    body('title').notEmpty().withMessage('Template title is required'),
    body('duration').isNumeric().withMessage('Duration must be a number'),
  ],
  validate,
  createTemplate
);

router.get('/', getTemplates);
router.get('/:id', getTemplateById);
router.delete('/:id', deleteTemplate);

export default router;
