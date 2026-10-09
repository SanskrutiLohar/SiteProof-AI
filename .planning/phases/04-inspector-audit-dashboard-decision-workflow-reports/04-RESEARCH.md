# Phase 4: Inspector Audit Dashboard, Decision Workflow & Reports - Research

## Overview
Phase 4 provides the decision-making and compliance layer for SiteProof AI. It empowers certified inspectors to conduct structured side-by-side verification audits, record human-in-the-loop approvals/rejections, schedule physical on-site inspections, maintain an immutable audit trail, and export print-ready verified audit reports.

---

## 1. Side-by-Side Dual Pane Verification Architecture

### Design & Usability
- **Dual Synchronized Panes**:
  - **Left Pane (Physical Site Progress)**: High-resolution site photographs, GPS coordinates, EXIF capture time, and Multimodal Vision AI detections (rebar diameter, spacing, cover, formwork alignment).
  - **Right Pane (Commercial Documentation)**: Delivery challans, vendor tax invoices, test certificates, and extracted OCR line items.
- **Discrepancy Marker Indicators**: Visual alert badges pinpointing variances (e.g. 45 MT steel delivered vs 50 MT ordered) with 1-click resolution actions.
- **Inspection Checklist**: Pre-flight verification checklist for the inspector before making a binding decision.

---

## 2. Certified Human-in-the-Loop Decision Guardrails

### Decision Actions
1. **Approve Milestone**:
   - Requires certified lead inspector name & digital verification signature.
   - Enforces a guardrail check: if any open `critical` severity discrepancy flags exist, prompts warning and requires explicit override rationale or prior resolution.
   - Sets milestone status to `verified`.
2. **Reject Milestone**:
   - Requires mandatory rejection justification and clear remediation requirements for the contractor.
   - Sets milestone status to `rejected`.
3. **Request Additional Evidence**:
   - Allows inspector to ask for specific missing artifacts (e.g. "Please upload weighing slip for transit mixer #4") without resetting progress.

---

## 3. Physical Site Inspection Scheduling

### Schema & Workflow
- Model: `InspectionSchedule` (`milestone_id`, `project_id`, `inspector_name`, `scheduled_date`, `location`, `checklist_items`, `status`).
- Enables lead auditor to schedule physical site visits when visual or document evidence requires physical testing (rebound hammer test, slump test, core sampling).
- Calendar and list view with status indicators (`scheduled`, `completed`, `cancelled`).

---

## 4. Print-Ready Verified Audit Report Generation

### Official Certificate Structure
- Authority Header: *National Infrastructure Verification & Safety Board*.
- Project & Milestone Details with Contract Codes and Total Value.
- 5-Stage Contractual Quantity Reconciliation Matrix.
- Visual Evidence Catalog with GPS Coordinates and EXIF Timestamps.
- Regulatory Compliance Statement & Certified Digital Sign-off Stamp.
- Cryptographic verification hash / QR code representation for tamper-evident verification.
- CSS `@media print` optimization for clean single/multi-page PDF export.

---

## 5. Immutable Audit Trail

### Activity Logging
- Data Model: `AuditLogEntry` (`id`, `milestone_id`, `project_id`, `actor_name`, `actor_role`, `action_type`, `description`, `timestamp`, `metadata`).
- Logs every milestone transition, evidence upload, AI analysis execution, discrepancy resolution, and inspection booking.
