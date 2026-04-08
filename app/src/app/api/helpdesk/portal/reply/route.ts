export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { email, ticketId, message } = await req.json();

    if (!email || !ticketId || !message) {
      return NextResponse.json({ error: 'Email, ticketId, message required' }, { status: 400 });
    }

    const parsedTicketId = parseInt(ticketId);
    if (isNaN(parsedTicketId)) return NextResponse.json({ error: 'Invalid ticket ID' }, { status: 400 });

    const customer = await prisma.customer.findUnique({ where: { email: email.toLowerCase() } });
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    if (customer.isBlocked) return NextResponse.json({ error: 'Your email is blocked' }, { status: 403 });

    const ticket = await prisma.ticket.findFirst({
      where: { id: parsedTicketId, customerId: customer.id },
      include: { communications: { orderBy: { createdAt: 'desc' }, take: 1 } }
    });

    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

    const lastComm = ticket.communications[0];

    await prisma.communication.create({
      data: {
        subject: `Re: ${ticket.title}`, content: message,
        sender: email, senderName: customer.name || null,
        recipient: 'support@localhost', ticketId: ticket.id,
        customerId: customer.id, emailAccountId: ticket.emailAccountId,
        direction: 'INBOUND', inReplyTo: lastComm?.messageId || undefined,
        references: lastComm?.references ? `${lastComm.references} ${lastComm.messageId}` : lastComm?.messageId || undefined
      }
    });

    if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
      await prisma.ticket.update({ where: { id: ticket.id }, data: { status: 'IN_PROGRESS' } });
    }

    await prisma.comment.create({
      data: { ticketId: ticket.id, content: message, authorName: customer.name || customer.email, isInternal: false }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Portal reply error:', err);
    return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 });
  }
}
