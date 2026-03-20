import { NextRequest, NextResponse } from 'next/server';
import { createClient } from './supabase/server';
import { prisma } from '@/lib/prisma';

export interface SessionUser {
  id: string; // Supabase UUID
  email: string;
  role?: string; // Should be fetched from database
  name?: string;
  username?: string;
}

/**
 * Gets user from Supabase auth and enriches it with database role.
 */
export async function getUser(): Promise<SessionUser | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    // Fetch the database role directly
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      select: { role: true, name: true, username: true }
    });
    
    return {
      id: user.id,
      email: user.email!,
      role: dbUser?.role,
      name: dbUser?.name || user.user_metadata?.name,
      username: dbUser?.username || user.user_metadata?.username || user.email?.split('@')[0]
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

/**
 * Checks if the user has admin role in the database.
 * Used for server components or middleware.
 */
export async function isAdmin() {
  const user = await getUser();
  return user?.role === 'ADMIN';
}

/**
 * Checks if the pre-fetched user has admin role.
 * Used in API route handlers or areas where the user is already available.
 */
export async function requireAdmin(user: SessionUser) {
  return user.role === 'ADMIN';
}

// Higher order function for API route protection using Supabase Session
export function withAuth(handler: (req: NextRequest, user: SessionUser, context?: any) => Promise<NextResponse>) {
  return async (req: NextRequest, context?: any) => {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role MUST be searched from DB, not read from JWT metadata to avoid stale/tampered tokens
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      select: { role: true, name: true, username: true, id: true }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User setup incomplete' }, { status: 403 });
    }
    
    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email!,
      role: dbUser.role,
      name: dbUser.name || user.user_metadata?.name,
      username: dbUser.username || user.user_metadata?.username || user.email?.split('@')[0]
    };
    
    return handler(req, sessionUser, context);
  };
}
