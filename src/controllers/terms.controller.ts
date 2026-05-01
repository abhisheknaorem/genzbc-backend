import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { NotFoundError } from '../utils/errors';

export async function getTerms(req: Request, res: Response) {
  const memberId = req.params.id as string;
  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) throw new NotFoundError('Member');

  const terms = await prisma.termsCondition.findMany({
    where: { memberId }, orderBy: { version: 'desc' },
  });

  res.json({ success: true, data: { current: terms[0] || null, history: terms } });
}

export async function createTerms(req: Request, res: Response) {
  const memberId = req.params.id as string;
  const { content } = req.body;

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) throw new NotFoundError('Member');

  const latest = await prisma.termsCondition.findFirst({
    where: { memberId }, orderBy: { version: 'desc' },
  });

  const nextVersion = (latest?.version ?? 0) + 1;

  const terms = await prisma.termsCondition.create({
    data: { memberId, content, version: nextVersion },
  });

  res.status(201).json({ success: true, message: `Terms saved as version ${nextVersion}`, data: terms });
}
