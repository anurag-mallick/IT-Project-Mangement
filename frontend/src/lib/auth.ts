import { NextRequest, NextResponse } from 'next/server';
import { supabase } from './supabase';

export async function verifyUser(req: NextRequest) {
  // Extract token from Authorization header or cookie
  const authHeader = req.headers.get('Authorization');
  let token = '';
  
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else {
    // Attempt to get token from cookie if Next.js handles session
    const cookieToken = req.cookies.get('supabase-auth-token');
    if (cookieToken) token = cookieToken.value;
  }

  if (!token) {
    return { user: null, error: 'No token provided' };
  }

  // Verify the JWT token cryptographically via Supabase
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    console.error('verifyUser failed:', { error: error?.message, hasUser: !!user });
    return { user: null, error: error?.message || 'Invalid token' };
  }

  return { user, error: null };
}

// Higher order function for API route protection
export function withAuth(handler: (req: NextRequest, user: any, context?: any) => Promise<NextResponse>) {
  return async (req: NextRequest, context?: any) => {
    const { user, error } = await verifyUser(req);
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized', details: error }, { status: 401 });
    }
    
    return handler(req, user, context);
  };
}
