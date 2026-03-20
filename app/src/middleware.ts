import { NextResponse, type NextRequest } from 'next/server';

/**
 * Rate limiting should be handled at the infrastructure level (e.g., Vercel WAF, Upstash Redis, or Cloudflare).
 * In-memory Map-based rate limiting does not work effectively in serverless environments 
 * because states are not shared across concurrent instances and are lost on cold starts.
 */
export function middleware(request: NextRequest) {
  // Pass through all requests - authentication is handled in withAuth or layout level
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
