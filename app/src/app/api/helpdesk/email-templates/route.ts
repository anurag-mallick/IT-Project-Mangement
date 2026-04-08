export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

const DEFAULT_TEMPLATES = [
  { name: 'Ticket Acknowledgement', type: 'ACKNOWLEDGEMENT', subject: 'We received your ticket #{{ ticket.id }}', content: '<p>Hello {{ customer.name | default: "Customer" }},</p><p>Thank you for contacting us. We have received your ticket and will respond within SLA.</p><p><strong>Ticket:</strong> #{{ ticket.id }}</p><p><strong>Subject:</strong> {{ ticket.title }}</p>' },
  { name: 'Agent Reply', type: 'REPLY', subject: 'Re: [Ticket #{{ ticket.id }}] {{ ticket.title }}', content: '<p>Hello {{ customer.name | default: "Customer" }},</p><p>{{ reply_content }}</p><p>Best regards,<br/>{{ agent.name }}</p>' },
  { name: 'Ticket Resolved', type: 'RESOLVED', subject: 'Ticket #{{ ticket.id }} has been resolved', content: '<p>Hello {{ customer.name | default: "Customer" }},</p><p>Your ticket has been resolved.</p><p><strong>Resolution:</strong></p><p>{{ ticket.resolution | default: "The issue has been addressed." }}</p>' },
  { name: 'Feedback Request', type: 'FEEDBACK', subject: 'How was your experience with Ticket #{{ ticket.id }}?', content: '<p>Hello {{ customer.name | default: "Customer" }},</p><p>We hope your issue is resolved. Please rate your experience.</p>' }
];

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const templates = await prisma.emailTemplate.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json({ templates });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
});

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const body = await req.json();
    const { name, subject, content, type, isActive, initializeDefaults } = body;

    if (initializeDefaults) {
      const created = [];
      for (const t of DEFAULT_TEMPLATES) {
        const existing = await prisma.emailTemplate.findUnique({ where: { name: t.name } });
        if (!existing) created.push(await prisma.emailTemplate.create({ data: t }));
      }
      return NextResponse.json({ message: 'Default templates created', created });
    }

    if (!name || !subject || !content) return NextResponse.json({ error: 'Name, subject, content required' }, { status: 400 });
    const template = await prisma.emailTemplate.create({ data: { name, subject, content, type: type || 'CUSTOM', isActive: isActive !== false } });
    return NextResponse.json(template);
  } catch (err: any) {
    if (err.code === 'P2002') return NextResponse.json({ error: 'Template exists' }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
});
