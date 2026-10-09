import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/index.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';

export const DEMO_PERSONAS: Record<UserRole, UserProfile> = {
  admin_inspector: {
    id: 'demo-inspector-01',
    email: 'inspector@siteproof.ai',
    full_name: 'David Vance (Senior Lead Auditor)',
    role: 'admin_inspector',
    organization: 'National Infrastructure Verification Board',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  contractor: {
    id: 'demo-contractor-01',
    email: 'sitelead@buildcorp.com',
    full_name: 'Rajesh Kumar (Project Manager)',
    role: 'contractor',
    organization: 'BuildCorp Infrastructure Ltd',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
};

interface AuthContextType {
  profile: UserProfile | null;
  role: UserRole;
  isLoading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, role?: UserRole) => Promise<void>;
  signUp: (email: string, fullName: string, role: UserRole, organization?: string) => Promise<void>;
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
        return DEMO_PERSONAS.admin_inspector;
      }
    }
    return DEMO_PERSONAS.admin_inspector;
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
        if (session?.user && !profile?.id.startsWith('demo-')) {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userProfile) {
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
      if (session?.user && !profile?.id.startsWith('demo-')) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userProfile) {
          setProfile(userProfile as UserProfile);
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

  const signIn = async (email: string, preferredRole: UserRole = 'admin_inspector') => {
    setIsLoading(true);
    if (!isSupabaseConfigured) {
      const persona = Object.values(DEMO_PERSONAS).find(p => p.email.toLowerCase() === email.toLowerCase()) 
        || DEMO_PERSONAS[preferredRole];
      setProfile(persona);
      setIsLoading(false);
      return;
    }

    // In live Supabase mode, standard login
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: 'Password123!',
      });
      if (error) throw error;
      if (data.user) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        if (userProfile) setProfile(userProfile as UserProfile);
      }
    } catch {
      // Fallback for demonstration
      setProfile(DEMO_PERSONAS[preferredRole]);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, fullName: string, role: UserRole, organization = 'Independent Construction') => {
    setIsLoading(true);
    const newProfile: UserProfile = {
      id: `usr-${Date.now()}`,
      email,
      full_name: fullName,
      role,
      organization,
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
      created_at: new Date().toISOString(),
    };
    setProfile(newProfile);
    setIsLoading(false);
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setProfile(null);
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
