# Phase 2: Evidence Submission & Document Intake - Research

## Overview
Phase 2 focuses on multi-source contractor evidence capture, document intake, and chronological evidence explorer for SiteProof AI. It bridges physical site activities and contractual records before automated AI verification in Phase 3.

---

## 1. Metadata Extraction & Geolocation

### EXIF / Client-side Metadata
- Site photos captured on mobile devices typically contain EXIF metadata tags:
  - `DateTimeOriginal` / `CreateDate`: Physical capture timestamp.
  - `GPSLatitude` / `GPSLongitude` / `GPSAltitude`: Exact site geocoordinates.
- **Implementation Strategy**:
  - Implement a lightweight pure TypeScript/JS EXIF reader (or binary buffer scanner for APP1 marker `0xFFE1`) to parse GPS and timestamp tags without heavyweight dependencies.
  - Fallback: HTML5 `navigator.geolocation.getCurrentPosition` API allows 1-click site coordinate tagging when EXIF is stripped by browsers/messaging apps.
  - Manual metadata tagging: Sector/Grid (e.g. "Pier 12 - Rebar Cage West Face"), elevation level, contractor site notes, and linked BOQ item.

---

## 2. Realistic Preset Sample Evidence Library

To enable immediate judging and demonstration without requiring users to upload live photos from a construction site, Phase 2 provides pre-built authentic sample packages:
1. **Metro Line 4 Elevated Corridor - Pier 12 Bundle**:
   - High-resolution rebar reinforcement cage photos (showing bar spacing, stirrups, starter bars) with embedded GPS (Mumbai Metro corridor coordinates: 19.1693° N, 72.9515° E).
   - Ultratech RMC Delivery Challan: 50 m³ Grade M40 Concrete, Batching Plant slip #RMC-2026-889.
   - Tata Tiscon Fe550D TMT Steel Mill Test Certificate & Commercial Tax Invoice #INV-2026-0412.
2. **Skyline Business Park - Foundation Raft Bundle**:
   - Raft concrete pouring photos with site level markers.
   - Ready Mix Concrete batching ticket and weighbridge slip.
- 1-click **"Load Authentic Demo Evidence"** button in both contractor and inspector views.

---

## 3. Storage Architecture: Cloud Bucket & Local Fallback

### Supabase Storage Pipeline
- Standard path schema: `evidence/{projectId}/{milestoneId}/{evidenceType}/{timestamp}_{filename}`
- Bucket: `siteproof-evidence` (public read / authenticated upload).

### Zero-Friction Local / Offline Demo Fallback
- For instant evaluation without cloud setup:
  - Reads uploaded files using `FileReader.readAsDataURL()` (Base64) or `URL.createObjectURL()`.
  - Persists evidence records in `localStorage['siteproof_evidence']` synced with `ProjectContext`.
  - Guarantees seamless operation in both live cloud and local static deployments.

---

## 4. UI/UX: Evidence Gallery, Lightbox & Audit Timeline

- **Tabbed Filter Engine**:
  - `All Items` (`count`)
  - `Site Photographs` (grid with zoom hover, GPS tags, capture time)
  - `Delivery Challans` (document card with supplier, slip #, batch quantity)
  - `Tax Invoices` (billing summary, invoice #, line items)
  - `Test Reports & Certificates` (quality assurance docs)
- **Chronological Audit Timeline**:
  - Visual vertical timeline showing upload sequence vs milestone target date.
  - Displays contractor sign-off, GPS coordinate badge (with Google Maps link), and AI analysis state marker (`Pending Analysis` / `AI Processed`).
- **Interactive Lightbox Inspection Modal**:
  - Full-screen high-res image pan & zoom.
  - Metadata side-drawer: Coordinates, capture timestamp, uploader name, linked BOQ items, file dimensions, and contractor remarks.

---

## Technical Dependencies & Considerations
- Zero external native binary dependencies needed; pure React + Tailwind + Lucide icons.
- Responsive design for mobile site engineers and desktop audit inspectors.
- Zero build warnings (`npm run build` strict typing).
