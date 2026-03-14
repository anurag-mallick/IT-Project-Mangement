import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendSlackNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { title, description, category } = await req.json();

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    // --- Intelligent Triage Logic (Keywords/Rules) ---
    let priority = 'P2'; // Default
    const text = (title + ' ' + description).toLowerCase();

    // Critical Keywords
    if (text.includes('urgent') || text.includes('emergency') || text.includes('down') || text.includes('outage') || text.includes('security breach')) {
      priority = 'P0';
    } else if (text.includes('broken') || text.includes('error') || text.includes('blocked') || text.includes('failure')) {
      priority = 'P1';
    } else if (text.includes('request') || text.includes('how to') || text.includes('question')) {
      priority = 'P3';
    }

    // --- Intelligent Assignment logic ---
    // Find staff with the least number of open tickets
    const staff = await prisma.user.findMany({
      where: { role: 'STAFF' },
      include: {
        _count: {
          select: { assignedTickets: { where: { status: { notIn: ['RESOLVED', 'CLOSED'] } } } }
        }
      }
    });

    // Simple load balancer: pick staff with minimum ticket count
    const sortedStaff = staff.sort((a, b) => a._count.assignedTickets - b._count.assignedTickets);
    const assignedToId = sortedStaff[0]?.id || null;

    const triageResult = {
      priority,
      assignedToId,
      assignedToName: sortedStaff[0]?.name || 'Unassigned',
      reason: `Auto-triaged based on keywords: ${priority === 'P0' ? 'Critical' : priority === 'P1' ? 'Major' : 'Routine'}`
    };

    // If it's a P0, trigger Slack immediately (even before ticket is fully saved if we were creating it here)
    // In a real scenario, this would be part of the ticket creation flow or a manual 'Triage' button.
    
    return NextResponse.json(triageResult);
  } catch (err: any) {
    console.error('Triage error:', err);
    return NextResponse.json({ error: 'Triage failed', details: err.message }, { status: 500 });
  }
}
