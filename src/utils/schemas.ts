import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createMemberSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email').optional().or(z.literal('')).transform(v => v || undefined),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
});

export const updateMemberSchema = createMemberSchema.partial();

export const createTransactionSchema = z.object({
  memberId: z.string().cuid('Invalid member ID'),
  amount: z.coerce.number().positive('Amount must be positive'),
  type: z.enum(['credit', 'debit']),
  description: z.string().max(500).optional(),
  date: z.string().datetime({ offset: true }).or(z.string().date()),
});

export const createTermsSchema = z.object({
  content: z.string().min(1, 'Content is required'),
});
