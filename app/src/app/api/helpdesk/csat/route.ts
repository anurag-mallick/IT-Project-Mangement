export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get('ticketId');

    if (ticketId) {
      const survey = await prisma.cSATSurvey.findUnique({ where: { ticketId: parseInt(ticketId) } });
      return NextResponse.json(survey || { message: 'No feedback submitted' });
    }

    const surveys = await prisma.cSATSurvey.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    return NextResponse.json({ surveys });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch CSAT surveys' }, { status: 500 });
  }
});

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { ticketId, rating, feedback, employeeName } = await req.json();
    if (!ticketId || !rating) return NextResponse.json({ error: 'Ticket ID and rating required' }, { status: 400 });
    if (rating < 1 || rating > 5) return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });

    const existing = await prisma.cSATSurvey.findUnique({ where: { ticketId } });
    if (existing) {
      return NextResponse.json({ error: 'Feedback already submitted' }, { status: 400 });
    }

    const survey = await prisma.cSATSurvey.create({
      data: { ticketId, rating, feedback, employeeName }
    });

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { feedbackRating: rating, feedbackComment: feedback }
    });

    return NextResponse.json(survey);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
});
