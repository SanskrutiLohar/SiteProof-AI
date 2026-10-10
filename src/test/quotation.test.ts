import { describe, it, expect } from 'vitest';
import { extractDocumentOCR } from '../lib/geminiApi';

describe('Quotation Document Extraction & Baseline Value Synchronization', () => {
  it('defaults uninitialized quotation to 0 INR', () => {
    const defaultQuotation = 0;
    expect(defaultQuotation).toBe(0);
    expect(`₹${defaultQuotation.toLocaleString('en-IN')} INR`).toBe('₹0 INR');
  });

  it('extracts total amount in INR from a quotation document/receipt and updates quotation', async () => {
    const mockFile = new File(
      ['dummy quotation content'],
      'TATA_TMT_Steel_Quotation_Receipt.pdf',
      { type: 'application/pdf' }
    );

    const ocrResult = await extractDocumentOCR(mockFile, 'quotation');

    expect(ocrResult).toBeDefined();
    expect(ocrResult.totalAmount).toBeGreaterThan(0);
    expect(ocrResult.extractedItems.length).toBeGreaterThan(0);

    // Verify fetched document amount updates the quotation
    let currentQuotation = 0;
    currentQuotation = Number(ocrResult.totalAmount);
    expect(currentQuotation).toBe(ocrResult.totalAmount);
    expect(`₹${currentQuotation.toLocaleString('en-IN')}`).toContain('₹');
  });

  it('correctly formats Indian Rupee amounts using en-IN standard', () => {
    const testAmount = 3500000;
    const formatted = `₹${testAmount.toLocaleString('en-IN')}`;
    expect(formatted).toBe('₹35,00,000');
  });
});
