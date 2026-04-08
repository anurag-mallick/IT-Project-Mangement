export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { searchKnowledgeBase } from '@/lib/helpdesk/knowledge-base';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const query = searchParams.get('q');

    const settings = await prisma.globalSetting.findMany();
    const config: Record<string, string> = {};
    settings.forEach(s => { config[s.key] = s.value; });

    if (action === 'search' && query) {
      const results = await searchKnowledgeBase(query, 5);
      return NextResponse.json({ results });
    }

    const featured = await prisma.knowledgeBaseArticle.findMany({
      where: { isPublished: true, isFeatured: true },
      select: { id: true, title: true, slug: true, summary: true },
      take: 5
    });

    const categories = await prisma.serviceCategory.findMany({
      where: { parentId: null },
      select: { id: true, name: true, slug: true },
      take: 10
    });

    return NextResponse.json({
      config: {
        brandName: config['brandName'] || 'IT Support',
        primaryColor: config['primaryColor'] || '#2563eb',
        greeting: config['widgetGreeting'] || 'How can we help you today?'
      },
      featured,
      categories
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch widget data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, ...data } = await req.json();

    if (action === 'createTicket') {
      const { name, email, subject, description, priority } = data;
      if (!email || !subject || !description) {
        return NextResponse.json({ error: 'Email, subject, description required' }, { status: 400 });
      }

      let customer = await prisma.customer.findUnique({ where: { email: email.toLowerCase() } });
      if (!customer) {
        customer = await prisma.customer.create({ data: { email: email.toLowerCase(), name: name || null } });
      }

      const ticket = await prisma.ticket.create({
        data: {
          title: subject, description,
          requesterName: name || email, requesterEmail: email,
          status: 'TODO', priority: priority || 'P2',
          customerId: customer.id, viaCustomerPortal: true
        }
      });

      return NextResponse.json({ success: true, ticketId: ticket.id });
    }

    if (action === 'searchKnowledge') {
      const { query } = data;
      if (!query) return NextResponse.json({ results: [] });
      const results = await searchKnowledgeBase(query, 5);
      return NextResponse.json({ results });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: 'Widget action failed' }, { status: 500 });
  }
}
