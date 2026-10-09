# Requirements: SiteProof AI

**Defined:** 2026-10-09
**Core Value:** Provide trustworthy, human-in-the-loop verification and discrepancy auditing for construction milestones that cross-checks physical site progress and supplier documentation against approved contracts.

## v1 Requirements

### Authentication & Authorization

- [x] **AUTH-01**: User can log in and sign up with email and password via Supabase Auth.
- [x] **AUTH-02**: System enforces distinct roles (`admin_inspector`, `contractor`) with route protection and Row Level Security (RLS).
- [x] **AUTH-03**: User session securely persists and maintains role context across page reloads.

### Projects & Milestones

- [x] **PROJ-01**: Admin can create a construction project with title, location, description, and budget.
- [x] **PROJ-02**: Admin can assign contractors to specific projects.
- [x] **PROJ-03**: Admin can define milestone stages, expected completion dates, and Bill of Quantities (BOQ) baseline targets.
- [x] **PROJ-04**: Contractor can view their assigned projects, milestone checklists, and deadline schedules.

### Evidence Submission & Management

- [ ] **EVID-01**: Contractor can upload site photographs with timestamp, optional GPS coordinates, and milestone stage tagging.
- [ ] **EVID-02**: Contractor can upload invoices, delivery challans, and inspection certificates (PDF/Images) to Supabase Storage.
- [ ] **EVID-03**: Admin can upload baseline reference drawings and specifications for benchmark comparison.
- [ ] **EVID-04**: Contractor and inspector can view an organized timeline gallery of all submitted evidence.

### AI Visual Analysis & Document OCR

- [ ] **AI-01**: Server-side OCR extracts supplier name, invoice/challan numbers, line items, dates, and quantities.
- [ ] **AI-02**: Multimodal Vision AI analyzes site photographs to identify structural progress indicators and work completeness signals.
- [ ] **AI-03**: System detects duplicate invoices/challans using hash and reference number matching.
- [ ] **AI-04**: Discrepancy engine flags quantity mismatches across Ordered, Delivered, Billed, and Consumed states.

### Inspector Audit Dashboard & Decisions

- [ ] **AUDIT-01**: Inspector has a unified verification dashboard displaying side-by-side evidence, OCR data, and AI-flagged discrepancies.
- [ ] **AUDIT-02**: Inspector can approve a milestone claim, reject it with specific feedback, or request additional evidence.
- [ ] **AUDIT-03**: Inspector can schedule physical on-site verification visits with date, time, and inspector notes.
- [ ] **AUDIT-04**: System maintains an immutable audit log of all uploads, AI analyses, comments, and human inspector decisions.
- [ ] **AUDIT-05**: User can export an audit report summary (PDF/Printable view) for milestone sign-off.

## v2 Requirements

### Extended Capabilities

- **V2-01**: Drone/360-degree aerial photogrammetry mesh comparison against BIM IFC files.
- **V2-02**: Automatic smart contract escrow release triggers upon signed inspector approval.
- **V2-03**: Real-time push notifications and WhatsApp/SMS alerts for inspection scheduling.
- **V2-04**: Offline field capture PWA with background sync when connectivity resumes.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Autonomous AI Approval | Mandatory compliance rule: all milestones require explicit human inspector sign-off |
| Metallurgical / Chemical Lab Verification | Photos and invoices cannot scientifically prove internal material composition |
| Direct Bank Wire / Payment Processing | Out of scope for hackathon MVP; focused on audit verification |
| Native iOS/Android Binary Builds | Responsive web platform prioritized for cross-device accessibility |

## Traceability

Which phases cover which requirements.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| PROJ-01 | Phase 1 | Complete |
| PROJ-02 | Phase 1 | Complete |
| PROJ-03 | Phase 1 | Complete |
| PROJ-04 | Phase 1 | Complete |
| EVID-01 | Phase 2 | Pending |
| EVID-02 | Phase 2 | Pending |
| EVID-03 | Phase 2 | Pending |
| EVID-04 | Phase 2 | Pending |
| AI-01 | Phase 3 | Pending |
| AI-02 | Phase 3 | Pending |
| AI-03 | Phase 3 | Pending |
| AI-04 | Phase 3 | Pending |
| AUDIT-01 | Phase 4 | Pending |
| AUDIT-02 | Phase 4 | Pending |
| AUDIT-03 | Phase 4 | Pending |
| AUDIT-04 | Phase 4 | Pending |
| AUDIT-05 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0 ✓

---
*Requirements defined: 2026-10-09*
*Last updated: 2026-10-09 after initial definition*
