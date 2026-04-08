export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (!slug) return NextResponse.json({ error: 'Slug required' }, { status: 400 });

    const category = await prisma.knowledgeBaseCategory.findUnique({
      where: { slug },
      include: {
        articles: {
          where: { isPublished: true },
          select: { id: true, title: true, slug: true, summary: true, views: true, updatedAt: true }
        },
        children: {
          where: { isPublished: true },
          include: { _count: { select: { articles: true } } }
        }
      }
    });

    if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

    return NextResponse.json({ category });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
  }
}
