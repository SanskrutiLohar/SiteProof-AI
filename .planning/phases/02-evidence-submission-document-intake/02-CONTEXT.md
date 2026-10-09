# Phase 2: Evidence Submission & Document Intake - Context

## Phase Goal
Enable contractors to upload multi-source construction evidence (site photos with metadata, delivery challans, invoices) and explore an organized chronological gallery and document register linked to milestones.

## Requirements Covered
- **EVID-01**: Contractor photo uploader with geo-coordinates, timestamp capture, and milestone tagging.
- **EVID-02**: Document intake for delivery challans, material test certificates, and vendor invoices.
- **EVID-03**: Secure file storage (Supabase Storage with bucket policies + Base64 local preview fallback).
- **EVID-04**: Chronological evidence timeline and tabbed photo/document gallery with preview modals.

---

## Discussion Outcomes & Architecture Decisions

### 1. Evidence Upload & Metadata Extraction
- **Dropzone Experience**: Modern drag-and-drop file uploader supporting batch uploads of photos (`.jpg`, `.jpeg`, `.png`, `.webp`) and documents (`.pdf`, `.png`, `.jpg`).
- **Metadata Pipeline**:
  - Automatically parses EXIF / metadata where available (capture timestamp, GPS latitude/longitude).
  - Browser Geolocation API fallback with 1-click location tagger.
  - Manual metadata inputs: Location label (e.g., "Pier 12 - Grid C3, East Face"), Capture Date, Tagged Milestone Item / BOQ line item, and Contractor Inspection Notes.
- **Batch Processing**: Displays upload progress, preview thumbnails, and status chips during upload.

### 2. Preset Sample Evidence Library ("Quick Demo Packs")
- Pre-loaded authentic construction site evidence bundles for instant testing:
  - **Metro Pier 12 Bundle**:
    - High-resolution rebar grid photos with GPS stamps (Metro Line 4 corridor).
    - Ultratech RMC Delivery Challans (50m³ M40 Grade Concrete).
    - TMT Rebar Fe550D Mill Test Certificate & Tax Invoices.
  - **Skyline Business Park Bundle**:
    - Foundation raft casting photos with timestamped site markers.
    - Steel delivery weighing slips and vendor invoice records.
- 1-click "Load Sample Evidence" button in contractor upload view to enable instant hackathon demo flow.

### 3. Dual Storage Architecture
- **Supabase Storage Integration**: Uploads files to dedicated buckets (`siteproof-evidence`) with milestone-specific folder hierarchy (`{projectId}/{milestoneId}/{evidenceType}/{filename}`).
- **Zero-Config Offline Fallback**: In demo mode without active Supabase credentials, converts uploads to persistent Base64 / blob URLs in `ProjectContext` state, ensuring zero blockers during local judging.
- **Security & Integrity**: File type validation, size constraints (max 25MB per file), and client-side sanitization.

### 4. Tabbed Gallery & Chronological Timeline
- **Tab Filters**: "All Evidence", "Site Photographs" (grid view), "Delivery Challans", "Tax Invoices", "Inspection Reports".
- **Chronological Audit Timeline**: Visual vertical timeline showing submission sequence, timestamps, uploader credentials, and linked milestone targets.
- **Interactive Lightbox / Document Viewer**:
  - High-res photo inspection with zoom, metadata drawer (GPS coordinates, map pin link, EXIF timestamps).
  - Document viewer with multi-page preview and metadata overlay.
- **Status & AI-Ready Badges**: Each evidence card indicates `Pending AI Analysis`, `AI Analyzed`, or `Discrepancy Detected` for seamless handoff to Phase 3.
