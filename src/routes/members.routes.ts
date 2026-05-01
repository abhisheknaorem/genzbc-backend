import { Router } from 'express';
import { listMembers, getMember, createMember, updateMember, deleteMember } from '../controllers/members.controller';
import { listTransactions } from '../controllers/transactions.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { createMemberSchema, updateMemberSchema } from '../utils/schemas';

export const membersRouter = Router();

membersRouter.use(authenticate);

membersRouter.get('/', listMembers);
membersRouter.post('/', requireAdmin, validate(createMemberSchema), createMember);
membersRouter.get('/:id', getMember);
membersRouter.put('/:id', requireAdmin, validate(updateMemberSchema), updateMember);
membersRouter.delete('/:id', requireAdmin, deleteMember);
membersRouter.get('/:id/transactions', listTransactions);
