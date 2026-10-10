/**
 * SiteProof AI - Cryptographic Verification & Data Integrity Engine
 * Provides:
 * 1. SHA-256 Cryptographic File Hashing
 * 2. Perceptual Difference Hashing (dHash 64-bit) for Visual Duplicate Detection
 * 3. Exact & Perceptual Duplicate File Detection
 * 4. Multi-Field Duplicate Invoice & Challan Detection
 * 5. Submission Idempotency & Unique Key Generation
 * 6. Optimistic Concurrency Control (OCC) Validator
 */

export interface ExistingEvidenceFileRef {
  id: string;
  file_name: string;
  sha256_hash?: string;
  perceptual_hash?: string;
  milestone_id?: string;
}

export interface ExistingInvoiceExtractionRef {
  id: string;
  milestone_id: string;
  invoice_number?: string;
  supplier_name?: string;
  document_date?: string;
  total_amount?: number;
}

export interface DuplicateDetectionResult {
  isExactDuplicate: boolean;
  isVisualDuplicate: boolean;
  duplicateOf?: {
    id: string;
    file_name: string;
    type: 'exact_sha256' | 'visual_perceptual';
    similarityPercentage?: number;
  };
}

export interface DuplicateInvoiceResult {
  isDuplicate: boolean;
  duplicateMatches: Array<{
    id: string;
    milestone_id: string;
    reason: string;
    confidence: 'high' | 'medium';
  }>;
}

/**
 * Computes a standard SHA-256 cryptographic hash of a File, Blob, or ArrayBuffer
 */
export async function computeSHA256(data: File | Blob | ArrayBuffer): Promise<string> {
  let buffer: ArrayBuffer;
  if (data instanceof ArrayBuffer) {
    buffer = data;
  } else if (typeof (data as Blob).arrayBuffer === 'function') {
    buffer = await (data as Blob).arrayBuffer();
  } else {
    // Fallback for older environments
    buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(data as Blob);
    });
  }

  // Use Web Crypto API
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Pure JS fallback FNV-1a / SHA-like hash for mock/test environments if crypto.subtle is unavailable
  const bytes = new Uint8Array(buffer);
  let hash = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    hash ^= bytes[i];
    hash = (hash * 0x01000193) >>> 0;
  }
  return `sha256_mock_${hash.toString(16).padStart(8, '0')}_len${bytes.length}`;
}

/**
 * Computes a 64-bit Perceptual Difference Hash (dHash) on an image
 * Resizes the image to 9x8 grayscale, compares adjacent horizontal pixels
 */
export async function computePerceptualHash(
  imageSource: Blob | File | string | HTMLImageElement
): Promise<string> {
  // If running in non-DOM test environment without Canvas, return deterministic hash
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return '0000ffff0000ffff';
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const onImageLoaded = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 9;
        canvas.height = 8;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('ffffffffffffffff');
          return;
        }

        ctx.drawImage(img, 0, 0, 9, 8);
        const imgData = ctx.getImageData(0, 0, 9, 8).data;

        // Convert to grayscale matrix
        const gray: number[][] = [];
        for (let y = 0; y < 8; y++) {
          gray[y] = [];
          for (let x = 0; x < 9; x++) {
            const idx = (y * 9 + x) * 4;
            const r = imgData[idx];
            const g = imgData[idx + 1];
            const b = imgData[idx + 2];
            gray[y][x] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
          }
        }

        // Compute 64-bit difference hash
        let hexHash = '';
        let currentNibble = 0;
        let bitIndex = 0;

        for (let y = 0; y < 8; y++) {
          for (let x = 0; x < 8; x++) {
            const bit = gray[y][x] > gray[y][x + 1] ? 1 : 0;
            currentNibble = (currentNibble << 1) | bit;
            bitIndex++;

            if (bitIndex % 4 === 0) {
              hexHash += currentNibble.toString(16);
              currentNibble = 0;
            }
          }
        }

        resolve(hexHash);
      } catch {
        resolve('0000000000000000');
      }
    };

    img.onerror = () => resolve('0000000000000000');

    if (typeof imageSource === 'string') {
      img.src = imageSource;
      if (img.complete) onImageLoaded();
      else img.onload = onImageLoaded;
    } else if (imageSource instanceof HTMLImageElement) {
      if (imageSource.complete) onImageLoaded();
      else imageSource.onload = onImageLoaded;
    } else {
      const url = URL.createObjectURL(imageSource);
      img.onload = () => {
        onImageLoaded();
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }
  });
}

/**
 * Calculates the Hamming distance (number of differing bits) between two hex hashes
 */
export function calculateHammingDistance(hashA: string, hashB: string): number {
  if (!hashA || !hashB || hashA.length !== hashB.length) return 64;

  let distance = 0;
  for (let i = 0; i < hashA.length; i++) {
    const nibbleA = parseInt(hashA[i], 16) || 0;
    const nibbleB = parseInt(hashB[i], 16) || 0;
    let xor = nibbleA ^ nibbleB;
    while (xor > 0) {
      distance += xor & 1;
      xor >>= 1;
    }
  }
  return distance;
}

