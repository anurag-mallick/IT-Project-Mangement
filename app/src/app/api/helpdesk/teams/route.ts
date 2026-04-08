export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        agents: { select: { id: true, username: true, name: true, email: true, isActive: true } },
        _count: { select: { tickets: true } }
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json({ teams });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
});

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { name, description, isActive, roundRobin, agentIds } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

    const team = await prisma.team.create({
      data: {
        name,
        description,
        isActive: isActive !== false,
        roundRobin: roundRobin || false,
        agents: agentIds ? { connect: agentIds.map((id: number) => ({ id })) } : undefined
      },
      include: { agents: { select: { id: true, username: true, name: true } } }
    });
    return NextResponse.json(team);
  } catch (err: any) {
    if (err.code === 'P2002') return NextResponse.json({ error: 'Team exists' }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
});
