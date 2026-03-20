import { NextResponse, type NextRequest } from 'next/server'

/**
 * Rate limiting should be handled at the infrastructure level (e.g., Vercel WAF, Upstash Redis, or Cloudflare).
 * In-memory Map-based rate limiting does not work effectively in serverless environments 
 */

export async function proxy(request: NextRequest) {
  // Session handling is now done via internal JWTs in api/auth
  // This proxy stays as a hook for future infrastructure-level middleware
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
