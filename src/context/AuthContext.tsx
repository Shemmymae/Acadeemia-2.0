import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Session, User as SupabaseAuthUser } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { InstitutionUser, PlatformMembership, User as AppUser, PlatformRole, InstitutionRole } from '../types';

interface AuthContextType {
  // Real Supabase Identity
  session: Session | null;
  authUser: SupabaseAuthUser | null;
  appProfile: AppUser | null;
  platformMembership: PlatformMembership | null;
  institutionMemberships: InstitutionUser[];
  isLoading: boolean;
  authError: string | null;
  isSupabaseConfigured: boolean;
  isPlatformAdmin: boolean;
  isPlatformUser: boolean;

  // Real Authentication Handlers
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithPassword: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;

  // Development Sandbox Override (Explicitly Isolated, never bypasses real Supabase)
  isSandboxMode: boolean;
  enableSandboxMode: () => void;
  sandboxActiveRole: InstitutionRole | PlatformRole;
  setSandboxActiveRole: (role: InstitutionRole | PlatformRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<SupabaseAuthUser | null>(null);
  const [appProfile, setAppProfile] = useState<AppUser | null>(null);
  const [platformMembership, setPlatformMembership] = useState<PlatformMembership | null>(null);
  const [institutionMemberships, setInstitutionMemberships] = useState<InstitutionUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Development sandbox fallback flag when Supabase credentials are not yet configured in env
  const [isSandboxMode, setIsSandboxMode] = useState<boolean>(() => {
    return !isSupabaseConfigured && localStorage.getItem('acadeemia_sandbox_mode') === 'true';
  });
  const [sandboxActiveRole, setSandboxActiveRole] = useState<InstitutionRole | PlatformRole>('platform_admin');

  // Load user profile and memberships from Supabase when session exists
  const loadUserMemberships = useCallback(async (userId: string) => {
    if (!supabase) return;
    try {
      // 1. Fetch user profile from public.users
      const { data: profileData, error: profileErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!profileErr && profileData) {
        setAppProfile(profileData as AppUser);
      }

      // 2. Fetch platform membership based on auth.uid()
      const { data: platData, error: platErr } = await supabase
        .from('platform_memberships')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (!platErr && platData) {
        setPlatformMembership(platData as PlatformMembership);
      } else {
        setPlatformMembership(null);
      }

      // 3. Fetch institution memberships based on auth.uid()
      const { data: instData, error: instErr } = await supabase
        .from('institution_users')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (!instErr && instData) {
        setInstitutionMemberships(instData as InstitutionUser[]);
      } else {
        setInstitutionMemberships([]);
      }
    } catch (err: any) {
      console.error('Error fetching authenticated memberships from Supabase:', err);
    }
  }, []);

  // Supabase Auth listener & Session Restoration
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false);
      return;
    }

    // 1. Restore existing session
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (error) {
        console.error('Failed to restore Supabase session:', error);
        setAuthError(error.message);
      }
      setSession(initialSession);
      setAuthUser(initialSession?.user || null);
      if (initialSession?.user) {
        loadUserMemberships(initialSession.user.id);
      }
      setIsLoading(false);
    });

    // 2. Subscribe to auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setAuthUser(newSession?.user || null);
      setAuthError(null);
      if (newSession?.user) {
        await loadUserMemberships(newSession.user.id);
      } else {
        setAppProfile(null);
        setPlatformMembership(null);
        setInstitutionMemberships([]);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserMemberships]);

  // Real Supabase sign in
  const signInWithPassword = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.') };
    }
    setIsLoading(true);
    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
      setIsLoading(false);
      return { error };
    }
    setSession(data.session);
    setAuthUser(data.user);
    if (data.user) {
      await loadUserMemberships(data.user.id);
    }
    setIsLoading(false);
    return { error: null };
  };

  // Real Supabase sign up
  const signUpWithPassword = async (email: string, password: string, fullName: string) => {
    if (!supabase) {
      return { error: new Error('Supabase is not configured.') };
    }
    setIsLoading(true);
    setAuthError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) {
      setAuthError(error.message);
      setIsLoading(false);
      return { error };
    }

    // Provision user profile in public.users if session is immediately returned
    if (data.user) {
      await supabase.from('users').upsert({
        id: data.user.id,
        email: data.user.email,
        full_name: fullName,
      });
      await loadUserMemberships(data.user.id);
    }

    setIsLoading(false);
    return { error: null };
  };

  // Real Supabase sign out
  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setAuthUser(null);
    setAppProfile(null);
    setPlatformMembership(null);
    setInstitutionMemberships([]);
    localStorage.removeItem('acadeemia_sandbox_mode');
    setIsSandboxMode(false);
  };

  // Developer sandbox activation (used ONLY when Supabase credentials are not in environment)
  const enableSandboxMode = () => {
    localStorage.setItem('acadeemia_sandbox_mode', 'true');
    setIsSandboxMode(true);
  };

  // Verified platform administrator check (strictly database-backed, zero untrusted JWT claims)
  const isPlatformAdmin = Boolean(
    platformMembership &&
    platformMembership.status === 'active' &&
    ['platform_super_admin', 'platform_admin'].includes(platformMembership.role)
  );

  const isPlatformUser = Boolean(
    platformMembership && platformMembership.status === 'active'
  );

  return (
    <AuthContext.Provider
      value={{
        session,
        authUser,
        appProfile,
        platformMembership,
        institutionMemberships,
        isLoading,
        authError,
        isSupabaseConfigured,
        isPlatformAdmin,
        isPlatformUser,
        signInWithPassword,
        signUpWithPassword,
        signOut,
        isSandboxMode,
        enableSandboxMode,
        sandboxActiveRole,
        setSandboxActiveRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
