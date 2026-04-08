export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const rules = await prisma.assignmentRule.findMany({
      include: { team: { select: { id: true, name: true } } },
      orderBy: { priority: 'asc' }
    });
    return NextResponse.json({ rules });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
  }
});

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { name, description, priority, isActive, conditions, assignment, teamId } = await req.json();
    if (!name || !conditions || !assignment) return NextResponse.json({ error: 'Name, conditions, assignment required' }, { status: 400 });

    const rule = await prisma.assignmentRule.create({
      data: {
        name, description, priority: priority || 0, isActive: isActive !== false,
        conditions, assignment, teamId
      }
    });
    return NextResponse.json(rule);
  } catch (err: any) {
    if (err.code === 'P2002') return NextResponse.json({ error: 'Rule with this name exists' }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 });
  }
});
