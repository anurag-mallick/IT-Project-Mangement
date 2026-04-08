export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get('ticketId');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    const where: any = {};
    if (ticketId) where.ticketId = parseInt(ticketId);

    const [communications, total] = await Promise.all([
      prisma.communication.findMany({
        where,
        include: { ticket: { select: { id: true, title: true } }, customer: { select: { id: true, email: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.communication.count({ where })
    ]);

    return NextResponse.json({ communications, total, page, pageSize });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch communications' }, { status: 500 });
  }
});
