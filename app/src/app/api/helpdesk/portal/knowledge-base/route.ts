export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { searchKnowledgeBase } from '@/lib/helpdesk/knowledge-base';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const query = searchParams.get('q');
    const slug = searchParams.get('slug');

    if (action === 'search' && query) {
      const results = await searchKnowledgeBase(query, 10);
      return NextResponse.json({ results });
    }

    if (slug) {
      const article = await prisma.knowledgeBaseArticle.findFirst({
        where: { slug, isPublished: true }
      });
      if (!article) return NextResponse.json({ error: 'Article not found' }, { status: 404 });
      
      await prisma.knowledgeBaseArticle.update({
        where: { id: article.id },
        data: { views: { increment: 1 } }
      });
      
      return NextResponse.json({ article });
    }

    const categories = await prisma.knowledgeBaseCategory.findMany({
      where: { isPublished: true, parentId: null },
      include: {
        children: { where: { isPublished: true } },
        _count: { select: { articles: true } }
      },
      orderBy: { order: 'asc' }
    });

    const featured = await prisma.knowledgeBaseArticle.findMany({
      where: { isPublished: true, isFeatured: true },
      select: { id: true, title: true, slug: true, summary: true },
      take: 5
    });

    return NextResponse.json({ categories, featured });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch knowledge base' }, { status: 500 });
  }
}
