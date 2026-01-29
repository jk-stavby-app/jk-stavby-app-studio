import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = profile?.role === 'admin';

  // Fetch user profile by ID (RLS-safe)
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
        setProfile(null);
        return;
      }

      setProfile(data);

      // Update last_login silently (fire and forget)
      supabase
        .from('user_profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId)
        .then(() => {});

    } catch (err) {
      console.error('Unexpected profile error:', err);
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  // Initialize auth on mount
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          await fetchProfile(initialSession.user.id);
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Listen for auth changes (Supabase handles token refresh automatically)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
        }

        setIsLoading(false);
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;
      if (!data.user) throw new Error('No user returned after login');

      // Check if user is active (using ID, not email - RLS safe)
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('is_active')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.warn('Profile check failed:', profileError);
      }

      if (profileData && !profileData.is_active) {
        await supabase.auth.signOut();
        return { error: new Error('Váš účet byl deaktivován. Kontaktujte administrátora.') };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    setUser(null);
    setSession(null);
    setProfile(null);
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isAdmin,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
