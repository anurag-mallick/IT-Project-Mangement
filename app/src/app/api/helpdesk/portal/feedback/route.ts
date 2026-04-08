export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { email, ticketId, rating, feedback, employeeName } = await req.json();

    if (!ticketId || !rating) return NextResponse.json({ error: 'Ticket ID and rating required' }, { status: 400 });
    if (rating < 1 || rating > 5) return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });

    const customer = email ? await prisma.customer.findUnique({ where: { email: email.toLowerCase() } }) : null;
    const ticket = await prisma.ticket.findFirst({
      where: { id: parseInt(ticketId), ...(customer ? { customerId: customer.id } : {}) }
    });

    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

    const existing = await prisma.cSATSurvey.findUnique({ where: { ticketId: parseInt(ticketId) } });
    if (existing) return NextResponse.json({ error: 'Feedback already submitted' }, { status: 400 });

    const survey = await prisma.cSATSurvey.create({
      data: { ticketId: parseInt(ticketId), rating, feedback, employeeName }
    });

    await prisma.ticket.update({
      where: { id: parseInt(ticketId) },
      data: { feedbackRating: rating, feedbackComment: feedback }
    });

    return NextResponse.json({ success: true, survey });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}
