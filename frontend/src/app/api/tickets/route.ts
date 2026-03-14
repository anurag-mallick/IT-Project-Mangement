export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { calculateSlaBreachTime } from '@/lib/sla';
import { runAutomations } from '@/lib/automations';
import { sendTicketEmail } from '@/lib/email';
import { TicketStatus, TicketPriority } from '@prisma/client';

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
    const { title, description, priority, status, assignedToId, assetId, tags } = body;
    
    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    // Validate priority and status against enums
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
      include: { assignedTo: { select: { id: true, username: true, name: true } } }
    });

    // Run Automations
    const autoUpdatedTicket = await runAutomations('ON_TICKET_CREATED', ticket);

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
        ? 'Database Authentication Failed. Please check your Supabase credentials in Vercel.' 
        : `Failed to create ticket: ${err.message || 'Unknown error'}`
    }, { status: 500 });
  }
});

