export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get('ticketId');
    const userId = searchParams.get('userId');

    const where: any = {};
    if (ticketId) where.ticketId = parseInt(ticketId);
    if (userId) where.userId = parseInt(userId);

    const entries = await prisma.ticketTimeEntry.findMany({
      where,
      include: { user: { select: { id: true, username: true, name: true } } },
      orderBy: { startTime: 'desc' }
    });
    return NextResponse.json({ entries });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch time entries' }, { status: 500 });
  }
});

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { ticketId, startTime, endTime, description, isBillable } = await req.json();
    if (!ticketId || !startTime) return NextResponse.json({ error: 'Ticket ID and start time required' }, { status: 400 });

    const dbUser = await prisma.user.findFirst({ where: { username: user.email } });
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : null;
    const duration = end ? Math.floor((end.getTime() - start.getTime()) / 60000) : 0;

    const entry = await prisma.ticketTimeEntry.create({
      data: {
        ticketId, startTime: start, endTime: end, duration, description,
        isBillable: isBillable || false, userId: dbUser?.id
      },
      include: { user: { select: { id: true, username: true, name: true } } }
    });

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { timeSpent: { increment: duration } }
    });

    return NextResponse.json(entry);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create time entry' }, { status: 500 });
  }
});
