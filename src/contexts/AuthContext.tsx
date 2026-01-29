import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
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

  // ==========================================
  // FETCH PROFILE
  // ==========================================
  
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);

      // Update last_login (fire and forget - no await)
      supabase
        .from('user_profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId);

    } catch (err) {
      console.error('Error fetching profile:', err);
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  // ==========================================
  // SESSION REFRESH LOGIC
  // ==========================================

  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session refresh error:', error);
        return null;
      }
      
      if (!data.session) {
        setUser(null);
        setSession(null);
        setProfile(null);
        return null;
      }

      // Check if token expires soon (within 5 minutes)
      const expiresAt = data.session.expires_at;
      if (expiresAt) {
        const expiresIn = expiresAt - Math.floor(Date.now() / 1000);
        
        if (expiresIn < 300) {
          console.log('Token expiring soon, refreshing...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error('Token refresh failed:', refreshError);
            await supabase.auth.signOut();
            return null;
          }
          
          if (refreshData.session) {
            setSession(refreshData.session);
            setUser(refreshData.session.user);
            return refreshData.session;
          }
        }
      }

      return data.session;
    } catch (err) {
      console.error('Session check failed:', err);
      return null;
    }
  }, []);

  // ==========================================
  // AUTH STATE LISTENER
  // ==========================================

  useEffect(() => {
    let isMounted = true;
    let refreshInterval: ReturnType<typeof setInterval>;

    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.error('Init session error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initSession();

    // Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, newSession: Session | null) => {
        if (!isMounted) return;

        console.log('Auth event:', event);

        switch (event) {
          case 'SIGNED_IN':
            setSession(newSession);
            setUser(newSession?.user ?? null);
            if (newSession?.user) {
              await fetchProfile(newSession.user.id);
            }
            break;

          case 'SIGNED_OUT':
            setSession(null);
            setUser(null);
            setProfile(null);
            break;

          case 'TOKEN_REFRESHED':
            setSession(newSession);
            setUser(newSession?.user ?? null);
            break;

          case 'USER_UPDATED':
            setSession(newSession);
            setUser(newSession?.user ?? null);
            if (newSession?.user) {
              await fetchProfile(newSession.user.id);
            }
            break;

          default:
            if (newSession) {
              setSession(newSession);
              setUser(newSession.user);
            }
        }

        setIsLoading(false);
      }
    );

    // Periodic session refresh (every 4 minutes)
    refreshInterval = setInterval(() => {
      if (isMounted) {
        refreshSession();
      }
    }, 4 * 60 * 1000);

    // Refresh on window focus
    const handleFocus = () => {
      if (isMounted) refreshSession();
    };
    window.addEventListener('focus', handleFocus);

    // Refresh on visibility change
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isMounted) {
        refreshSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Refresh on online
    const handleOnline = () => {
      if (isMounted) refreshSession();
    };
    window.addEventListener('online', handleOnline);

    // Cleanup
    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearInterval(refreshInterval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('online', handleOnline);
    };
  }, [fetchProfile, refreshSession]);

  // ==========================================
  // SIGN IN
  // ==========================================

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;

      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('is_active')
        .eq('email', email)
        .single();

      if (profileData && !profileData.is_active) {
        await supabase.auth.signOut();
        return { error: new Error('Váš účet byl deaktivován. Kontaktujte administrátora.') };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  // ==========================================
  // SIGN OUT
  // ==========================================

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  }, []);

  // ==========================================
  // RENDER
  // ==========================================

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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
