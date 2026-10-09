# Phase 4: Inspector Audit Dashboard, Decision Workflow & Reports - Validation Plan

## Validation Overview
This document specifies the validation criteria, automated and manual test cases, and quality gates for Phase 4.

---

## 1. Quality Gates & Build Verification
- [ ] `npm run build` succeeds with zero TypeScript errors and zero warnings.
- [ ] All audit state (decisions, physical inspection schedules, and audit log entries) persists in `localStorage` across reloads.
- [ ] Print stylesheets format the Verified Audit Report cleanly for browser print/PDF export.

---

## 2. Feature Acceptance Criteria (Nyquist Table)

| ID | Requirement | Test Action | Expected Result |
|---|---|---|---|
| **VAL-01** | Side-by-Side Verification Cockpit | Navigate to Inspector Verification Cockpit for a milestone | Displays dual-pane layout comparing site photos (left) with challans/invoices (right) and discrepancy overlays |
| **VAL-02** | Guardrail: Critical Discrepancy Alert | Attempt to approve milestone with unresolved critical discrepancies | Warns inspector of active critical discrepancies and requires resolution or explicit override |
| **VAL-03** | Approve Milestone Decision | Approve milestone with digital signature and remarks | Milestone status updates to `verified`, decision stamp is recorded, and audit log entry created |
| **VAL-04** | Reject Milestone Decision | Reject milestone with feedback notes | Milestone status updates to `rejected` with contractor remediation feedback displayed |
| **VAL-05** | Physical Inspection Scheduling | Schedule an on-site physical visit with date, inspector, and location | Creates `InspectionSchedule` item, visible in scheduler calendar/list with status `scheduled` |
| **VAL-06** | Complete Physical Inspection | Mark scheduled inspection as completed with notes | Updates schedule status to `completed` and logs to milestone audit history |
| **VAL-07** | Print-Ready Audit Report Export | Open Verified Audit Report and trigger print/export | Opens official letterhead certificate with 5-stage reconciliation, GPS evidence, and verification hash |
| **VAL-08** | Immutable Activity Trail | Review Audit History tab | Displays chronological log of uploads, AI analyses, discrepancy resolutions, and decisions |

---

## 3. Manual Verification Steps
1. Log in / Switch to **Inspector Persona** (`David Vance - Senior Lead Auditor`).
2. Navigate to **Inspector Cockpit** → Open "Metro Line 4 - Pier 12" → Launch **"Verify Milestone"**.
3. Inspect the **Side-by-Side Dual Pane**: verify photo with GPS and detected rebar elements on left, Ultratech challan and Tata invoice on right.
4. Click **"Schedule Physical Inspection"**, set date and gate location, and save.
5. Click **"Approve Milestone"** — fill in digital sign-off and confirm approval. Verify badge transitions to `verified`.
6. Click **"Export Official Audit Report"** — verify printable letterhead layout, QR verification hash, 5-stage table, and auditor stamp.
7. Switch to **Contractor Persona** — verify contractor sees verified status and inspector sign-off feedback.
