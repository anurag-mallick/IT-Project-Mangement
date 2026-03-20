import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Rate limiting should be handled at the infrastructure level (e.g., Vercel WAF, Upstash Redis, or Cloudflare).
 * In-memory Map-based rate limiting does not work effectively in serverless environments 
 */

export async function proxy(request: NextRequest) {
  // Authentication session refresh is handled here
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
