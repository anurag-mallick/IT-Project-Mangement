"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SessionUser } from '@/lib/auth';

interface AuthContextType {
  // Fix 12: Use typed SessionUser instead of any
  user: SessionUser | null; 
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<SessionUser | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const fetchProfile = useCallback(async (): Promise<SessionUser | null> => {
    try {
      const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();
      if (supabaseUser) {
          const sessionUser: SessionUser = {
            id: supabaseUser.id,
            email: supabaseUser.email!,
            role: supabaseUser.user_metadata?.role,
            name: supabaseUser.user_metadata?.name,
            username: supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0]
          };
          setUser(sessionUser);
          return sessionUser;
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
    return null;
  }, [supabase]);

  useEffect(() => {
    const initializeAuth = async () => {
      await fetchProfile();
      setIsLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
            const u = session.user;
            setUser({
              id: u.id,
              email: u.email!,
              role: u.user_metadata?.role,
              name: u.user_metadata?.name,
              username: u.user_metadata?.username || u.email?.split('@')[0]
            });
        } else {
            setUser(null);
        }
    });

    return () => {
        subscription.unsubscribe();
    }
  }, [fetchProfile, supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      signOut,
      refreshProfile: fetchProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
