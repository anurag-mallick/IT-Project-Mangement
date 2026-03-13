import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { calculateSlaBreachTime } from '@/lib/sla';
import { runAutomations } from '@/lib/automations';
import { sendTicketEmail } from '@/lib/email';

export const PATCH = withAuth(async (req: NextRequest, user: any, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, priority, title, description, assignedToId, tags, dueDate, assetId } = body;

    const currentTicket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) }
    });

    if (!currentTicket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

    const data: any = {};
    if (status !== undefined) data.status = status;
    if ('assignedToId' in body) {
      data.assignedToId = assignedToId ? parseInt(assignedToId) : null;
    }
    if ('assetId' in body) {
      data.assetId = assetId ? parseInt(assetId) : null;
    }
    if (tags !== undefined) {
      data.tags = tags;
    }
    if (dueDate !== undefined) {
      data.dueDate = dueDate ? new Date(dueDate).toISOString() : null;
    }
    if (priority !== undefined && priority !== currentTicket.priority) {
      // Re-calculate SLA if priority changed
      const slaBreachAt = await calculateSlaBreachTime(priority);
      if (slaBreachAt) {
        data.slaBreachAt = slaBreachAt;
      }
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data,
      include: { 
        assignedTo: { select: { id: true, username: true, name: true } },
        checklists: { orderBy: { createdAt: 'asc' } },
        asset: true
      }
    });

    const changes = [];
    if (status && status !== currentTicket.status) {
      changes.push(`status from **${currentTicket.status}** to **${status}**`);
    }
    if (priority && priority !== currentTicket.priority) {
      changes.push(`priority from **${currentTicket.priority}** to **${priority}**`);
    }
    if (dueDate && new Date(dueDate).toISOString() !== currentTicket.dueDate?.toISOString()) {
      changes.push(`due date to **${new Date(dueDate).toLocaleDateString()}**`);
    }

    if (changes.length > 0) {
      // Find the user if they exist in our DB
      const dbUser = await prisma.user.findFirst({
        where: { username: user.email }
      });

      const logs = [];
      if (status && status !== currentTicket.status) {
        logs.push({ ticketId: parseInt(id), userId: dbUser?.id, action: 'STATUS_CHANGE', field: 'status', oldValue: currentTicket.status, newValue: status });
      }
      if (priority && priority !== currentTicket.priority) {
        logs.push({ ticketId: parseInt(id), userId: dbUser?.id, action: 'PRIORITY_CHANGE', field: 'priority', oldValue: currentTicket.priority, newValue: priority });
      }
      if ('assignedToId' in body && assignedToId !== currentTicket.assignedToId) {
        logs.push({ ticketId: parseInt(id), userId: dbUser?.id, action: 'ASSIGNMENT_CHANGE', field: 'assignedToId', oldValue: currentTicket.assignedToId ? String(currentTicket.assignedToId) : null, newValue: assignedToId ? String(assignedToId) : null });
      }

      if (logs.length > 0) {
        await prisma.activityLog.createMany({
          data: logs
        });
        
        // Keep the system comment for visibility in the thread for now
        await prisma.comment.create({
          data: {
            content: `System: Updated ${changes.join(' and ')}`,
            ticketId: parseInt(id),
            authorName: user.email || 'System'
          }
        });
      }
    }

    // Run Automations
    const autoUpdatedTicket = await runAutomations('ON_TICKET_UPDATED', updatedTicket as any);

    // Send assignment email if assignee changed (DISABLED FOR NOW)
    /*
    if (data.assignedToId && data.assignedToId !== currentTicket.assignedToId) {
      const assigneeUser = await prisma.user.findUnique({ where: { id: data.assignedToId } });
      if (assigneeUser && assigneeUser.username) {
        await sendTicketEmail({
          type: 'ASSIGNED',
          ticket: autoUpdatedTicket as any,
          recipient: { email: assigneeUser.username, name: assigneeUser.name || 'User' }
        });
      }
    } else if (data.status && data.status !== currentTicket.status) {
       // Send status update email if no new assignment, but status changed
       const userToNotify = currentTicket.assignedToId ? await prisma.user.findUnique({ where: { id: currentTicket.assignedToId } }) : null;
       if (userToNotify && userToNotify.username) {
         await sendTicketEmail({
            type: data.status === 'RESOLVED' ? 'RESOLVED' : 'UPDATED',
            ticket: autoUpdatedTicket as any,
            recipient: { email: userToNotify.username, name: userToNotify.name || 'User' }
         });
       }
    }
    */

    return NextResponse.json(autoUpdatedTicket);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 400 });
  }
});
