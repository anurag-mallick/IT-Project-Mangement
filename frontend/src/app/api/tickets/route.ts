import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { calculateSlaBreachTime } from '@/lib/sla';
import { runAutomations } from '@/lib/automations';
import { sendTicketEmail } from '@/lib/email';

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: { 
        assignedTo: { select: { id: true, username: true, name: true } },
        comments: { include: { author: { select: { name: true } } }, orderBy: { createdAt: 'asc' } },
        checklists: { orderBy: { createdAt: 'asc' } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(tickets);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
});

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const body = await req.json();
    const { title, description, priority, status, assignedToId, tags } = body;
    
    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    const slaBreachAt = await calculateSlaBreachTime(priority || 'P2');

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        priority: priority || 'P2',
        status: status || 'TODO',
        assignedToId: assignedToId ? parseInt(assignedToId) : undefined,
        tags: tags || [],
        slaBreachAt: slaBreachAt || undefined
      },
      include: { assignedTo: { select: { id: true, username: true, name: true } } }
    });

    // Run Automations
    const autoUpdatedTicket = await runAutomations('ON_TICKET_CREATED', ticket);

    // Send email to assignee if assigned
    if (autoUpdatedTicket.assignedToId) {
      const assigneeUser = await prisma.user.findUnique({ where: { id: autoUpdatedTicket.assignedToId } });
      if (assigneeUser && assigneeUser.username) {
        await sendTicketEmail({
          type: 'CREATED',
          ticket: autoUpdatedTicket as any,
          recipient: { email: assigneeUser.username, name: assigneeUser.name || 'User' }
        });
      }
    }

    return NextResponse.json(autoUpdatedTicket);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 400 });
  }
});
