# Phase 1: Foundation, Authentication & Project Setup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-09
**Phase:** 01-foundation-authentication-project-setup
**Areas discussed:** Role Onboarding & Authentication Flow, Role Profile Management

---

## Role Onboarding & Authentication Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Standard Supabase Auth + Quick Demo Persona Switcher | Allows instant switching between Inspector and Contractor for testing/demos | ✓ |
| Strict Email/Password signup with mandatory role selection on registration | Standard registration requiring separate emails for each role test | |
| Admin-only user invitation flow | Admins invite contractors via email | |

**User's choice:** Standard Supabase Auth + Quick Demo Persona Switcher (Allows instant switching between Inspector and Contractor for testing/demos)
**Notes:** Highly beneficial for hackathon judges and local development.

---

## Role & Profile Authority

| Option | Description | Selected |
|--------|-------------|----------|
| Supabase PostgreSQL profiles table with Row Level Security (RLS) linked to auth.users | Standard relational profile pattern with SQL RLS policy enforcement | ✓ |
| Role stored in JWT custom claims (app_metadata) via Supabase Auth hook | Token-based claim verification | |

**User's choice:** Supabase PostgreSQL profiles table with Row Level Security (RLS) linked to auth.users
**Notes:** Direct foreign key association to `auth.users(id)` and RLS policies for role-based data access.

---

## the agent's Discretion

- Tailwind CSS design system tokens and responsive dashboard layouts.
- Pre-seeded sample construction projects and milestone data.
- UI loading skeletons and notification toasts.

## Deferred Ideas

- Contractor photo uploads with GPS/timestamping (Phase 2).
- AI Gemini Vision and OCR discrepancy engine (Phase 3).
- Inspector verification cockpit and physical audit scheduling (Phase 4).

---

*Phase: 01-foundation-authentication-project-setup*
*Discussion log generated: 2026-10-09*
