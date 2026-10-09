/**
 * Types & Data Contracts for AI Vision & OCR Discrepancy Engine
 */

export interface VisionAnalysisResult {
  visualStage: string;
  confidence: number; // 0 - 100
  detectedElements: string[];
  progressEstimatePercentage: number; // 0 - 100
  safetyObservations: string[];
  structuralCondition: 'optimal' | 'satisfactory' | 'requires_attention' | 'critical_defect';
  summary: string;
  analyzedAt: string;
}

export interface ExtractedLineItem {
  description: string;
  quantity: number;
  unit: string;
  unitRate?: number;
  totalAmount?: number;
  matchedBOQItemCode?: string;
}

export interface DocumentOCRResult {
  documentType: 'challan' | 'invoice' | 'inspection_report';
  vendorName: string;
  documentNumber: string;
  documentDate: string;
  extractedItems: ExtractedLineItem[];
  totalAmount?: number;
  taxAmount?: number;
  confidence: number; // 0 - 100
  summary: string;
  analyzedAt: string;
}

export interface AIAnalysisResult {
  evidenceId: string;
  type: 'vision' | 'ocr';
  visionData?: VisionAnalysisResult;
  ocrData?: DocumentOCRResult;
  rawSummary: string;
  confidence: number;
}

export interface MilestoneReconciliationReport {
  milestoneId: string;
  overallConfidence: number;
  totalOrderedValue: number;
  totalDeliveredValue: number;
  totalBilledValue: number;
  totalPaidValue: number;
  stageProgressPercentage: number;
  itemReconciliations: Array<{
    boqItemId: string;
    itemCode: string;
    description: string;
    unit: string;
    ordered: number;
    delivered: number;
    billed: number;
    paid: number;
    consumed: number;
    varianceDeliveredVsOrdered: number;
    varianceBilledVsDelivered: number;
    status: 'match' | 'minor_variance' | 'major_discrepancy';
  }>;
  analyzedItemCount: number;
  discrepancyCount: number;
  generatedAt: string;
}
