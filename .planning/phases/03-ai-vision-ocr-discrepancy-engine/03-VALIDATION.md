# Phase 3: AI Vision & OCR Discrepancy Engine - Validation Plan

## Validation Overview
This document specifies the validation criteria, automated test cases, and quality gates for Phase 3.

---

## 1. Quality Gates & Build Verification
- [ ] `npm run build` succeeds with zero TypeScript errors and zero warnings.
- [ ] Gemini API client gracefully handles missing keys with authentic fallback analysis.
- [ ] AI analysis results persist in `localStorage['siteproof_evidence']` and update `ProjectContext`.

---

## 2. Feature Acceptance Criteria (Nyquist Table)

| ID | Requirement | Test Action | Expected Result |
|---|---|---|---|
| **VAL-01** | Multimodal Vision Analysis | Run AI analysis on site photo | Returns structured JSON with visual stage, confidence score, detected elements, and progress % |
| **VAL-02** | Document OCR Extraction | Run AI analysis on delivery challan or invoice | Returns vendor name, document number, date, extracted quantities, and line items |
| **VAL-03** | 5-Stage Reconciliation | Trigger milestone AI reconciliation | Computes Ordered vs Delivered vs Billed vs Paid vs Consumed quantities per BOQ item |
| **VAL-04** | Discrepancy Detection | Reconcile milestone with mismatched quantities or duplicate invoice | Generates `DiscrepancyFlag` records with severity (`low`, `medium`, `high`, `critical`) and actionable explanation |
| **VAL-05** | Batch Milestone Analysis | Click "Analyze All Milestone Evidence with AI" | Sequentially analyzes all un-analyzed evidence and produces unified reconciliation report |
| **VAL-06** | AI Verification Badge Update | Check evidence cards after analysis | Status transitions from "Pending AI" to "AI Verified" with summary snippet |
| **VAL-07** | Custom Gemini Key Config | Open AI Settings modal and save API key | Persists key in `localStorage` and uses it for subsequent Gemini API calls |

---

## 3. Manual Verification Steps
1. Navigate to **Contractor Milestone Page** or **Inspector Project Details Page** (Milestone: *Pier 12 - Reinforcement & Shuttering*).
2. Click **"Run AI Milestone Audit & Verification"**.
3. Watch real-time AI processing indicators analyze site photos (rebar cage detection) and document OCR (Ultratech challan & Tata Tiscon invoice).
4. Inspect the generated **5-Stage Quantity Reconciliation Table**: verify Delivered (50 m³ concrete, 45 MT steel) vs Billed vs Ordered.
5. Review the **Discrepancy & Anomaly Warnings** banner: verify severity chips and detected discrepancies.
6. Open any analyzed evidence item in the **Lightbox Modal** — verify the AI Insights drawer displays detected elements and confidence score.
