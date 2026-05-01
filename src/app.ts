import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import { authRouter } from './routes/auth.routes';
import { membersRouter } from './routes/members.routes';
import { transactionsRouter } from './routes/transactions.routes';
import { termsRouter } from './routes/terms.routes';
import { errorHandler } from './middleware/error.middleware';
import { notFound } from './middleware/notfound.middleware';

dotenv.config();

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRouter);
app.use('/members', membersRouter);
app.use('/transactions', transactionsRouter);
app.use('/members', termsRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
