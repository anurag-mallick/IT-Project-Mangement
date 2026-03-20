import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-for-dev-only-replace-immediately'
);

export interface SessionUser {
  id: string; // Database User ID (as string)
  email: string;
  role?: string;
  name?: string;
  username?: string;
}

/**
 * Verifies the JWT token and returns the payload.
 */
export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as any;
  } catch (err) {
    return null;
  }
}

/**
 * Gets user from the 'auth-token' cookie and enriches it from the database.
 */
export async function getUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload || !payload.email) return null;

    // Fetch the database info to ensure role/status are current
    const dbUser = await prisma.user.findUnique({
      where: { email: payload.email },
      select: { id: true, email: true, role: true, name: true, username: true }
    });
    
    if (!dbUser) return null;

    return {
      id: String(dbUser.id),
      email: dbUser.email,
      role: dbUser.role,
      name: dbUser.name || '',
      username: dbUser.username || dbUser.email.split('@')[0]
    };
  } catch (err) {
    console.error('getUser error:', err);
    return null;
  }
}

export async function verifyUser() {
  const user = await getUser();
  if (!user) {
    return { user: null, error: 'Unauthorized' };
  }
  return { user, error: null };
}

export async function isAdmin() {
  const user = await getUser();
  return user?.role === 'ADMIN';
}

export async function requireAdmin(user: SessionUser) {
  return user.role === 'ADMIN';
}

/**
 * Middleware/API helper to protect routes.
 */
export function withAuth(handler: (req: NextRequest, user: SessionUser, context?: any) => Promise<NextResponse>) {
  return async (req: NextRequest, context?: any) => {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return handler(req, user, context);
  };
}

/**
 * Signs a new JWT token for a user.
 */
export async function signToken(payload: { email: string; id: number; role?: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}
