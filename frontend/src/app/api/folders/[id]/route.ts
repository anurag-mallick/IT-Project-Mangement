import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

export const DELETE = withAuth(async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  try {
    const { id } = await params;
    
    const folder = await prisma.folder.findUnique({ where: { id: parseInt(id) } });
    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    await prisma.folder.delete({
      where: { id: parseInt(id) }
    });
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
