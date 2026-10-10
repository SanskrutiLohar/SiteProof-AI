import { Project, UserProfile } from '../types/index.ts';
import { INITIAL_CONTRACTORS } from './seedData.ts';

const inMemoryRegisteredContractors: UserProfile[] = [];

export function getInMemoryContractors(): UserProfile[] {
  return inMemoryRegisteredContractors;
}

export function saveRegisteredContractor(contractorProfile: UserProfile): void {
  if (!contractorProfile || contractorProfile.role !== 'contractor') return;
  try {
    const memIndex = inMemoryRegisteredContractors.findIndex(
      (c) => c.id === contractorProfile.id || (c.email && c.email.toLowerCase() === contractorProfile.email.toLowerCase())
    );
    if (memIndex >= 0) {
      inMemoryRegisteredContractors[memIndex] = { ...inMemoryRegisteredContractors[memIndex], ...contractorProfile };
    } else {
      inMemoryRegisteredContractors.push(contractorProfile);
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('siteproof_registered_contractors');
      const contractors: UserProfile[] = saved ? JSON.parse(saved) : [...INITIAL_CONTRACTORS];
      const index = contractors.findIndex(
        (c) => c.id === contractorProfile.id || (c.email && c.email.toLowerCase() === contractorProfile.email.toLowerCase())
      );
      if (index >= 0) {
        contractors[index] = { ...contractors[index], ...contractorProfile };
      } else {
        contractors.push(contractorProfile);
      }
      localStorage.setItem('siteproof_registered_contractors', JSON.stringify(contractors));
      window.dispatchEvent(new CustomEvent('siteproof_contractors_updated', { detail: contractors }));
    }
  } catch (e) {
    console.warn('Error saving registered contractor:', e);
  }
}

export const isProjectAccessible = (project: Project, profile?: UserProfile | null): boolean => {
  if (!project || !profile) return false;
  if (project.created_by && project.created_by === profile.id) return true;
  if (project.assigned_contractor_id && project.assigned_contractor_id === profile.id) return true;
  return false;
};

export const getRegisteredContractors = (): UserProfile[] => {
  try {
    const saved = typeof window !== 'undefined' && window.localStorage ? localStorage.getItem('siteproof_registered_contractors') : null;
    const registered: UserProfile[] = saved ? JSON.parse(saved) : [];

    const map = new Map<string, UserProfile>();
    INITIAL_CONTRACTORS.forEach((c) => map.set(c.id, c));
    registered.forEach((c) => {
      if (c && c.role === 'contractor') {
        map.set(c.id, c);
      }
    });
    inMemoryRegisteredContractors.forEach((c) => {
      if (c && c.role === 'contractor') {
        map.set(c.id, c);
      }
    });
    return Array.from(map.values());
  } catch {
    return INITIAL_CONTRACTORS;
  }
};
