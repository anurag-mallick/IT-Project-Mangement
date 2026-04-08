export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateResponseByTime, calculateResolutionByTime } from '@/lib/helpdesk/sla';
import { sendTicketEmail, getDefaultEmailAccount } from '@/lib/helpdesk/email';

export async function POST(req: NextRequest) {
  try {
    const { email, name, subject, description, priority, ticketType } = await req.json();

    if (!email || !subject || !description) {
      return NextResponse.json({ error: 'Email, subject, description required' }, { status: 400 });
    }

    let customer = await prisma.customer.findUnique({ where: { email: email.toLowerCase() } });
    if (!customer) {
      customer = await prisma.customer.create({ data: { email: email.toLowerCase(), name: name || null } });
    }

    if (customer.isBlocked) {
      return NextResponse.json({ error: 'Your email has been blocked' }, { status: 403 });
    }

    const validPriorities = ['P0', 'P1', 'P2', 'P3'];
    const validatedPriority = validPriorities.includes(priority) ? priority : 'P2';
    const [responseBy, resolutionBy] = await Promise.all([
      calculateResponseByTime(validatedPriority),
      calculateResolutionByTime(validatedPriority)
    ]);
    const defaultAccount = await getDefaultEmailAccount();

    const ticket = await prisma.ticket.create({
      data: {
        title: subject, description,
        requesterName: name || email, requesterEmail: email,
        status: 'TODO', priority: validatedPriority as any,
        customerId: customer.id, viaCustomerPortal: true,
        ticketType: ticketType || 'INCIDENT',
        responseBy, resolutionBy,
        emailAccountId: defaultAccount?.id
      }
    });

    if (defaultAccount?.autoResponse) {
      try {
        await sendTicketEmail({
          type: 'ACKNOWLEDGEMENT', ticket: ticket as any,
          recipient: { email: customer.email, name: customer.name || customer.email },
          emailAccountId: defaultAccount.id
        });
      } catch (e) { console.error('Failed to send acknowledgement:', e); }
    }

    return NextResponse.json({ success: true, ticketId: ticket.id, ticket });
  } catch (err) {
    console.error('Portal create error:', err);
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
}
