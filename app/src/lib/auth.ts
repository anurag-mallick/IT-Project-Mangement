import { NextRequest, NextResponse } from 'next/server';
import { createClient } from './supabase/server';
import { prisma } from '@/lib/prisma';

export interface SessionUser {
  id: string;
  email: string;
  role?: string;
  name?: string;
  username?: string;
}

export async function getUser(): Promise<SessionUser | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    
    return {
      id: user.id,
      email: user.email!,
      role: user.user_metadata?.role,
      name: user.user_metadata?.name,
      username: user.user_metadata?.username || user.email?.split('@')[0]
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
  if (!user || !user.email) return false;
  
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email }
  });
  
  return dbUser?.role === 'ADMIN';
}

/**
 * Checks if the user has admin role in the database.
 */
export async function requireAdmin(user: SessionUser) {
  if (!user || !user.email) return false;
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { role: true }
  });
  return dbUser?.role === 'ADMIN';
}

// Higher order function for API route protection using Supabase Session
export function withAuth(handler: (req: NextRequest, user: SessionUser, context?: any) => Promise<NextResponse>) {
  return async (req: NextRequest, context?: any) => {
    const supabase = await createClient();
    
    // Fix 13: Replace getSession() with getUser() for server-side verification
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fix 12: Use typed SessionUser
    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email!,
      role: user.user_metadata?.role,
      name: user.user_metadata?.name,
      username: user.user_metadata?.username || user.email?.split('@')[0]
    };
    
    return handler(req, sessionUser, context);
  };
}
