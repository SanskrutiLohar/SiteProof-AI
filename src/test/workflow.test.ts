import { describe, it, expect } from 'vitest';
import { 
  detectDuplicateInvoice, 
  generateIdempotencyKey 
} from '../lib/integrityEngine.ts';
import { DEMO_PERSONAS } from '../lib/constants.ts';
import { INITIAL_PROJECTS, INITIAL_MILESTONES, INITIAL_BOQ_ITEMS } from '../lib/seedData.ts';
import { generateSampleEvidenceForMilestone } from '../lib/sampleEvidence.ts';

describe('SiteProof AI - Full System Workflow & Domain Integrity Tests', () => {
  // Test 1: Persona definitions
  it('provides valid inspector and contractor demo personas with proper roles', () => {
    expect(DEMO_PERSONAS.admin_inspector).toBeDefined();
    expect(DEMO_PERSONAS.admin_inspector.role).toBe('admin_inspector');
    expect(DEMO_PERSONAS.contractor).toBeDefined();
    expect(DEMO_PERSONAS.contractor.role).toBe('contractor');
  });

  // Test 2: Project and BOQ Seed data consistency
  it('verifies seed projects and milestones are linked and contain BOQ baselines', () => {
    expect(INITIAL_PROJECTS.length).toBeGreaterThan(0);
    const proj = INITIAL_PROJECTS[0];
    expect(proj.code).toBeDefined();

    const projMilestones = INITIAL_MILESTONES.filter(m => m.project_id === proj.id);
    expect(projMilestones.length).toBeGreaterThan(0);

    const boqs = INITIAL_BOQ_ITEMS.filter(b => b.milestone_id === projMilestones[0].id);
    expect(boqs.length).toBeGreaterThan(0);
    expect(boqs[0].quantity_ordered).toBeGreaterThan(0);
  });

  // Test 3: Sample Evidence Generator produces valid authentic data
  it('generates sample evidence with authentic EXIF GPS and categories', () => {
    const generated = generateSampleEvidenceForMilestone('m-test-01', 'proj-test-01');
    expect(generated.length).toBeGreaterThan(0);
    
    const photos = generated.filter(e => e.type === 'photo');
    expect(photos.length).toBeGreaterThan(0);
    expect(photos[0].latitude).toBeDefined();
    expect(photos[0].longitude).toBeDefined();
    expect(photos[0].ai_analyzed).toBe(true);
  });

  // Test 4: Duplicate Invoice detection with case insensitivity and whitespace trimming
  it('flags duplicate invoices across different cases and whitespace formatting', () => {
    const extractions = [
      {
        id: 'ext-tata-01',
        milestone_id: 'm-01',
        invoice_number: 'INV-2026-TMT-8842',
        supplier_name: 'Tata Steel Ltd',
        document_date: '2026-10-06',
        total_amount: 1572000,
      }
    ];

    const dupCheck = detectDuplicateInvoice(
      '  inv-2026-tmt-8842  ',
      'TATA STEEL LTD',
      '2026-10-06',
      1572000,
      extractions
    );

    expect(dupCheck.isDuplicate).toBe(true);
    expect(dupCheck.duplicateMatches[0].id).toBe('ext-tata-01');
  });

  // Test 5: Idempotent Submission Key uniqueness and windowing
  it('generates distinct idempotency keys for different milestones or contractor IDs', () => {
    const keyA = generateIdempotencyKey('m-01', 'cont-01');
    const keyB = generateIdempotencyKey('m-02', 'cont-01');
    const keyC = generateIdempotencyKey('m-01', 'cont-02');

    expect(keyA).not.toBe(keyB);
    expect(keyA).not.toBe(keyC);
  });

  // Test 6: Contractor Project Milestone resolution
  it('resolves project milestones for contractor evidence intake', () => {
    const project = INITIAL_PROJECTS[0];
    const projectMilestones = INITIAL_MILESTONES.filter(m => m.project_id === project.id);
    expect(projectMilestones.length).toBeGreaterThan(0);
    expect(projectMilestones[0].id).toBeDefined();
    expect(projectMilestones[0].sequence_order).toBe(1);
  });
});
