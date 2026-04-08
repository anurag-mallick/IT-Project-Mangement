export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { sourceTicketId, targetTicketId } = await req.json();
    if (!sourceTicketId || !targetTicketId) {
      return NextResponse.json({ error: 'Source and target ticket IDs required' }, { status: 400 });
    }

    if (sourceTicketId === targetTicketId) {
      return NextResponse.json({ error: 'Cannot merge ticket with itself' }, { status: 400 });
    }

    const [source, target] = await Promise.all([
      prisma.ticket.findUnique({ where: { id: sourceTicketId } }),
      prisma.ticket.findUnique({ where: { id: targetTicketId } })
    ]);

    if (!source || !target) {
      return NextResponse.json({ error: 'One or both tickets not found' }, { status: 404 });
    }

    const dbUser = await prisma.user.findFirst({ where: { username: user.email } });

    await prisma.$transaction(async (tx) => {
      await tx.comment.updateMany({
        where: { ticketId: sourceTicketId },
        data: { ticketId: targetTicketId }
      });

      await tx.attachment.updateMany({
        where: { ticketId: sourceTicketId },
        data: { ticketId: targetTicketId }
      });

      await tx.activityLog.updateMany({
        where: { ticketId: sourceTicketId },
        data: { ticketId: targetTicketId }
      });

      await tx.communication.updateMany({
        where: { ticketId: sourceTicketId },
        data: { ticketId: targetTicketId }
      });

      await tx.ticketTimeEntry.updateMany({
        where: { ticketId: sourceTicketId },
        data: { ticketId: targetTicketId }
      });

      await tx.checklistItem.updateMany({
        where: { ticketId: sourceTicketId },
        data: { ticketId: targetTicketId }
      });

      await tx.task.updateMany({
        where: { ticketId: sourceTicketId },
        data: { ticketId: targetTicketId }
      });

      await tx.ticketMerge.create({
        data: {
          sourceTicketId, targetTicketId,
          mergedById: dbUser?.id
        }
      });

      await tx.ticket.update({
        where: { id: sourceTicketId },
        data: { status: 'CLOSED', title: `[MERGED] ${source.title}`, description: `Merged into ticket #${targetTicketId}` }
      });

      await tx.activityLog.create({
        data: {
          ticketId: targetTicketId,
          userId: dbUser?.id,
          action: 'MERGE',
          oldValue: `#${sourceTicketId}`,
          newValue: `#${targetTicketId}`
        }
      });
    });

    return NextResponse.json({ success: true, targetTicketId });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to merge tickets' }, { status: 500 });
  }
});
