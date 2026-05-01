import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { NotFoundError } from '../utils/errors';

export async function listMembers(req: Request, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
  const search = (req.query.search as string) || '';
  const skip = (page - 1) * limit;

  const where = search ? {
    OR: [
      { name: { contains: search, mode: 'insensitive' as const } },
      { email: { contains: search, mode: 'insensitive' as const } },
      { phone: { contains: search, mode: 'insensitive' as const } },
    ],
  } : {};

  const [members, total] = await Promise.all([
    prisma.member.findMany({
      where, skip, take: limit, orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, name: true } },
        _count: { select: { transactions: true } },
      },
    }),
    prisma.member.count({ where }),
  ]);

  res.json({
    success: true, data: members,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

export async function getMember(req: Request, res: Response) {
  const id = req.params.id as string;
  const member = await prisma.member.findUnique({
    where: { id },
    include: { creator: { select: { id: true, name: true } }, _count: { select: { transactions: true } } },
  });
  if (!member) throw new NotFoundError('Member');
  res.json({ success: true, data: member });
}

export async function createMember(req: Request, res: Response) {
  const { name, email, phone, address } = req.body;
  const member = await prisma.member.create({
    data: { name, email, phone, address, createdBy: req.user!.userId },
    include: { creator: { select: { id: true, name: true } } },
  });
  res.status(201).json({ success: true, message: 'Member created successfully', data: member });
}

export async function updateMember(req: Request, res: Response) {
  const id = req.params.id as string;
  const { name, email, phone, address } = req.body;
  const existing = await prisma.member.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Member');
  const member = await prisma.member.update({
    where: { id }, data: { name, email, phone, address },
    include: { creator: { select: { id: true, name: true } } },
  });
  res.json({ success: true, message: 'Member updated successfully', data: member });
}

export async function deleteMember(req: Request, res: Response) {
  const id = req.params.id as string;
  const existing = await prisma.member.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Member');
  await prisma.member.delete({ where: { id } });
  res.json({ success: true, message: 'Member deleted successfully' });
}
