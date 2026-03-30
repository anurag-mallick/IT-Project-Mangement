export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, SessionUser } from '@/lib/auth';
import { calculateSlaBreachTime } from '@/lib/sla';
import { runAutomations } from '@/lib/automations';
import { TicketStatus, TicketPriority } from '@/generated/prisma';
import { sendTicketEmail } from '@/lib/email';

export const GET = withAuth(async (req: NextRequest, user: SessionUser) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const skip = (page - 1) * pageSize;
    const skipPagination = searchParams.get('all') === 'true';
    const hasDueDate = searchParams.get('hasDueDate') === 'true';

    const whereClause: any = {};
    if (hasDueDate) {
      whereClause.dueDate = { not: null };
    }

    const [tickets, totalCount] = await Promise.all([
      prisma.ticket.findMany({
        where: whereClause,
        select: {
          id: true, title: true, status: true, priority: true,
          createdAt: true, updatedAt: true, dueDate: true, slaBreachAt: true,
          tags: true, requesterName: true, assetId: true, folderId: true,
          assignedTo: { select: { id: true, username: true, name: true } },
          _count: { select: { comments: true, checklists: true } }
        },
        orderBy: { createdAt: 'desc' },
        ...(skipPagination ? {} : { skip, take: pageSize })
      }),
      prisma.ticket.count({
        where: whereClause
      })
    ]);

    return NextResponse.json({
      tickets,
      pagination: {
        page: skipPagination ? 1 : page,
        pageSize: skipPagination ? totalCount : pageSize,
        totalCount,
        totalPages: skipPagination ? 1 : Math.ceil(totalCount / pageSize)
      }
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
});

export const POST = withAuth(async (req: NextRequest, user: SessionUser) => {
  try {
    const body = await req.json();
    const { title, description, priority, status, assignedToId, assetId, tags } = body;
    
    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    const validatedPriority = (priority && Object.values(TicketPriority).includes(priority)) ? (priority as TicketPriority) : TicketPriority.P2;
    const validatedStatus = (status && Object.values(TicketStatus).includes(status)) ? (status as TicketStatus) : TicketStatus.TODO;

    const slaBreachAt = await calculateSlaBreachTime(validatedPriority);

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        priority: validatedPriority,
        status: validatedStatus,
        assignedToId: assignedToId ? parseInt(assignedToId.toString()) : undefined,
        assetId: assetId ? parseInt(assetId.toString()) : undefined,
        tags: tags || [],
        slaBreachAt: slaBreachAt || undefined
      },
      include: { assignedTo: { select: { id: true, username: true, name: true, email: true } } }
    });

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    });
    
    await prisma.activityLog.create({
      data: {
        ticketId: ticket.id,
        userId: dbUser?.id,
        action: 'TICKET_CREATED',
        newValue: title
      }
    });

    const autoUpdatedTicket = await runAutomations('ON_TICKET_CREATED', ticket);

    // 3. Send Notifications
    const notificationPromises = [];

    // Notify Assignee
    const assigneeEmail = ticket.assignedTo?.email || ticket.assignedTo?.username;
    if (assigneeEmail) {
      notificationPromises.push(
        sendTicketEmail({
          type: 'ASSIGNED',
          ticket: autoUpdatedTicket as any,
          recipient: { email: assigneeEmail, name: ticket.assignedTo?.name || 'Assignee' }
        })
      );
    }

    // Notify Admins for P0
    if (validatedPriority === TicketPriority.P0) {
      const adminUsers = await prisma.user.findMany({ where: { role: 'ADMIN' } });
      for (const admin of adminUsers) {
        const adminEmail = (admin as any).email || admin.username;
        if (adminEmail && adminEmail !== assigneeEmail) {
          notificationPromises.push(
            sendTicketEmail({
              type: 'CREATED',
              ticket: autoUpdatedTicket as any,
              recipient: { email: adminEmail, name: admin.name || 'Admin' }
            })
          );
        }
      }
    }

    if (notificationPromises.length > 0) {
      Promise.allSettled(notificationPromises);
    }

    return NextResponse.json(autoUpdatedTicket);
  } catch (err: any) {
    console.error('Ticket Create Error Details:', {
      message: err.message,
      stack: err.stack,
      code: err.code
    });
    
    const isAuthError = err.message?.includes('Authentication failed') || err.message?.includes('password authentication failed');
    return NextResponse.json({ 
      error: isAuthError 
        ? 'Database authentication failed. Check your DATABASE_URL in .env.' 
        : `Failed to create ticket: ${err.message || 'Unknown error'}`
    }, { status: 500 });
  }
});
