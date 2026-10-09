# Phase 1: Foundation, Authentication & Project Setup - Context

**Gathered:** 2026-10-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the core application infrastructure, Supabase schema with Row Level Security (RLS), role-based authentication flows, and project/milestone configuration capabilities for Admin/Inspectors and Contractors. This phase delivers project creation, milestone definitions with Bill of Quantities (BOQ) baselines, and contractor assignments. Evidence uploads and AI discrepancy processing are handled in subsequent phases.

</domain>

<decisions>
## Implementation Decisions

### Authentication & Role Onboarding
- **D-01 (Dual Auth Model):** Support standard Supabase Auth (email/password) paired with a Quick Demo Persona Switcher in the top/navigation bar ("Inspector Demo" / "Contractor Demo") to allow seamless role toggling for testing and hackathon judging.
- **D-02 (Role & Profile Authority):** Manage user roles (`admin_inspector`, `contractor`) in a PostgreSQL `profiles` table linked via foreign key to `auth.users(id)` and enforced with Supabase Row Level Security (RLS).
- **D-03 (Route & UI Protection):** Implement React Router protected routes (`/admin/*`, `/contractor/*`) with dynamic role guards and persistent session state.

### Project & Milestone Architecture
- **D-04 (Project Data Model):** Admin can create projects specifying project title, location (address/city), client name, total budget, start/end dates, and contractor assignment.
- **D-05 (Milestone & BOQ Definition):** Milestones are structured stages (e.g. "Foundation Pour", "Structural Framing", "MEP First Fix") with scheduled deadlines, percentage weight, and structured Bill of Quantities (BOQ) target line items (Material, Quantity Ordered, Unit).
- **D-06 (Contractor Workspace):** Contractors have a focused view of assigned projects, milestone checklists, scheduled inspection dates, and submission requirements.

### the agent's Discretion
- Exact Tailwind CSS component styling and sleek dark/glassmorphic theme tokens.
- Realistic pre-seeded sample construction projects ("Metro Line 4 - Pier 12", "Skyline Tower - Substructure") for instant testing out of the box.
- Error toast notifications and loading skeleton states.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & Requirements
- `.planning/PROJECT.md` — Vision, boundaries, and 5-stage quantity model
- `.planning/REQUIREMENTS.md` — AUTH-01 through AUTH-03, PROJ-01 through PROJ-04
- `.planning/ROADMAP.md` — Phase 1 scope and success criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Greenfield setup: Vite + React + TypeScript + Tailwind CSS structure to be created.

### Established Patterns
- Supabase client initialization with environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- TypeScript interfaces for all schema entities (`Profile`, `Project`, `Milestone`, `BOQItem`).

### Integration Points
- Supabase Auth session listeners (`onAuthStateChange`) integrated into React AuthContext.
- PostgreSQL RLS policies ensuring contractors only read assigned projects and admins have full configuration privileges.

</code_context>

<deferred>
## Deferred Ideas

- Site photograph upload pipeline and EXIF/GPS coordinate parsing (Phase 2).
- Multimodal Vision AI progress analysis and document OCR invoice extraction (Phase 3).
- Side-by-side inspector cockpit, physical site visit scheduler, and audit report generation (Phase 4).

</deferred>

---

*Phase: 01-foundation-authentication-project-setup*
*Context gathered: 2026-10-09*
