import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, SessionUser } from '@/lib/auth';

export const PUT = withAuth(async (req: NextRequest, user: SessionUser, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const { role } = await req.json();

    // Fix 2: Verify role in DB instead of trusting JWT claim
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { role: true }
    });

    if (dbUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    if (!['ADMIN', 'STAFF', 'USER'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role }
    });
    
    const response = NextResponse.json({ id: updated.id, email: updated.email, role: updated.role });
    // Force log out if updating own role
    if (parseInt(id) === parseInt(user.id)) {
      response.cookies.set('session', '', { maxAge: 0, path: '/' });
    }
    return response;
  } catch (err: any) {
    console.error('Role update error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
