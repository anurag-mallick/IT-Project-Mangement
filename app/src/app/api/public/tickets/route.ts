import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Fix 4: Add IP-based rate limiting (basic version for serverless)
const recentIPs = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5;

const TicketSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  requesterName: z.string().max(100).optional(),
  priority: z.enum(['P0', 'P1', 'P2', 'P3']).default('P2'),
});

export async function POST(req: NextRequest) {
  try {
    // Basic IP rate limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const lastRequest = recentIPs.get(ip) || 0;
    
    if (now - lastRequest < RATE_LIMIT_WINDOW / MAX_REQUESTS) {
      return NextResponse.json({ error: 'Too many requests. Please wait.' }, { status: 429 });
    }
    recentIPs.set(ip, now);

    const body = await req.json();
    
    // Fix 4: Zod validation
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
