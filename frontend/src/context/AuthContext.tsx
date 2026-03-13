"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: any;
  token: string | null;
  login: (token: string, user: any) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchProfile = React.useCallback(async (currentToken: string) => {
    try {
      const res = await fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (res.ok) {
        const dbUser = await res.json();
        setUser(dbUser);
        localStorage.setItem('user', JSON.stringify(dbUser));
        return dbUser;
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
    return null;
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (savedToken) {
        setToken(savedToken);
        
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            
            // If the saved user doesn't have a role, fetch it asynchronously
            if (!parsedUser.role) {
              await fetchProfile(savedToken);
            }
          } catch (e) {
            console.error('Error parsing saved user:', e);
            await fetchProfile(savedToken);
          }
        } else {
          await fetchProfile(savedToken);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [fetchProfile]);

  const login = async (newToken: string, supabaseUser: any) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
    
    const dbUser = await fetchProfile(newToken);
    
    if (!dbUser) {
      setUser(supabaseUser);
      localStorage.setItem('user', JSON.stringify(supabaseUser));
    }
    
    router.push('/');
  };

  const logout = async () => {
    try {
      await import('@/lib/supabase').then(m => m.supabase.auth.signOut());
    } catch (e) {
      console.error('Supabase sign out error:', e);
    }
    
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.clear(); // Clear any other residual session data
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
