# Phase 1: Foundation, Authentication & Project Setup - Research

**Researched:** 2026-10-09
**Domain:** React + TypeScript + Vite + Tailwind CSS + Supabase Auth & PostgreSQL Schema Architecture
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 (Dual Auth Model):** Support standard Supabase Auth (email/password) paired with a Quick Demo Persona Switcher in the top/navigation bar ("Inspector Demo" / "Contractor Demo") to allow seamless role toggling for testing and hackathon judging.
- **D-02 (Role & Profile Authority):** Manage user roles (`admin_inspector`, `contractor`) in a PostgreSQL `profiles` table linked via foreign key to `auth.users(id)` and enforced with Supabase Row Level Security (RLS).
- **D-03 (Route & UI Protection):** Implement React Router protected routes (`/admin/*`, `/contractor/*`) with dynamic role guards and persistent session state.
- **D-04 (Project Data Model):** Admin can create projects specifying project title, location (address/city), client name, total budget, start/end dates, and contractor assignment.
- **D-05 (Milestone & BOQ Definition):** Milestones are structured stages with scheduled deadlines, percentage weight, and structured Bill of Quantities (BOQ) target line items (Material, Quantity Ordered, Unit).
- **D-06 (Contractor Workspace):** Contractors have a focused view of assigned projects, milestone checklists, scheduled inspection dates, and submission requirements.

### the agent's Discretion
- Sleek modern Tailwind CSS design tokens with clean cards, dark mode accents, and clear status indicators.
- Seed data scripts and rich mock projects for instant live demonstration.

### Deferred Ideas (OUT OF SCOPE)
- Contractor photo upload pipelines & EXIF/GPS coordinate ingestion (Phase 2).
- AI Gemini Vision and document OCR discrepancy engine (Phase 3).
- Inspector verification cockpit, physical inspection scheduling, and audit report generation (Phase 4).
</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Authentication & Session Persistence | Supabase Auth (Backend/Service) | Browser/Client (`AuthContext`) | Supabase provides cryptographically secure JWT sessions and token refresh |
| Role Authorization & RLS Enforcement | PostgreSQL / Supabase RLS | React Router Protected Routes | Security is enforced at DB level; frontend guards manage UX routing |
| Project & Milestone CRUD | PostgreSQL Database | Browser/Client React Components | Relational constraints maintain milestone-to-project & BOQ data integrity |
| Demo Role Impersonation Switcher | Browser/Client State Context | — | Enables instant judge testing without requiring real multi-account logins |
</architectural_responsibility_map>

<research_summary>
## Summary

Phase 1 establishes the rock-solid foundation for SiteProof AI:
1. **Frontend Architecture:** Vite + React 18 + TypeScript + Tailwind CSS with Lucide Icons and React Router v6.
2. **State & Auth Management:** A centralized `AuthContext` providing user authentication, persistent session management, role resolution (`admin_inspector` vs `contractor`), and a demo persona switcher for testing.
3. **Database Schema:** PostgreSQL schema defining `profiles`, `projects`, `project_contractors`, `milestones`, and `boq_items` with comprehensive Row-Level Security (RLS) policies.
4. **Project & Milestone Management:** Interactive Admin dashboard for creating projects, assigning contractors, and building structured milestone BOQs, alongside a streamlined Contractor dashboard.

**Primary recommendation:** Use `@supabase/supabase-js` with typed database definitions and a dual client pattern that handles both live Supabase backends and an in-memory/mock fallback store for seamless demonstration and testing.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vite | ^5.4.0 | Build tool & Dev server | Fast HMR, minimal config |
| react | ^18.3.1 | UI library | Component model and hooks ecosystem |
| react-router-dom | ^6.26.0 | Client-side routing | Role-guarded layouts and clean URL routing |
| @supabase/supabase-js | ^2.45.0 | Supabase client | Auth, Database, Storage integration |
| tailwindcss | ^3.4.10 | Utility-first CSS | Rapid, modern UI development with design tokens |
| lucide-react | ^0.440.0 | Icon system | Clean, accessible icons for construction/audit UI |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx / tailwind-merge | ^2.5.0 | Dynamic className composition | Reusable UI component variants |

