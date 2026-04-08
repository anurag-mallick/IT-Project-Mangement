export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { searchKnowledgeBase, getCategoryTree, getArticlesByCategory, incrementArticleViews } from '@/lib/helpdesk/knowledge-base';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const query = searchParams.get('q');
    const categorySlug = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');

    if (action === 'search' && query) {
      const results = await searchKnowledgeBase(query, 10);
      return NextResponse.json({ results });
    }

    if (action === 'tree') {
      const tree = await getCategoryTree();
      return NextResponse.json({ categories: tree });
    }

    if (categorySlug) {
      const data = await getArticlesByCategory(categorySlug, page);
      return NextResponse.json(data);
    }

    const articles = await prisma.knowledgeBaseArticle.findMany({
      where: { isPublished: true },
      include: { category: { select: { name: true, slug: true } }, author: { select: { name: true } } },
      orderBy: { title: 'asc' }
    });
    return NextResponse.json({ articles });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch knowledge base' }, { status: 500 });
  }
}

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { title, slug, content, summary, categoryId, tags, isPublished, isFeatured } = await req.json();
    if (!title || !slug || !content) return NextResponse.json({ error: 'Title, slug, content required' }, { status: 400 });

    const dbUser = await prisma.user.findFirst({ where: { username: user.email } });
    const article = await prisma.knowledgeBaseArticle.create({
      data: {
        title, slug, content, summary, categoryId, tags: tags || [],
        isPublished: isPublished !== false, isFeatured: isFeatured || false, authorId: dbUser?.id
      }
    });
    return NextResponse.json(article);
  } catch (err: any) {
    if (err.code === 'P2002') return NextResponse.json({ error: 'Article with this slug exists' }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create article' }, { status: 500 });
  }
});
