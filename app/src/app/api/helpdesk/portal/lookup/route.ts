export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const customer = await prisma.customer.findUnique({ where: { email: email.toLowerCase() } });
    if (!customer) return NextResponse.json({ tickets: [] });

    const tickets = await prisma.ticket.findMany({
      where: { customerId: customer.id },
      select: {
        id: true, title: true, status: true, priority: true,
        createdAt: true, updatedAt: true, resolution: true,
        assignedTo: { select: { name: true, email: true } },
        _count: { select: { comments: true, communications: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ tickets });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to lookup tickets' }, { status: 500 });
  }
}
