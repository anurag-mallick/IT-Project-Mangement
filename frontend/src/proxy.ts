import { NextRequest, NextResponse } from 'next/server';

// Basic in-memory rate limiting (Note: Reset on every serverless function cold start)
const rateLimit = new Map<string, { count: number; lastReset: number }>();
const LIMIT = 100; // 100 requests
const WINDOW = 60 * 1000; // per 1 minute

export async function proxy(req: NextRequest) {
  const ip = (req as any).ip || req.headers.get('x-forwarded-for') || 'anonymous';
  const now = Date.now();
  
  // Rate Limiting
  const current = rateLimit.get(ip) || { count: 0, lastReset: now };
  if (now - current.lastReset > WINDOW) {
    current.count = 0;
    current.lastReset = now;
  }
  
  current.count++;
  rateLimit.set(ip, current);
  
  if (current.count > LIMIT) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // Auth enforcement for /api routes (except public ones)
  if (req.nextUrl.pathname.startsWith('/api') && !req.nextUrl.pathname.startsWith('/api/public')) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      // Allow if there's a specific auth cookie or other mechanism handled by withAuth
      // But for strict security, we can enforce it here
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
