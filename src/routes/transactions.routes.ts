import { Router } from 'express';
import { createTransaction, uploadTransactionFile, getTransaction, upload } from '../controllers/transactions.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { createTransactionSchema } from '../utils/schemas';

export const transactionsRouter = Router();

transactionsRouter.use(authenticate);

transactionsRouter.post('/', requireAdmin, validate(createTransactionSchema), createTransaction);
transactionsRouter.get('/:id', getTransaction);
transactionsRouter.post('/:id/upload', requireAdmin, upload.single('file'), uploadTransactionFile);
