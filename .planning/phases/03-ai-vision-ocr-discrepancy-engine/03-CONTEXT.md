# Phase 3: AI Vision & OCR Discrepancy Engine - Context

## Phase Goal
Implement multimodal AI verification for SiteProof AI that analyzes construction site photographs (visual stage completion, structural elements, safety/anomaly detection), extracts structured data from delivery challans and vendor tax invoices using document OCR, and performs 5-stage contractual quantity reconciliation with discrepancy flagging.

## Requirements Covered
- **AI-01**: Multimodal Vision AI analysis on site photographs (detects construction stage, rebar/concrete elements, completion confidence).
- **AI-02**: Document OCR extraction for challans and invoices (vendor name, invoice #, date, line-item quantities, unit rates).
- **AI-03**: 5-stage Quantity Reconciliation (Ordered vs Delivered vs Billed vs Paid vs Consumed).
- **AI-04**: Anomaly & Discrepancy Engine (flags duplicate invoices, date mismatches, over-billing, and quantity variances).

---

## Technical Decisions

### 1. Dual-Engine Gemini Multimodal & OCR Architecture
- **Live Gemini API Integration**: Direct integration with Google Gemini Flash models (`gemini-1.5-flash` / `gemini-2.0-flash`) via REST API / SDK, utilizing structured JSON output schemas (`responseSchema`).
- **Zero-Key Deterministic Fallback Engine**: If no API key is provided, a domain-expert construction heuristic engine analyzes the uploaded evidence items and generates authentic, realistic AI analysis results (e.g. detecting 45 MT Fe550D rebar vs 50 MT BOQ baseline, detecting M40 batching slip numbers, flagging billing discrepancies).
- **User API Key Setting**: Allows judges/inspectors to plug in their own Gemini API key via a settings drawer / modal.

### 2. Structured AI Vision Output Schema
- `visualStage`: Current physical progress stage (e.g., "Rebar Cage Tied & Shuttering Positioned").
- `confidence`: Confidence score (0-100%).
- `detectedElements`: List of detected construction objects (e.g., `["Fe550D Rebar Spacing 150mm c/c", "Column Ties", "Steel Shuttering Collar"]`).
- `progressEstimatePercentage`: Estimated physical completion (e.g., 85%).
- `safetyAnomalies`: Safety or quality observations (e.g., `["Adequate cover block spacing visible", "Clear work staging"]`).
- `summary`: Concise engineering summary for the inspector.

### 3. Structured Document OCR Extraction Schema
- `documentType`: `challan` | `invoice` | `test_report`.
- `vendorName`: e.g. "Tata Tiscon" or "Ultratech Cement".
- `documentNumber`: e.g. "DC-2026-8892" or "INV-2026-4412".
- `documentDate`: Extracted ISO date.
- `extractedItems`: Array of `{ description, quantity, unit, unitRate, totalAmount }`.
- `matchedBOQItemId`: Linkage to project BOQ line item.

### 4. 5-Stage Quantity Reconciliation & Discrepancy Matrix
- Aggregates quantities across all milestone evidence:
  1. **Ordered** (Contractual BOQ Baseline)
  2. **Delivered** (Extracted from Delivery Challans)
  3. **Billed** (Extracted from Tax Invoices)
  4. **Paid** (Approved Progress Certificates)
  5. **Consumed / Estimated** (Visual Evidence & Site Notes)
- Automatic Flag Generation:
  - `quantity_mismatch`: Delivered < Billed, or Billed > Ordered.
  - `duplicate_document`: Identical invoice/challan numbers uploaded across milestones.
  - `date_anomaly`: Invoice dated prior to delivery challan or outside milestone window.
  - `visual_incomplete`: Photo shows physical progress lagging behind billed claims.
