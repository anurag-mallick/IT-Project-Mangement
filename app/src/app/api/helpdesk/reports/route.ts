export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'summary';

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    if (type === 'summary') {
      const [total, open, resolved, byPriority, byStatus, recentActivity] = await Promise.all([
        prisma.ticket.count(),
        prisma.ticket.count({ where: { status: { in: ['TODO', 'IN_PROGRESS', 'AWAITING_USER'] } } }),
        prisma.ticket.count({ where: { status: { in: ['RESOLVED', 'CLOSED'] } } }),
        prisma.ticket.groupBy({ by: ['priority'], _count: { priority: true } }),
        prisma.ticket.groupBy({ by: ['status'], _count: { status: true } }),
        prisma.ticket.findMany({
          where: { createdAt: { gte: sevenDaysAgo } },
          select: { id: true, title: true, status: true, priority: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10
        })
      ]);

      return NextResponse.json({ total, open, resolved, byPriority, byStatus, recentActivity });
    }

    if (type === 'ticketsOverTime') {
      const tickets = await prisma.ticket.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true }
      });

      const grouped: Record<string, number> = {};
      tickets.forEach(t => {
        const date = t.createdAt.toISOString().split('T')[0];
        grouped[date] = (grouped[date] || 0) + 1;
      });

      return NextResponse.json({ data: grouped });
    }

    if (type === 'agentPerformance') {
      const agents = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'STAFF'] }, isActive: true },
        include: {
          _count: { select: { tickets: true } }
        }
      });

      const performance = await Promise.all(agents.map(async (agent) => {
        const resolved = await prisma.ticket.count({
          where: { assignedToId: agent.id, status: 'RESOLVED' }
        });
        const avgTime = await getAverageResolutionTime(agent.id);
        return { ...agent, resolved, avgResolutionTime: avgTime };
      }));

      return NextResponse.json({ agents: performance });
    }

    if (type === 'slaCompliance') {
      const totalTickets = await prisma.ticket.count({ where: { createdAt: { gte: thirtyDaysAgo } } });
      const breached = await prisma.ticket.count({
        where: { createdAt: { gte: thirtyDaysAgo }, OR: [{ slaResponseBreached: true }, { slaResolutionBreached: true }] }
      });
      return NextResponse.json({ total: totalTickets, breached, complianceRate: totalTickets > 0 ? ((totalTickets - breached) / totalTickets) * 100 : 100 });
    }

    if (type === 'csat') {
      const surveys = await prisma.cSATSurvey.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { rating: true }
      });

      const avgRating = surveys.length > 0 ? surveys.reduce((sum, s) => sum + s.rating, 0) / surveys.length : 0;
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      surveys.forEach(s => { distribution[s.rating as keyof typeof distribution]++; });

      return NextResponse.json({ total: surveys.length, avgRating, distribution });
    }

    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
});

async function getAverageResolutionTime(agentId: number): Promise<number> {
  const tickets = await prisma.ticket.findMany({
    where: { assignedToId: agentId, status: { in: ['RESOLVED', 'CLOSED'] }, updatedAt: { not: null } },
    select: { createdAt: true, updatedAt: true }
  });

  if (tickets.length === 0) return 0;
  const totalTime = tickets.reduce((sum, t) => sum + (new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime()), 0);
  return Math.floor(totalTime / tickets.length / 60000);
}

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { name, type, query, columns, chartType, isPublic } = await req.json();
    if (!name || !type) return NextResponse.json({ error: 'Name and type required' }, { status: 400 });

    const dbUser = await prisma.user.findFirst({ where: { username: user.email } });
    const report = await prisma.report.create({
      data: { name, type, query: query || {}, columns: columns || [], chartType, isPublic: isPublic || false, createdById: dbUser?.id }
    });
    return NextResponse.json(report);
  } catch (err: any) {
    if (err.code === 'P2002') return NextResponse.json({ error: 'Report with this name exists' }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
});
