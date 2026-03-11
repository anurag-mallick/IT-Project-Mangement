import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

export const PATCH = withAuth(async (req: NextRequest, user: any, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const { isCompleted, title } = await req.json();

    const data: any = {};
    if (isCompleted !== undefined) data.isCompleted = isCompleted;
    if (title !== undefined) data.title = title;

    const item = await prisma.checklistItem.update({
      where: { id: parseInt(id) },
      data
    });

    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update checklist item' }, { status: 500 });
  }
});

export const DELETE = withAuth(async (req: NextRequest, user: any, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    
    await prisma.checklistItem.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete checklist item' }, { status: 500 });
  }
});
