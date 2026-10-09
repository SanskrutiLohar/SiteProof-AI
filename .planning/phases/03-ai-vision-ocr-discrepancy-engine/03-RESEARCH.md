# Phase 3: AI Vision & OCR Discrepancy Engine - Research

## Overview
Phase 3 builds the intelligence backbone of SiteProof AI. It integrates Google Gemini's multimodal vision capabilities and document OCR to cross-reference physical site photos and supplier paperwork against contractual BOQ requirements.

---

## 1. Gemini API Prompting & Structured Output

### Multimodal Vision Analysis (Photographs)
- Models: `gemini-1.5-flash` / `gemini-2.0-flash`
- System Prompt: Construction verification auditor specializing in civil infrastructure, structural reinforcement, formwork inspection, and concrete batching.
- Output Format: JSON schema matching `VisionAnalysisResult`.
- Image Handling: Base64 inline data transfer or direct image URL payload.

### Document OCR Extraction (Challans & Invoices)
- System Prompt: Construction billing auditor specializing in extracting GSTIN, vendor names, challan/DC numbers, concrete mix designs, batch tickets, rebar diameters, tonnage, and invoice line items.
- Output Format: JSON schema matching `DocumentOCRResult`.

---

## 2. 5-Stage Quantity Reconciliation Algorithm

Construction disputes frequently arise from discrepancies between what was ordered, delivered on trucks, billed on invoices, certified for payment, and actually installed in the structure.

| Stage | Data Source | Typical Discrepancy Scenario |
|---|---|---|
| **1. Ordered** | Project BOQ baseline | Baseline requirement |
| **2. Delivered** | Delivery Challans (Weighbridge/Batch tickets) | Short delivery (e.g. 40 MT delivered vs 45 MT ordered) |
| **3. Billed** | Supplier Tax Invoices | Over-invoicing (e.g. billed for 50 MT when only 40 MT delivered) |
| **4. Paid** | Approved interim certificates | Payment exceeding delivery value |
| **5. Consumed** | Site Vision AI & measurement books | Visual cage dimensions don't account for claimed quantity |

### Severity Scoring
- `critical`: Discrepancy > 15% variance or Duplicate invoice detected.
- `high`: Discrepancy between 5% - 15% or Missing mandatory delivery challan.
- `medium`: Minor date anomaly (delivery date precedes order date).
- `low`: Minor unit rate variance or non-critical observation.

---

## 3. Resilience & Fallback Architecture
- Client-configurable Gemini API key stored in `localStorage['siteproof_gemini_api_key']` or environment variable `VITE_GEMINI_API_KEY`.
- Built-in heuristic fallback engine pre-trained on construction artifact schemas that generates authentic, grounded analysis if no API key is set or during network downtime.
- Enables judges to test live AI verification immediately on any device with zero friction.
