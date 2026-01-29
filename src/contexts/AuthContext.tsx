import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
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
  const profileFetchedRef = useRef(false);

  const isAdmin = profile?.role === 'admin';

  const fetchProfile = useCallback(async (userId: string) => {
    if (profileFetchedRef.current) return;
    profileFetchedRef.current = true;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Profile error:', err);
      profileFetchedRef.current = false;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      profileFetchedRef.current = false;
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    console.log('AUTH: Starting...');
    
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      console.log('AUTH: Got session', !!s);
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchProfile(s.user.id);
      setIsLoading(false);
      console.log('AUTH: Done loading');
    }).catch(err => {
      console.error('AUTH: Error', err);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      console.log('AUTH: State change', event);
      if (event === 'INITIAL_SESSION') return;
      
      setSession(s);
      setUser(s?.user ?? null);
      
      if (event === 'SIGNED_IN' && s?.user) {
        profileFetchedRef.current = false;
        fetchProfile(s.user.id);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        profileFetchedRef.current = false;
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error };
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    setSession(null);
    setProfile(null);
    profileFetchedRef.current = false;
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, session, isLoading, isAdmin, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
