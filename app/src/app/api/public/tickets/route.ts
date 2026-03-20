import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/**
 * Rate limiting should be handled at the infrastructure level (e.g., Vercel WAF, Upstash Redis, or Cloudflare).
 * In-memory Map-based rate limiting does not work effectively in serverless environments 
 */

const TicketSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  requesterName: z.string().max(100).optional(),
  priority: z.enum(['P0', 'P1', 'P2', 'P3']).default('P2'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Zod validation
    const result = TicketSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input', details: result.error.format() }, { status: 400 });
    }

    const { title, description, requesterName, priority } = result.data;

    const newTicket = await prisma.ticket.create({
      data: {
        title,
        description,
        requesterName: requesterName || 'Anonymous',
        priority,
        status: 'TODO'
      }
    });

    return NextResponse.json({ message: 'Ticket submitted successfully', ticketId: newTicket.id });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to submit ticket' }, { status: 400 });
  }
}
