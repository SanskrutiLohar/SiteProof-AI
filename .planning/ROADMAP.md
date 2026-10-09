# Roadmap: SiteProof AI

## Overview

SiteProof AI delivers an end-to-end construction milestone verification workflow in 4 coordinated phases. We start with system foundations and core schema setup, progress through multi-source contractor evidence capture, power up server-side AI Vision and OCR discrepancy auditing, and conclude with the inspector review cockpit, scheduling, and verified audit reporting.

## Phases

- [x] **Phase 1: Foundation, Authentication & Project Setup** - Core database schema, role-based authentication, project workspace & milestone definitions.
- [ ] **Phase 2: Evidence Submission & Document Intake** - Contractor media uploader, geo/timestamped site photography, invoice/challan storage & timeline explorer.
- [ ] **Phase 3: AI Vision & OCR Discrepancy Engine** - Server-side Gemini vision progress analysis, document OCR extraction, and 5-stage quantity reconciliation.
- [ ] **Phase 4: Inspector Audit Dashboard, Decision Workflow & Reports** - Unified inspector verification cockpit, decision actions, physical inspection scheduling, and audit report generation.

## Phase Details

### Phase 1: Foundation, Authentication & Project Setup
**Goal**: Establish the application infrastructure, Supabase schema with RLS, authentication flows, and project/milestone management capabilities for admins and contractors.
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, PROJ-01, PROJ-02, PROJ-03, PROJ-04
**Success Criteria** (what must be TRUE):
  1. Users can sign in as either Admin/Inspector or Contractor with protected routes and proper role navigation.
  2. Admin can create projects, configure milestone stages with BOQ item baselines, and assign contractors.
  3. Contractor can log in and view their assigned projects and milestone requirements.
**Plans**: 2 plans

Plans:
- [x] 01-01: Initialize Vite/React/Tailwind app, Supabase client/schema, and role-based Auth system with routing.
- [x] 01-02: Build Project and Milestone management modules (Admin creation + Contractor project dashboard).

### Phase 2: Evidence Submission & Document Intake
**Goal**: Enable contractors to upload multi-source construction evidence (site photos with metadata, delivery challans, invoices) and view an organized timeline.
**Depends on**: Phase 1
**Requirements**: EVID-01, EVID-02, EVID-03, EVID-04
**Success Criteria** (what must be TRUE):
  1. Contractor can upload site photographs with timestamp, location details, and milestone tags to Supabase Storage.
  2. Contractor can upload supporting invoices and delivery challans linked to specific milestone items.
  3. Admin and Contractor can browse an organized chronological gallery of evidence for any milestone.
**Plans**: 2 plans

Plans:
- [ ] 02-01: Implement file upload pipeline for photos and documents with metadata extraction (GPS/timestamps) and Supabase storage bucket policies.
- [ ] 02-02: Build Evidence Gallery and Milestone Submission Review components with preview modals and status badges.

### Phase 3: AI Vision & OCR Discrepancy Engine
**Goal**: Implement server-side AI analysis for site photographs (visual stage completion) and document OCR (invoice & challan quantity extraction) with discrepancy tracking.
**Depends on**: Phase 2
**Requirements**: AI-01, AI-02, AI-03, AI-04
**Success Criteria** (what must be TRUE):
  1. Server-side OCR extracts supplier info, dates, invoice numbers, and line-item quantities from uploaded challans/invoices.
  2. Multimodal Vision AI analyzes site photographs and outputs structured observations on construction progress and anomalies.
  3. Discrepancy engine flags duplicate documents and highlights differences across Ordered, Delivered, Billed, and Consumed quantities.
**Plans**: 2 plans

Plans:
- [ ] 03-01: Build secure server-side Gemini Vision & OCR analysis function (Edge Function / API route) returning structured JSON results.
- [ ] 03-02: Implement discrepancy reconciliation logic comparing extracted data against BOQ baselines and prior submissions.

### Phase 4: Inspector Audit Dashboard, Decision Workflow & Reports
**Goal**: Deliver the inspector audit experience with side-by-side evidence inspection, decision actions (approve/reject/request info), inspection scheduling, and audit trail export.
**Depends on**: Phase 3
**Requirements**: AUDIT-01, AUDIT-02, AUDIT-03, AUDIT-04, AUDIT-05
**Success Criteria** (what must be TRUE):
  1. Inspector can review milestone submissions in a side-by-side verification interface showing photos, documents, and AI insights.
  2. Inspector can approve milestone, reject with feedback, or request additional evidence without automated bypass.
  3. Inspector can schedule physical site visits, and users can export a finalized audit report summary with full history.
**Plans**: 2 plans

Plans:
- [ ] 04-01: Build Inspector Verification Cockpit with side-by-side photo/document viewer, AI discrepancy markers, and decision workflow actions.
- [ ] 04-02: Implement Physical Inspection Scheduler, immutable audit history timeline, and printable Audit Report export.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation, Authentication & Project Setup | 2/2 | Complete | 2026-10-09 |
| 2. Evidence Submission & Document Intake | 0/2 | Not started | - |
| 3. AI Vision & OCR Discrepancy Engine | 0/2 | Not started | - |
| 4. Inspector Audit Dashboard, Decision Workflow & Reports | 0/2 | Not started | - |
