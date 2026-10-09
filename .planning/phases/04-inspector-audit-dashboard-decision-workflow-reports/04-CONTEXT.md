# Phase 4: Inspector Audit Dashboard, Decision Workflow & Reports - Context

## Phase Goal
Deliver the certified inspector audit cockpit with side-by-side evidence cross-checking, human-in-the-loop milestone decisions (Approve, Reject, Request Information), physical on-site inspection scheduling, immutable audit activity logs, and print-ready verified audit reports.

## Requirements Covered
- **AUDIT-01**: Unified Inspector Verification Cockpit with side-by-side evidence inspection and AI discrepancy overlays.
- **AUDIT-02**: Certified Human Decision Workflow (Approve with digital sign-off, Reject with feedback, Request Additional Evidence).
- **AUDIT-03**: Guardrail compliance: Requires human inspector action (no automated bypass) and warns/blocks milestone approval if unresolved critical discrepancies exist.
- **AUDIT-04**: Physical Site Inspection Scheduler with assigned auditor, date/time picker, site gate/sector, and checklist tracking.
- **AUDIT-05**: Printable Verified Milestone Audit Report with official authority letterhead, QR verification code, 5-stage reconciliation summary, and immutable timestamped audit log.

---

## Discussion Outcomes & Architecture Decisions

### 1. Inspector Verification Cockpit (`src/pages/admin/InspectorVerificationCockpit.tsx`)
- **Side-by-Side Dual Comparison Workspace**:
  - **Left Pane (Physical Site Progress)**: High-resolution site photos with zoom/pan, GPS coordinate chip, timestamp, and AI detected visual elements.
  - **Right Pane (Commercial & Supply Documents)**: Delivery challans, vendor tax invoices, and NABL test certificates with OCR extracted line-item tables.
- **Discrepancy Marker Overlays**: Highlights variances directly on the evidence cards and links back to the 5-stage reconciliation matrix.

### 2. Certified Human Decision Workflow (`src/components/audit/InspectorDecisionModal.tsx`)
- Human-in-the-Loop strict enforcement (AI only assists and recommends; certified inspector signs off).
- **Decision Actions**:
  - **Approve Milestone**: Requires inspector name, digital signature confirmation, certified audit remarks, and confirms resolution of any critical discrepancy flags. Transitions milestone to `verified`.
  - **Reject Milestone**: Requires detailed rejection justification and re-submission requirements. Transitions milestone to `rejected`.
  - **Request Additional Evidence**: Sends notification to contractor specifying needed photos/challans without changing state to rejected.
- Emits immutable log entry into `auditLogs` state.

### 3. Physical Site Inspection Scheduler (`src/components/audit/InspectionSchedulerModal.tsx`)
- Schedule on-site physical inspection visits for lead auditor.
- Captures: Inspection Date & Time, Assigned Inspector Name, Meeting Location / Site Gate, Safety Equipment PPE Checklist, and Inspection Objectives.
- Manages `InspectionSchedule` records with statuses: `scheduled`, `completed`, `cancelled`.

### 4. Print-Ready Verified Audit Report (`src/components/audit/AuditReportModal.tsx`)
- Official, printable certificate view formatted for PDF export and regulatory compliance:
  - Authority Header: National Infrastructure Verification Board / Project Title & Code.
  - Verification Summary: Milestone Status, Final Verified Date, Total Milestone Contract Value.
  - 5-Stage Quantity Reconciliation Table: Ordered vs Delivered vs Billed vs Paid vs Consumed with variance metrics.
  - Key Evidence Thumbnails with GPS coordinates and timestamps.
  - Audit Decision Trail with certified inspector digital sign-off badge and unique verification hash / QR code.

### 5. Immutable Audit Activity Trail (`src/components/audit/AuditActivityTimeline.tsx`)
- Chronological immutable history of every action across the milestone lifecycle:
  - Project/Milestone Creation
  - Contractor Evidence Uploads
  - AI Multimodal Vision & OCR Execution
  - Discrepancy Flag Generation & Resolution
  - Physical Inspection Scheduling
  - Certified Inspector Final Sign-Off & Status Changes
