import { Project, Milestone, BOQItem, UserProfile } from '../types/index.ts';

export const INITIAL_CONTRACTORS: UserProfile[] = [
  {
    id: 'demo-contractor-01',
    email: 'sitelead@buildcorp.com',
    full_name: 'Rajesh Kumar (BuildCorp Lead)',
    role: 'contractor',
    organization: 'BuildCorp Infrastructure Ltd',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'contractor-02',
    email: 'contact@apex-structures.com',
    full_name: 'Sarah Chen (Apex Lead)',
    role: 'contractor',
    organization: 'Apex Civil Engineering Ltd',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
];

export const INITIAL_BOQ_ITEMS: BOQItem[] = [
  {
    id: 'boq-nsk-01',
    milestone_id: 'm-nsk-01',
    item_code: 'BOQ-STL-01',
    description: 'Fe-500D High-Yield Thermo-Mechanically Treated Rebars (16mm & 25mm)',
    unit: 'Metric Ton',
    quantity_ordered: 120.0,
    quantity_delivered: 0,
    quantity_billed: 0,
    quantity_paid: 0,
    quantity_consumed: 0,
    unit_rate: 850.0,
    notes: 'IS 1786 grade compliant rebar'
  },
  {
    id: 'boq-nsk-02',
    milestone_id: 'm-nsk-01',
    item_code: 'BOQ-CNC-01',
    description: 'M-40 Grade Ready-Mix Concrete for Pier Column Casting',
    unit: 'Cum',
    quantity_ordered: 650.0,
    quantity_delivered: 0,
    quantity_billed: 0,
    quantity_paid: 0,
    quantity_consumed: 0,
    unit_rate: 140.0,
    notes: '28-day target strength 48 MPa'
  },
  {
    id: 'boq-nsk-03',
    milestone_id: 'm-nsk-01',
    item_code: 'BOQ-FRM-01',
    description: 'Waterproof Film-Faced Plywood Shuttering & Staging Formwork',
    unit: 'Sqm',
    quantity_ordered: 800.0,
    quantity_delivered: 0,
    quantity_billed: 0,
    quantity_paid: 0,
    quantity_consumed: 0,
    unit_rate: 45.0,
    notes: 'Vertical collar staging'
  }
];

export const INITIAL_MILESTONES: Milestone[] = [
  {
    id: 'm-nsk-01',
    project_id: 'proj-nsk-01',
    title: 'Milestone 1: Pier Foundation & Rebar Cage Assembly',
    description: 'Structural inspection and audit of foundation pier rebars, tie stirrup spacing, and M40 concrete pour at Nashik site.',
    sequence_order: 1,
    weight_percentage: 50,
    target_date: '2026-11-20',
    status: 'in_progress',
    created_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 'm-nsk-02',
    project_id: 'proj-nsk-01',
    title: 'Milestone 2: Pier Cap Pre-stressing & Bearing Placement',
    description: 'Pre-stressing cable tensioning, POT-PTFE bearing pads alignment, and superstructure pier cap curing.',
    sequence_order: 2,
    weight_percentage: 50,
    target_date: '2026-12-15',
    status: 'pending',
    created_at: '2026-10-01T00:00:00Z',
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-nsk-01',
    title: 'Nashik Smart Infrastructure Elevated Viaduct — Sector 4',
    code: 'NSK-VIA-01',
    description: 'Civil construction, rebar verification, and milestone audit for elevated flyover corridor in Nashik.',
    location: 'Nashik, Maharashtra',
    client_name: 'National Highway Infrastructure Board (Nashik Division)',
    total_budget: 3500000,
    assigned_contractor_id: 'demo-contractor-01',
    assigned_contractor_name: 'Rajesh Kumar (BuildCorp Lead)',
    created_by: 'demo-inspector-01',
    created_at: '2026-10-01T00:00:00Z',
  }
];
