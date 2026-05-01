import { Request, Response } from 'express';
import multer from 'multer';
import { prisma } from '../utils/prisma';
import { NotFoundError, AppError } from '../utils/errors';
import { uploadFile, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '../services/storage.service';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(`Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`, 400));
    }
  },
});

export async function listTransactions(req: Request, res: Response) {
  const memberId = req.params.id as string;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
  const skip = (page - 1) * limit;

  const type = req.query.type as string | undefined;
  const dateFrom = req.query.dateFrom as string | undefined;
  const dateTo = req.query.dateTo as string | undefined;
  const minAmount = req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined;
  const maxAmount = req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined;

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) throw new NotFoundError('Member');

  const where: Record<string, unknown> = { memberId };
  if (type === 'credit' || type === 'debit') where.type = type;
  if (dateFrom || dateTo) {
    where.date = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    };
  }
  if (minAmount !== undefined || maxAmount !== undefined) {
    where.amount = {
      ...(minAmount !== undefined ? { gte: minAmount } : {}),
      ...(maxAmount !== undefined ? { lte: maxAmount } : {}),
    };
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where, skip, take: limit, orderBy: { date: 'desc' },
      include: { files: true, creator: { select: { id: true, name: true } } },
    }),
    prisma.transaction.count({ where }),
  ]);

  res.json({
    success: true, data: transactions,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

export async function createTransaction(req: Request, res: Response) {
  const { memberId, amount, type, description, date } = req.body;
  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) throw new NotFoundError('Member');

  const transaction = await prisma.transaction.create({
    data: { memberId, amount, type, description, date: new Date(date), createdBy: req.user!.userId },
    include: { files: true, creator: { select: { id: true, name: true } } },
  });

  res.status(201).json({ success: true, message: 'Transaction created successfully', data: transaction });
}

export async function uploadTransactionFile(req: Request, res: Response) {
  const transactionId = req.params.id as string;
  const file = req.file;
  if (!file) throw new AppError('No file uploaded', 400);

  const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!transaction) throw new NotFoundError('Transaction');

  const { fileKey, fileUrl } = await uploadFile(file.buffer, file.originalname, file.mimetype, 'transactions');

  const transactionFile = await prisma.transactionFile.create({
    data: { transactionId, fileUrl, fileKey, fileType: file.mimetype, fileName: file.originalname, fileSize: file.size },
  });

  res.status(201).json({ success: true, message: 'File uploaded successfully', data: transactionFile });
}

export async function getTransaction(req: Request, res: Response) {
  const id = req.params.id as string;
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { files: true, creator: { select: { id: true, name: true } }, member: { select: { id: true, name: true } } },
  });
  if (!transaction) throw new NotFoundError('Transaction');
  res.json({ success: true, data: transaction });
}
