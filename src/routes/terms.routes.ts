import { Router } from 'express';
import { getTerms, createTerms } from '../controllers/terms.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { createTermsSchema } from '../utils/schemas';

export const termsRouter = Router();

termsRouter.use(authenticate);

termsRouter.get('/:id/terms', getTerms);
termsRouter.post('/:id/terms', requireAdmin, validate(createTermsSchema), createTerms);