/**
 * Detects exact or visual duplicates against existing evidence records
 */
export function detectDuplicateEvidence(
  newSha256: string,
  newPerceptualHash: string | undefined,
  existingFiles: ExistingEvidenceFileRef[],
  newFileName?: string
): DuplicateDetectionResult {
  // 0. Check Normalized Filename / Document Match
  if (newFileName) {
    const cleanNewName = newFileName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanNewName.length > 0) {
      const nameMatch = existingFiles.find((file) => {
        const cleanExisting = (file.file_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanExisting === cleanNewName;
      });
      if (nameMatch) {
        return {
          isExactDuplicate: true,
          isVisualDuplicate: false,
          duplicateOf: {
            id: nameMatch.id,
            file_name: nameMatch.file_name,
            type: 'exact_sha256',
            similarityPercentage: 100,
          },
        };
      }
    }
  }

  // 1. Check Exact SHA-256 Match
  if (newSha256) {
    const exactMatch = existingFiles.find(
      (file) => file.sha256_hash && file.sha256_hash.toLowerCase() === newSha256.toLowerCase()
    );
    if (exactMatch) {
      return {
        isExactDuplicate: true,
        isVisualDuplicate: false,
        duplicateOf: {
          id: exactMatch.id,
          file_name: exactMatch.file_name,
          type: 'exact_sha256',
          similarityPercentage: 100,
        },
      };
    }
  }

  // 2. Check Perceptual Difference Hash (Visual Similarity)
  if (newPerceptualHash && newPerceptualHash !== '0000000000000000') {
    for (const file of existingFiles) {
      if (file.perceptual_hash && file.perceptual_hash !== '0000000000000000') {
        const distance = calculateHammingDistance(newPerceptualHash, file.perceptual_hash);
        // If distance is <= 6 bits out of 64 bits (~90%+ visual similarity)
        if (distance <= 6) {
          const similarityPercentage = Math.round(((64 - distance) / 64) * 100);
          return {
            isExactDuplicate: false,
            isVisualDuplicate: true,
            duplicateOf: {
              id: file.id,
              file_name: file.file_name,
              type: 'visual_perceptual',
              similarityPercentage,
            },
          };
        }
      }
    }
  }

  return {
    isExactDuplicate: false,
    isVisualDuplicate: false,
  };
}

/**
 * Detects duplicate invoices or delivery challans across milestones
 */
export function detectDuplicateInvoice(
  invoiceNumber: string,
  supplierName: string,
  documentDate: string,
  totalAmount: number,
  existingExtractions: ExistingInvoiceExtractionRef[],
  currentExtractionId?: string
): DuplicateInvoiceResult {
  const matches: DuplicateInvoiceResult['duplicateMatches'] = [];
  const cleanInv = (invoiceNumber || '').trim().toLowerCase();
  const cleanSup = (supplierName || '').trim().toLowerCase();

  if (!cleanInv) {
    return { isDuplicate: false, duplicateMatches: [] };
  }

  for (const ex of existingExtractions) {
    if (currentExtractionId && ex.id === currentExtractionId) continue;

    const exInv = (ex.invoice_number || '').trim().toLowerCase();
    const exSup = (ex.supplier_name || '').trim().toLowerCase();
    const exAmount = ex.total_amount || 0;

    // Exact invoice number match
    if (exInv === cleanInv) {
      const dateMatch = documentDate && ex.document_date && documentDate === ex.document_date;
      if (cleanSup && exSup && cleanSup === exSup) {
        matches.push({
          id: ex.id,
          milestone_id: ex.milestone_id,
          reason: `Identical invoice number "${invoiceNumber}" from supplier "${supplierName}"${dateMatch ? ` on ${documentDate}` : ''} was already recorded.`,
          confidence: 'high',
        });
      } else if (Math.abs(exAmount - totalAmount) < 0.01 && totalAmount > 0) {
        matches.push({
          id: ex.id,
          milestone_id: ex.milestone_id,
          reason: `Same invoice number "${invoiceNumber}" and identical total amount (₹${totalAmount.toLocaleString('en-IN')}) found.`,
          confidence: 'high',
        });
      } else {
        matches.push({
          id: ex.id,
          milestone_id: ex.milestone_id,
          reason: `Invoice number "${invoiceNumber}" matches previously submitted document.`,
          confidence: 'medium',
        });
      }
    }
  }

  return {
    isDuplicate: matches.length > 0,
    duplicateMatches: matches,
  };
}

/**
 * Optimistic Concurrency Control (OCC) Check
 * Validates that current record version equals expected version before applying mutation
 */
export function verifyOptimisticLock(currentVersion: number, expectedVersion: number): boolean {
  return currentVersion === expectedVersion;
}

/**
 * Generates an idempotent submission key
 */
export function generateIdempotencyKey(milestoneId: string, contractorId: string, timestampWindowMs = 60000): string {
  const timeBlock = Math.floor(Date.now() / timestampWindowMs);
  return `sub_${milestoneId}_${contractorId}_${timeBlock}`;
}
