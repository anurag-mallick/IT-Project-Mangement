import { prisma } from '../prisma';

interface SearchResult {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  category: { name: string; slug: string } | null;
  relevance: number;
}

export async function searchKnowledgeBase(query: string, limit: number = 10): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return [];
  
  const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
  
  const articles = await prisma.knowledgeBaseArticle.findMany({
    where: { isPublished: true },
    include: {
      category: { select: { name: true, slug: true } }
    }
  });
  
  const results: SearchResult[] = articles.map(article => {
    const titleLower = article.title.toLowerCase();
    const contentLower = article.content.toLowerCase();
    const summaryLower = (article.summary || '').toLowerCase();
    
    let relevance = 0;
    
    for (const term of searchTerms) {
      if (titleLower.includes(term)) relevance += 10;
      if (summaryLower.includes(term)) relevance += 5;
      if (contentLower.includes(term)) relevance += 1;
    }
    
    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      summary: article.summary,
      category: article.category,
      relevance
    };
  });
  
  return results
    .filter(r => r.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
}

export async function getRecommendedArticles(ticketTitle: string, limit: number = 3): Promise<SearchResult[]> {
  const keywords = extractKeywords(ticketTitle);
  if (keywords.length === 0) return [];
  
  return searchKnowledgeBase(keywords.join(' '), limit);
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who',
    'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
    'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
    'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but',
    'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by',
    'for', 'with', 'about', 'against', 'between', 'into', 'through',
    'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up',
    'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further',
    'then', 'once', 'here', 'there', 'any', 'my', 'your', 'our'
  ]);
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .slice(0, 5);
}

export async function getArticlesByCategory(categorySlug: string, page: number = 1, pageSize: number = 20) {
  const category = await prisma.knowledgeBaseCategory.findUnique({
    where: { slug: categorySlug }
  });
  
  if (!category) return { articles: [], total: 0 };
  
  const [articles, total] = await Promise.all([
    prisma.knowledgeBaseArticle.findMany({
      where: { categoryId: category.id, isPublished: true },
      orderBy: { title: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.knowledgeBaseArticle.count({
      where: { categoryId: category.id, isPublished: true }
    })
  ]);
  
  return { articles, total, category };
}

export async function getCategoryTree() {
  const categories = await prisma.knowledgeBaseCategory.findMany({
    where: { isPublished: true },
    orderBy: { order: 'asc' },
    include: {
      _count: { select: { articles: true, children: true } }
    }
  });
  
  return buildCategoryTree(categories);
}

function buildCategoryTree(categories: any[], parentId: number | null = null): any[] {
  return categories
    .filter(c => c.parentId === parentId)
    .map(c => ({
      ...c,
      children: buildCategoryTree(categories, c.id)
    }));
}

export async function incrementArticleViews(articleId: number) {
  await prisma.knowledgeBaseArticle.update({
    where: { id: articleId },
    data: { views: { increment: 1 } }
  });
}