**Installation:**
```bash
npm install react-router-dom @supabase/supabase-js lucide-react clsx tailwind-merge
npm install -D tailwindcss postcss autoprefixer
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── common/             # Button, Card, Badge, Modal, Input
│   ├── layout/             # Navbar, Sidebar, ProtectedRoute, RoleSwitcher
│   └── projects/           # ProjectCard, MilestoneList, BOQTable, CreateProjectModal
├── context/
│   ├── AuthContext.tsx     # Auth state, user profile, demo switcher
│   └── ProjectContext.tsx  # Project/milestone data provider
├── lib/
│   ├── supabase.ts         # Supabase client config & fallback mock store
│   └── seedData.ts         # Rich construction demo projects & BOQ baselines
├── pages/
│   ├── admin/              # AdminDashboard, ProjectDetails, NewProject
│   ├── contractor/         # ContractorDashboard, MilestoneView
│   ├── AuthPage.tsx        # Login & Signup forms
│   └── NotFoundPage.tsx
├── types/
│   └── index.ts            # TypeScript interfaces (User, Project, Milestone, BOQItem)
├── App.tsx
└── main.tsx
```

### PostgreSQL Schema & RLS Architecture
```sql
-- Profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  role text check (role in ('admin_inspector', 'contractor')) not null default 'contractor',
  created_at timestamptz default now()
);

-- Projects table
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  code text unique not null,
  description text,
  location text not null,
  client_name text not null,
  total_budget numeric(14, 2) default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- Project Contractors Assignment
create table public.project_contractors (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade,
  contractor_id uuid references public.profiles(id) on delete cascade,
  unique(project_id, contractor_id)
);

-- Milestones table
create table public.milestones (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  description text,
  sequence_order int not null,
  weight_percentage numeric(5, 2) default 0,
  target_date date not null,
  status text check (status in ('pending', 'in_progress', 'submitted', 'verified', 'rejected')) default 'pending',
  created_at timestamptz default now()
);

-- Bill of Quantities (BOQ) Target Items
create table public.boq_items (
  id uuid default gen_random_uuid() primary key,
  milestone_id uuid references public.milestones(id) on delete cascade,
  item_code text not null,
  description text not null,
  unit text not null, -- e.g., 'MT', 'Cu.m', 'Sq.m', 'Bags'
  quantity_ordered numeric(12, 2) not null default 0,
  unit_rate numeric(12, 2) default 0
);
```

### Anti-Patterns to Avoid
- **Hardcoding API credentials in client builds**: Use `.env` variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- **Storing sensitive roles only in client local state**: Always validate profile role from backend/database schema.
- **Over-complicating Auth for local review**: The Demo Persona Switcher provides seamless judging without breaking real Supabase Auth connectivity.
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT Session Storage & Refresh | Custom cookie/session manager | Supabase Auth (`supabase.auth`) | Handles refresh tokens, multi-tab sync, and PKCE securely |
| Iconography | Inline SVG paths | `lucide-react` | Standardized, accessible, consistent icon weights |
| Class concatenation | String template logic | `clsx` + `tailwind-merge` | Avoids Tailwind class collision conflicts |
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Blank page on unauthenticated reload
- **Why it happens:** Auth listener starts in loading state; router redirects to `/login` before session is restored.
- **Prevention:** Include an `isLoading` boolean in `AuthContext` and render a clean loading spinner/skeleton until session check resolves.

### Pitfall 2: Supabase env variables missing in dev
- **Why it happens:** `.env` file not created or not prefixed with `VITE_`.
- **Prevention:** Provide `.env.example` with fallback warning and mock store fallback so local preview runs out of the box.
</common_pitfalls>

<metadata>
## Metadata
- **Research scope:** React 18, Vite, TypeScript, Tailwind CSS, Supabase Auth & PostgreSQL RLS.
- **Confidence:** HIGH
- **Valid until:** 2026-11-09
</metadata>

---
*Phase: 01-foundation-authentication-project-setup*
*Research completed: 2026-10-09*
*Ready for planning: yes*
