export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { processSLAEscalations } from '@/lib/helpdesk/sla';

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'policies';

    if (type === 'policies') {
      const policies = await prisma.sLAPolicyConfig.findMany({
        include: { calendar: true },
        orderBy: { priority: 'asc' }
      });
      return NextResponse.json({ policies });
    }

    if (type === 'calendars') {
      const calendars = await prisma.holidayCalendar.findMany({
        include: { holidays: true },
        orderBy: { name: 'asc' }
      });
      return NextResponse.json({ calendars });
    }

    if (type === 'escalations') {
      const escalations = await prisma.sLAEscalation.findMany({ orderBy: { name: 'asc' } });
      return NextResponse.json({ escalations });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch SLA data' }, { status: 500 });
  }
});

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { action, ...data } = await req.json();

    if (action === 'processEscalations') {
      await processSLAEscalations();
      return NextResponse.json({ message: 'Escalations processed' });
    }

    if (action === 'createPolicy') {
      const { name, priority, responseTimeMins, resolutionTimeMins, firstResponseTimeMins, calendarId } = data;
      if (!name || !priority) return NextResponse.json({ error: 'Name and priority required' }, { status: 400 });

      const policy = await prisma.sLAPolicyConfig.create({
        data: { name, priority, responseTimeMins: responseTimeMins || 0, resolutionTimeMins: resolutionTimeMins || 0, firstResponseTimeMins, calendarId }
      });
      return NextResponse.json(policy);
    }

    if (action === 'createCalendar') {
      const { name, description, isDefault, holidays } = data;
      if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

      if (isDefault) {
        await prisma.holidayCalendar.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
      }

      const calendar = await prisma.holidayCalendar.create({
        data: {
          name, description, isDefault: isDefault || false,
          holidays: holidays ? { create: holidays.map((h: any) => ({ name: h.name, date: new Date(h.date), year: new Date(h.date).getFullYear() })) } : undefined
        },
        include: { holidays: true }
      });
      return NextResponse.json(calendar);
    }

    if (action === 'createEscalation') {
      const { name, triggerType, triggerValue, actionType, actionValue, priority, isActive } = data;
      if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

      const escalation = await prisma.sLAEscalation.create({
        data: { name, triggerType, triggerValue, actionType, actionValue, priority, isActive: isActive !== false }
      });
      return NextResponse.json(escalation);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process SLA action' }, { status: 500 });
  }
});
