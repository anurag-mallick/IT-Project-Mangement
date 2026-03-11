import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

export const PUT = withAuth(async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  try {
    const { id } = await params;
    const { role } = await req.json();
    
    if (!['ADMIN', 'STAFF', 'USER'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role }
    });
    
    return NextResponse.json({ id: updated.id, email: updated.email, role: updated.role });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
