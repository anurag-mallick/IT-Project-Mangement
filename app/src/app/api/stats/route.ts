import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { subDays } from 'date-fns';

export const GET = withAuth(async () => {
  try {
    const [
      total,
      statusGroups,
      priorityGroups,
      slaBreached,
      recentTickets
    ] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      prisma.ticket.groupBy({
        by: ['priority'],
        _count: { priority: true }
      }),
      prisma.ticket.count({
        where: {
          slaBreachAt: { lt: new Date() },
          status: { notIn: ['RESOLVED', 'CLOSED'] }
        }
      }),
      prisma.ticket.findMany({
        where: { createdAt: { gte: subDays(new Date(), 7) } },
        select: { createdAt: true }
      })
    ]);

    return NextResponse.json({
      total,
      statusGroups,
      priorityGroups,
      slaBreached,
      recentTickets
    });
  } catch (error: any) {
    // Fix 3: Deleted DATABASE_URL logging line
    console.error('Stats fetch error:');
    if (error.message) console.error('Error MESSAGE:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
