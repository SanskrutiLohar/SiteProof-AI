import { UserProfile, UserRole } from '../types/index.ts';

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
