import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/index.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';

import { DEMO_PERSONAS } from '../lib/constants.ts';

interface AuthContextType {
  profile: UserProfile | null;
  role: UserRole;
  isLoading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password?: string, preferredRole?: UserRole) => Promise<void>;
  signUp: (email: string, password?: string, fullName?: string, role?: UserRole, organization?: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchDemoPersona: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('siteproof_active_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null; // Start unauthenticated so app lands on Login page
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isDemoMode = !isSupabaseConfigured || profile?.id?.startsWith('demo-') || false;

  useEffect(() => {
    if (profile) {
      localStorage.setItem('siteproof_active_profile', JSON.stringify(profile));
    } else {
      localStorage.removeItem('siteproof_active_profile');
    }
    setIsLoading(false);
  }, [profile]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && (!profile || !profile.id.startsWith('demo-'))) {
          const { data: userProfile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!error && userProfile) {
            setProfile(userProfile as UserProfile);
          }
        }
      } catch (err) {
        console.warn('Session check fallback:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user && (!profile || !profile.id.startsWith('demo-'))) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userProfile) {
          setProfile(userProfile as UserProfile);
        }
      } else if (!session) {
        // If logged out from Supabase, clear profile if not in explicit demo mode
        if (profile && !profile.id.startsWith('demo-')) {
          setProfile(null);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const switchDemoPersona = (newRole: UserRole) => {
    const targetPersona = DEMO_PERSONAS[newRole];
    setProfile(targetPersona);
  };

  const signIn = async (
    email: string,
    password = 'Password123!',
    preferredRole: UserRole = 'admin_inspector'
  ) => {
    setIsLoading(true);

    if (!isSupabaseConfigured) {
      // In offline/demo mode, match existing persona or preferred role
      const persona =
        Object.values(DEMO_PERSONAS).find(
          (p) => p.email.toLowerCase() === email.toLowerCase()
        ) || {
          ...DEMO_PERSONAS[preferredRole],
          email,
        };
      setProfile(persona);
      setIsLoading(false);
      return;
    }

    // Live Supabase Authentication
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (userProfile) {
          setProfile(userProfile as UserProfile);
        } else {
          // Create basic profile if none exists
          const fallbackProfile: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            full_name: data.user.user_metadata?.full_name || email.split('@')[0],
            role: (data.user.user_metadata?.role as UserRole) || preferredRole,
            organization: data.user.user_metadata?.organization || 'Construction Management',
            created_at: new Date().toISOString(),
          };
          await supabase.from('profiles').insert([fallbackProfile]);
          setProfile(fallbackProfile);
        }
      }
    } catch (err) {
      setIsLoading(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password = 'Password123!',
    fullName = 'New User',
    role: UserRole = 'contractor',
    organization = 'Independent Construction'
  ) => {
    setIsLoading(true);

    if (!isSupabaseConfigured) {
      const newProfile: UserProfile = {
        id: `demo-${Date.now()}`,
        email,
        full_name: fullName,
        role,
        organization,
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
        created_at: new Date().toISOString(),
      };
      setProfile(newProfile);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
            organization,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        const newProfile: UserProfile = {
          id: data.user.id,
          email,
          full_name: fullName,
          role,
          organization,
          avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
          created_at: new Date().toISOString(),
        };

        await supabase.from('profiles').insert([newProfile]);
        setProfile(newProfile);
      }
    } catch (err) {
      setIsLoading(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Signout warning:', err);
      }
    }
    setProfile(null);
    localStorage.removeItem('siteproof_active_profile');
  };

  const role: UserRole = profile?.role || 'contractor';

  return (
    <AuthContext.Provider
      value={{
        profile,
        role,
        isLoading,
        isDemoMode,
        signIn,
        signUp,
        signOut,
        switchDemoPersona,
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
