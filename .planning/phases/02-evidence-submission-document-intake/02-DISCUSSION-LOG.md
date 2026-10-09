# Phase 2: Evidence Submission & Document Intake - Discussion Log

**Date:** 2026-10-09  
**Phase:** Phase 2 (Evidence Submission & Document Intake)  
**Status:** Completed

---

## Discussion Topics & Decisions

### Area 1: Evidence Upload & Metadata Extraction
- **Topic**: How should contractor photos and documents be ingested and tagged with site metadata?
- **Decision**: Multi-file drag & drop zone with auto-extraction of EXIF timestamps and GPS tags where available, browser geolocation fallback, and structured manual tags (Site sector/elevation, tagged BOQ line item, contractor field notes).

### Area 2: Preset Sample Evidence Library
- **Topic**: How to ensure seamless testing and demoing without requiring manual camera photo capture during judging?
- **Decision**: Pre-configure authentic construction demo packages (Metro Pier 12 rebar photos, RMC delivery challans, steel mill test certs, tax invoices) with 1-click loading directly into the contractor milestone evidence repository.

### Area 3: Storage & Attachment Handling
- **Topic**: How should files be stored and accessed across local and cloud environments?
- **Decision**: Implement dual storage mechanism — upload directly to Supabase Storage bucket when connected, and provide robust Base64 / Blob URL memory persistence fallback so full upload & preview flows work flawlessly in demo mode.

### Area 4: Gallery & Timeline Explorer
- **Topic**: How should evidence be presented to both Contractors and Inspectors?
- **Decision**: Dual layout consisting of a Tabbed Media Gallery (Photos, Challans, Invoices) and a Chronological Submission Timeline, complete with rich metadata badges (GPS chip, capture time, uploader) and full-screen inspection modal.

---

## Next Action
Proceed to `/gsd-plan-phase 2` to generate research, validation, and actionable execution plans (`02-01-PLAN.md` and `02-02-PLAN.md`).
