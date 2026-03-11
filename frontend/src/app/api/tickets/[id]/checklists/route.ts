import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

export const POST = withAuth(async (req: NextRequest, user: any, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const { title } = await req.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const item = await prisma.checklistItem.create({
      data: {
        title,
        ticketId: parseInt(id)
      }
    });

    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create checklist item' }, { status: 500 });
  }
});
