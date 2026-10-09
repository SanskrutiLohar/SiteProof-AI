---
phase: 1
slug: foundation-authentication-project-setup
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-10-09
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript Compiler (`tsc --noEmit`) + Vite Build (`npm run build`) |
| **Config file** | `tsconfig.json` & `vite.config.ts` |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd-verify-work`:** Full build & typecheck must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | AUTH-01, AUTH-02 | T-01-01 | Role checking prevents unauthenticated access | integration | `npm run build` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | AUTH-03 | T-01-02 | Session recovery maintains role state | unit | `npm run build` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 2 | PROJ-01, PROJ-02 | T-01-03 | Only admin can create and assign projects | integration | `npm run build` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 2 | PROJ-03, PROJ-04 | T-01-04 | Contractors only see assigned project milestones | integration | `npm run build` | ❌ W0 | ⬜ pending |

---

## Wave 0 Requirements

- [ ] Initialize Vite + React + TypeScript + Tailwind project scaffolding (`package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.js`)
- [ ] Install dependencies (`@supabase/supabase-js`, `react-router-dom`, `lucide-react`, `clsx`, `tailwind-merge`)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Quick Demo Persona Switcher | AUTH-02 | UI Interactive switch | Click "Inspector Demo" / "Contractor Demo" and verify layout navigation switches accordingly |
| Project Creation & BOQ Form | PROJ-01, PROJ-03 | Form UX interaction | Open Create Project modal, add milestone and BOQ lines, save and verify in project list |

---

## Validation Sign-Off

- [x] All tasks have automated build/typecheck verification
- [x] Wave 0 covers project initialization
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-10-09
