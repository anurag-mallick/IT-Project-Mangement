export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    const where: any = search ? {
      OR: [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: { _count: { select: { tickets: true, communications: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.customer.count({ where })
    ]);

    return NextResponse.json({ customers, total, page, pageSize });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
});

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { email, name, phone, company } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const customer = await prisma.customer.create({
      data: { email: email.toLowerCase(), name, phone, company }
    });
    return NextResponse.json(customer);
  } catch (err: any) {
    if (err.code === 'P2002') return NextResponse.json({ error: 'Customer exists' }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
});
