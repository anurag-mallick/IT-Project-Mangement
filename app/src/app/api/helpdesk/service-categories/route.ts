export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(req.url);
    const flat = searchParams.get('flat') === 'true';

    const categories = await prisma.serviceCategory.findMany({
      orderBy: { order: 'asc' },
      include: { _count: { select: { tickets: true, children: true } } }
    });

    if (flat) {
      return NextResponse.json({ categories });
    }

    const tree = buildTree(categories);
    return NextResponse.json({ categories: tree });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
});

function buildTree(categories: any[], parentId: number | null = null): any[] {
  return categories.filter(c => c.parentId === parentId).map(c => ({
    ...c,
    children: buildTree(categories, c.id)
  }));
}

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { name, slug, description, parentId, order } = await req.json();
    if (!name || !slug) return NextResponse.json({ error: 'Name and slug required' }, { status: 400 });

    const category = await prisma.serviceCategory.create({
      data: { name, slug, description, parentId, order: order || 0 }
    });
    return NextResponse.json(category);
  } catch (err: any) {
    if (err.code === 'P2002') return NextResponse.json({ error: 'Category with this slug exists' }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
});
