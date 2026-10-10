import { describe, it, expect } from 'vitest';
import { isProjectAccessible, getRegisteredContractors, saveRegisteredContractor } from '../lib/projectAccess';
import { Project, UserProfile } from '../types';

describe('Project Privacy and Anonymity Isolation', () => {
  const mockInspectorOwner: UserProfile = {
    id: 'inspector-user-01',
    full_name: 'Inspector Smith',
    role: 'admin_inspector',
    email: 'smith@gov.in',
  };

  const mockOtherInspector: UserProfile = {
    id: 'inspector-user-02',
    full_name: 'Inspector Jones',
    role: 'admin_inspector',
    email: 'jones@gov.in',
  };

  const mockAssignedContractor: UserProfile = {
    id: 'contractor-user-01',
    full_name: 'Contractor Bob',
    role: 'contractor',
    email: 'bob@build.com',
  };

  const mockOtherContractor: UserProfile = {
    id: 'contractor-user-02',
    full_name: 'Contractor Alice',
    role: 'contractor',
    email: 'alice@build.com',
  };

  const mockProject: Project = {
    id: 'proj-confidential-01',
    code: 'CONF-01',
    title: 'Confidential Highway Bridge',
    description: 'Restricted infrastructure project',
    location: 'Nashik, Maharashtra',
    total_budget: 150000000,
    client_name: 'State Highway Authority',
    created_by: 'inspector-user-01',
    assigned_contractor_id: 'contractor-user-01',
    created_at: new Date().toISOString(),
  };

  it('allows access to the project creator/owner', () => {
    expect(isProjectAccessible(mockProject, mockInspectorOwner)).toBe(true);
  });

  it('allows access to the assigned contractor', () => {
    expect(isProjectAccessible(mockProject, mockAssignedContractor)).toBe(true);
  });

  it('denies access to an unrelated inspector / user (strict privacy isolation)', () => {
    expect(isProjectAccessible(mockProject, mockOtherInspector)).toBe(false);
  });

  it('denies access to an unassigned contractor', () => {
    expect(isProjectAccessible(mockProject, mockOtherContractor)).toBe(false);
  });

  it('denies access when unauthenticated or null profile', () => {
    expect(isProjectAccessible(mockProject, null)).toBe(false);
    expect(isProjectAccessible(mockProject, undefined)).toBe(false);
  });

  it('lists newly registered contractors for inspector selection', () => {

    const newContractor: UserProfile = {
      id: 'contractor-registered-99',
      email: 'builder.vikram@infrastructure.co.in',
      full_name: 'Vikram Patel',
      role: 'contractor',
      organization: 'Patel Heavy Civil Infra',
    };

    saveRegisteredContractor(newContractor);
    const contractorList = getRegisteredContractors();

    expect(contractorList.some((c) => c.id === 'contractor-registered-99')).toBe(true);
    expect(contractorList.some((c) => c.email === 'builder.vikram@infrastructure.co.in')).toBe(true);
  });
});
