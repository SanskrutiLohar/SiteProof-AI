import { describe, it, expect } from 'vitest';
import { 
  computeSHA256, 
  calculateHammingDistance, 
  detectDuplicateEvidence, 
  detectDuplicateInvoice,
  verifyOptimisticLock,
  generateIdempotencyKey
} from '../lib/integrityEngine.ts';
import { performMilestoneReconciliation } from '../lib/reconciliationEngine.ts';
import { BOQItem, EvidenceItem } from '../types/index.ts';

describe('SiteProof AI - Cryptographic Verification & Data Integrity Suite', () => {
  // Test 1: SHA-256 Hashing
  it('computes deterministic SHA-256 hashes for data buffers', async () => {
    const encoder = new TextEncoder();
    const data = encoder.encode('SiteProof-AI-Evidence-Testing-2026');
    const hash1 = await computeSHA256(data.buffer);
    const hash2 = await computeSHA256(data.buffer);

    expect(hash1).toBeDefined();
    expect(hash1.length).toBe(64);
    expect(hash1).toBe(hash2);
  });

  // Test 2: Hamming Distance for Perceptual Hash
  it('calculates accurate Hamming distance between 64-bit hex difference hashes', () => {
    const hashA = 'ffff0000ffff0000';
    const hashB = 'ffff0000ffff0000';
    expect(calculateHammingDistance(hashA, hashB)).toBe(0);

    const hashC = 'ffff0000ffff0001'; // 1 bit flip
    expect(calculateHammingDistance(hashA, hashC)).toBe(1);

    const hashD = '0000ffff0000ffff'; // all 64 bits inverted
    expect(calculateHammingDistance(hashA, hashD)).toBe(64);
  });

  // Test 3: Duplicate Evidence Detection (Exact SHA-256)
  it('detects exact duplicate file uploads using SHA-256', () => {
    const existingFiles = [
      {
        id: 'ev-01',
        file_name: 'Pier12_Rebar_Inspection.jpg',
        sha256_hash: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
      },
    ];

    const result = detectDuplicateEvidence(
      'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
      undefined,
      existingFiles
    );

    expect(result.isExactDuplicate).toBe(true);
    expect(result.duplicateOf?.id).toBe('ev-01');
    expect(result.duplicateOf?.type).toBe('exact_sha256');
  });

  // Test 3b: Duplicate Delivery Challan Detection by Filename
  it('detects duplicate delivery challans uploaded for the same phase by filename', () => {
    const existingFiles = [
      {
        id: 'ev-challan-101',
        file_name: 'Tata_Steel_Challan_45MT.pdf',
        sha256_hash: 'hash_101',
      },
    ];

    const result = detectDuplicateEvidence(
      'different_hash_999',
      undefined,
      existingFiles,
      'tata-steel-challan-45mt.pdf'
    );

    expect(result.isExactDuplicate).toBe(true);
    expect(result.duplicateOf?.id).toBe('ev-challan-101');
    expect(result.duplicateOf?.file_name).toBe('Tata_Steel_Challan_45MT.pdf');
  });

  // Test 4: Visual Duplicate Detection (Perceptual dHash)
  it('detects visually similar photos with low Hamming distance', () => {
    const existingFiles = [
      {
        id: 'ev-02',
        file_name: 'Pier12_Concrete_Pour.jpg',
        sha256_hash: '1111111111111111111111111111111111111111111111111111111111111111',
        perceptual_hash: 'f0f0f0f0f0f0f0f0',
      },
    ];

    const result = detectDuplicateEvidence(
      '2222222222222222222222222222222222222222222222222222222222222222',
      'f0f0f0f0f0f0f0f1', // Hamming distance = 1
      existingFiles
    );

    expect(result.isExactDuplicate).toBe(false);
    expect(result.isVisualDuplicate).toBe(true);
    expect(result.duplicateOf?.id).toBe('ev-02');
    expect(result.duplicateOf?.type).toBe('visual_perceptual');
    expect(result.duplicateOf?.similarityPercentage).toBeGreaterThanOrEqual(95);
  });

  // Test 5: Multi-Field Duplicate Invoice Detection
  it('flags potential duplicate supplier invoices across submissions', () => {
    const existingExtractions = [
      {
        id: 'ext-01',
        milestone_id: 'm-01',
        invoice_number: 'INV-2026-TMT-8842',
        supplier_name: 'Tata Steel Ltd',
        document_date: '2026-10-06',
        total_amount: 1572000,
      },
    ];

    const result = detectDuplicateInvoice(
      'INV-2026-TMT-8842',
      'Tata Steel Ltd',
      '2026-10-06',
      1572000,
      existingExtractions
    );

    expect(result.isDuplicate).toBe(true);
    expect(result.duplicateMatches.length).toBe(1);
    expect(result.duplicateMatches[0].confidence).toBe('high');
  });

  // Test 6: Optimistic Concurrency Control (OCC)
  it('enforces optimistic concurrency locks and rejects stale updates', () => {
    expect(verifyOptimisticLock(1, 1)).toBe(true);
    expect(verifyOptimisticLock(2, 1)).toBe(false); // Stale version rejected
    expect(verifyOptimisticLock(3, 2)).toBe(false);
  });

  // Test 7: Idempotency Key Generation
  it('generates deterministic idempotency keys within identical time windows', () => {
    const key1 = generateIdempotencyKey('m-01', 'cont-01', 60000);
    const key2 = generateIdempotencyKey('m-01', 'cont-01', 60000);
    expect(key1).toBe(key2);
    expect(key1.startsWith('sub_m-01_cont-01_')).toBe(true);
  });

  // Test 8: 5-Stage Contractual Quantity Reconciliation
  it('reconciles BOQ baseline against delivered challans, invoices, and consumed quantities', () => {
    const boqs: BOQItem[] = [
      {
        id: 'boq-01',
        milestone_id: 'm-01',
        item_code: 'BOQ-RBR-01',
        description: 'Fe500D TMT Steel Rebar',
        unit: 'MT',
        quantity_ordered: 50,
        quantity_delivered: 45,
        quantity_billed: 45,
        quantity_paid: 45,
        quantity_consumed: 43,
        unit_rate: 72000,
      },
    ];

    const evidence: EvidenceItem[] = [
      {
        id: 'ev-photo-01',
        milestone_id: 'm-01',
        project_id: 'proj-01',
        uploaded_by: 'cont-01',
        type: 'photo',
        file_url: 'https://example.com/photo.jpg',
        file_name: 'Rebar_Pier12.jpg',
        uploaded_at: new Date().toISOString(),
        ai_analyzed: true,
      },
      {
        id: 'ev-chal-01',
        milestone_id: 'm-01',
        project_id: 'proj-01',
        uploaded_by: 'cont-01',
        type: 'challan',
        file_url: 'https://example.com/challan.pdf',
        file_name: 'Tata_Challan_45MT.pdf',
        uploaded_at: new Date().toISOString(),
        ai_analyzed: true,
      },
    ];

    const { report, discrepancies } = performMilestoneReconciliation('m-01', boqs, evidence);

    expect(report).toBeDefined();
    expect(report.totalOrderedValue).toBe(50 * 72000);
    expect(report.itemReconciliations.length).toBe(1);
    expect(report.itemReconciliations[0].ordered).toBe(50);
    expect(report.itemReconciliations[0].delivered).toBe(45);
    expect(report.itemReconciliations[0].consumed).toBe(43);
    // Under-delivery should be flagged
    expect(discrepancies.length).toBeGreaterThan(0);
    expect(discrepancies.some(d => d.flag_type === 'quantity_mismatch')).toBe(true);
  });
});
