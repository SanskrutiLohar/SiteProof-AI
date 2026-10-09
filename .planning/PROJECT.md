# SiteProof AI

## What This Is

SiteProof AI is an AI-assisted construction milestone verification and audit platform designed for inspectors, project admins, and contractors. It organizes multi-source construction evidence (site photographs, invoices, delivery challans, and approved project records), analyzes visual and document data, detects quantity/timeline discrepancies, and empowers human inspectors to make informed, audit-ready decisions without relying on unvalidated automation.

## Core Value

Provide trustworthy, human-in-the-loop verification and discrepancy auditing for construction milestones that cross-checks physical site progress and supplier documentation against approved contracts.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **AUTH & RBAC**: Role-based access for Admin/Inspector and Contractor roles with secure backend authorization.
- [ ] **PROJECT & MILESTONE MANAGEMENT**: Admin creation of projects, milestone scheduling, BOQ baseline definition, and contractor assignment.
- [ ] **EVIDENCE INTAKE & STORAGE**: Contractor upload of geo/timestamped site photographs, invoices, delivery challans, and supporting documents.
- [ ] **AI VISION & PHOTO ANALYSIS**: Server-side multimodal vision comparison of site progress photographs against milestone targets.
- [ ] **OCR & QUANTITY RECONCILIATION**: Automated extraction and reconciliation tracking ordered, delivered, billed, paid, and consumed quantities.
- [ ] **DISCREPANCY & DUPLICATE DETECTION**: Non-accusatory flagging of duplicates, date mismatches, and quantity anomalies for investigation.
- [ ] **INSPECTOR AUDIT & DECISION DASHBOARD**: Comprehensive review screen with side-by-side evidence, AI findings, physical inspection scheduler, and audit trail export.

### Out of Scope

- **Autonomous Approval/Rejection**: Fully automated sign-off without human verification (Violates core compliance rule).
- **Physical Material Metallurgical/Chemical Testing**: Cannot prove chemical authenticity or internal structural load ratings purely from photos.
- **Direct ERP Payment Gateway Execution**: Financial payouts and bank transfers are out of scope for hackathon v1.
- **Offline-only Mobile Native App**: Web-first responsive application for desktop & mobile browsers.

## Context

- **Problem Space**: Construction claims frequently suffer from misaligned delivery challans, inflated billing, duplicate invoice submissions, and visual progress ambiguities.
- **Target Audience**: Infrastructure inspectors, general contractors, commercial developers, and project managers.
- **Operating Philosophy**: AI assists and surfaces evidence; humans verify and decide. Flag anomalies for investigation rather than declaring fraud.

## Constraints

- **Security & Authorization**: Row-Level Security (RLS) and backend validation in Supabase; zero exposure of secret AI keys on the frontend.
- **Tech Stack**: React, TypeScript, Vite, Tailwind CSS, React Router, Supabase (Auth, Postgres, Storage), Server-Side Gemini API integration.
- **Hackathon Timeline**: Focused, robust 4-phase MVP delivery with high visual and architectural polish.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Human-in-the-loop verification only | AI vision & OCR assist inspection, but final sign-off rests with certified inspectors | — Pending |
| Server-side Gemini API execution | Protects API credentials, allows structured validation before client delivery | — Pending |
| 5-stage Quantity Tracking Model | Separates Ordered, Delivered, Billed, Paid, and Consumed amounts to catch billing leaks | — Pending |
| Interactive GSD execution | Ensures alignment and verification checkpoints across all 4 milestone phases | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-09 after initialization*
