# Phase 2: Evidence Submission & Document Intake - Validation Plan

## Validation Overview
This document specifies the validation criteria, automated and manual test cases, and quality gates for Phase 2.

---

## 1. Quality Gates & Build Verification
- [ ] `npm run build` completes with 0 TypeScript compilation errors and 0 unused variable warnings.
- [ ] Clean browser console output with no unhandled exceptions during file upload or sample library load.
- [ ] Local storage persistence correctly serializes and restores `EvidenceItem` records across page reloads.

---

## 2. Feature Acceptance Criteria (Nyquist Table)

| ID | Requirement | Test Action | Expected Result |
|---|---|---|---|
| **VAL-01** | Photo Upload & Metadata Extraction | Upload image via drag-and-drop or file picker with location/notes | New photo evidence item created with thumbnail, timestamp, location name, and GPS coordinates |
| **VAL-02** | Document Intake (Challans & Invoices) | Upload PDF/scanned image as challan or invoice | Document item added with appropriate category badge and file metadata |
| **VAL-03** | Preset Sample Evidence Loader | Click "Load Demo Evidence" on a milestone | Pre-populates realistic site photos, RMC challan, and steel invoice |
| **VAL-04** | Evidence Gallery & Tab Filtering | Switch between "All", "Photos", "Challans", "Invoices" tabs | Filters evidence items accurately by type with active counts |
| **VAL-05** | Chronological Submission Timeline | View evidence timeline tab/section | Displays events in chronological order with uploader name and timestamps |
| **VAL-06** | Lightbox & Inspection Modal | Click on any evidence thumbnail | Opens high-res lightbox with zoom, metadata details drawer, and GPS map link |
| **VAL-07** | Dual Storage & Persistence | Reload browser after uploading evidence | All uploaded and preset evidence items remain intact in UI |
| **VAL-08** | Milestone Status Progression | Submit milestone evidence package for review | Updates milestone status to `submitted` with visible submission badge |

---

## 3. Manual Verification Steps
1. Navigate to **Contractor Portal** → Choose "Metro Line 4 - Pier 12" → Open "Pier 12 - Reinforcement & Shuttering".
2. Click **"Load Authentic Demo Evidence"** — verify 3+ authentic items (photos, challan, invoice) appear immediately.
3. Open the **"Upload Evidence"** modal, select an image/document, fill in site sector details, and submit — verify it appears in the gallery.
4. Click on a photo to open the **Lightbox Modal** — verify zoom controls, GPS coordinates with map link, and metadata drawer.
5. Switch between **Gallery View** and **Timeline View** — verify timestamps and sequence.
6. Click **"Submit Milestone for Verification"** — verify status transitions to `submitted`.
7. Switch to **Inspector Persona** and navigate to the project — verify inspector can see all uploaded evidence in the project details view.
