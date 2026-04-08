import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, SessionUser } from '@/lib/auth';

export const PATCH = withAuth(async (req: NextRequest, user: SessionUser, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }
    const { isCompleted, title } = await req.json();

    const data: { isCompleted?: boolean; title?: string } = {};
    if (isCompleted !== undefined) data.isCompleted = isCompleted;
    if (title !== undefined) data.title = title;

    const item = await prisma.checklistItem.update({
      where: { id: parsedId },
      data
    });

    if (isCompleted !== undefined) {
      const dbUser = await prisma.user.findUnique({ where: { email: user.email } });

      await prisma.activityLog.create({
        data: {
          ticketId: item.ticketId,
          userId: dbUser?.id,
          action: isCompleted ? 'CHECKLIST_ITEM_COMPLETED' : 'CHECKLIST_ITEM_UNCOMPLETED',
          newValue: item.title
        }
      });
    }

    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: 'Failed to update checklist item' }, { status: 500 });
  }
});

export const DELETE = withAuth(async (req: NextRequest, _user: SessionUser, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }
    
    await prisma.checklistItem.delete({
      where: { id: parsedId }
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete checklist item' }, { status: 500 });
  }
});
