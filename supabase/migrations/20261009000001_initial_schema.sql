-- ====================================================================
-- SiteProof AI: Production Database Schema Migration
-- 15 Core Entity Tables with Constraints, Indexes, and OCC Versioning
-- ====================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles & Roles (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin_inspector', 'contractor')),
    organization TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT NOT NULL,
    client_name TEXT NOT NULL,
    total_budget NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    assigned_contractor_id UUID REFERENCES public.profiles(id),
    assigned_contractor_name TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Project Memberships
CREATE TABLE IF NOT EXISTS public.project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('lead_auditor', 'site_engineer', 'contractor_lead', 'observer')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- 4. Milestones Table (with Optimistic Concurrency Control 'version')
CREATE TABLE IF NOT EXISTS public.milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    sequence_order INT NOT NULL DEFAULT 1,
    weight_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    target_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'submitted', 'verified', 'rejected')),
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, sequence_order)
);

-- 5. BOQ Items (Bill of Quantities Baseline)
CREATE TABLE IF NOT EXISTS public.boq_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    item_code TEXT NOT NULL,
    description TEXT NOT NULL,
    unit TEXT NOT NULL,
    quantity_ordered NUMERIC(12, 3) NOT NULL DEFAULT 0,
    quantity_delivered NUMERIC(12, 3) NOT NULL DEFAULT 0,
    quantity_billed NUMERIC(12, 3) NOT NULL DEFAULT 0,
    quantity_paid NUMERIC(12, 3) NOT NULL DEFAULT 0,
    quantity_consumed NUMERIC(12, 3) NOT NULL DEFAULT 0,
    unit_rate NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Approved Reference Evidence (Standards & Architectural Baseline)
CREATE TABLE IF NOT EXISTS public.approved_reference_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('rebar_cage', 'concrete_pour', 'girder_launch', 'finishing', 'structural_spec')),
    title TEXT NOT NULL,
    description TEXT,
    reference_image_url TEXT NOT NULL,
    expected_features JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Evidence Submissions (Package Versions & Idempotent Submission Register)
CREATE TABLE IF NOT EXISTS public.evidence_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    contractor_id UUID NOT NULL REFERENCES public.profiles(id),
    version INT NOT NULL DEFAULT 1,
    idempotency_key TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'UNDER_AUDIT', 'NEEDS_REVIEW', 'APPROVED', 'REJECTED', 'MORE_EVIDENCE_REQUIRED')),
    notes TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Evidence Files & Artifacts (with SHA-256 and Perceptual Hashes)
CREATE TABLE IF NOT EXISTS public.evidence_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES public.evidence_submissions(id) ON DELETE SET NULL,
    milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
    type TEXT NOT NULL CHECK (type IN ('photo', 'invoice', 'challan', 'inspection_report')),
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    sha256_hash TEXT NOT NULL,
    perceptual_hash TEXT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    location_name TEXT,
    captured_at TIMESTAMPTZ,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'UPLOAD_PENDING' CHECK (status IN (
        'UPLOAD_PENDING',
        'UPLOAD_FAILED',
        'PROCESSING_PENDING',
        'PROCESSING_FAILED',
        'VERIFICATION_COMPLETE',
        'NEEDS_REVIEW',
        'APPROVED',
        'REJECTED',
        'MORE_EVIDENCE_REQUIRED'
    )),
    ai_analyzed BOOLEAN NOT NULL DEFAULT FALSE,
    ai_summary TEXT,
    ai_confidence NUMERIC(5, 2),
    tags TEXT[] DEFAULT '{}'::TEXT[],
    UNIQUE(milestone_id, sha256_hash) -- Prevent identical duplicate files within same milestone
);

-- 9. Project Documents (Contractual Docs, BOQ sheets, Drawings)
CREATE TABLE IF NOT EXISTS public.project_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES public.milestones(id) ON DELETE SET NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('boq_contract', 'tender_spec', 'drawing_cad', 'safety_plan', 'environmental_clearance')),
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Document Extraction Results (OCR Line Items & Multi-Field Values)
CREATE TABLE IF NOT EXISTS public.document_extractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_file_id UUID NOT NULL REFERENCES public.evidence_files(id) ON DELETE CASCADE,
    milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
    supplier_name TEXT,
    invoice_number TEXT,
    document_date DATE,
    material_description TEXT,
    quantity NUMERIC(12, 3),
    unit TEXT,
    unit_price NUMERIC(12, 2),
    tax_amount NUMERIC(12, 2),
    total_amount NUMERIC(15, 2),
    purchase_order_ref TEXT,
    raw_text TEXT,
    confidence_score NUMERIC(5, 2),
    is_manually_corrected BOOLEAN NOT NULL DEFAULT FALSE,
    original_extraction JSONB,
    corrected_by UUID REFERENCES public.profiles(id),
    corrected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Material Reconciliation Records (5-Stage Ledger)
CREATE TABLE IF NOT EXISTS public.material_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
    material_name TEXT NOT NULL,
    unit TEXT NOT NULL,
    planned_qty NUMERIC(12, 3) NOT NULL DEFAULT 0,
    ordered_qty NUMERIC(12, 3) NOT NULL DEFAULT 0,
    delivered_qty NUMERIC(12, 3) NOT NULL DEFAULT 0,
    billed_qty NUMERIC(12, 3) NOT NULL DEFAULT 0,
    paid_qty NUMERIC(12, 3) NOT NULL DEFAULT 0,
    consumed_qty NUMERIC(12, 3) NOT NULL DEFAULT 0,
    unit_rate NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(milestone_id, material_name)
);

-- 12. Verification Runs (AI Multi-Modal Vision & OCR Audit Runs)
CREATE TABLE IF NOT EXISTS public.verification_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    triggered_by UUID REFERENCES public.profiles(id),
    run_status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (run_status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')),
    model_name TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
    summary TEXT,
    confidence_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    findings_count INT NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 13. Verification Findings (Discrepancy Flags & Anomalies)
CREATE TABLE IF NOT EXISTS public.verification_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_run_id UUID REFERENCES public.verification_runs(id) ON DELETE CASCADE,
    milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
    evidence_file_id UUID REFERENCES public.evidence_files(id) ON DELETE SET NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    flag_type TEXT NOT NULL CHECK (flag_type IN ('quantity_mismatch', 'duplicate_document', 'date_anomaly', 'visual_incomplete', 'price_mismatch', 'missing_test_cert')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
    resolved_by UUID REFERENCES public.profiles(id),
    resolution_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Physical Site Inspections (Scheduler & Field Checklist)
CREATE TABLE IF NOT EXISTS public.physical_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    inspector_id UUID REFERENCES public.profiles(id),
    inspector_name TEXT NOT NULL,
    scheduled_date TIMESTAMPTZ NOT NULL,
    location TEXT NOT NULL,
    checklist_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    objectives TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    completion_notes TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Inspector Decisions (Certified Human-in-the-Loop Sign-off with Digital Signature)
CREATE TABLE IF NOT EXISTS public.inspector_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    inspector_id UUID NOT NULL REFERENCES public.profiles(id),
    inspector_name TEXT NOT NULL,
    inspector_email TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('verified', 'rejected', 'pending_evidence')),
    digital_signature TEXT NOT NULL,
    decision_remarks TEXT NOT NULL,
    checklist_checked JSONB NOT NULL DEFAULT '[]'::jsonb,
    override_critical_flags BOOLEAN NOT NULL DEFAULT FALSE,
    expected_version INT NOT NULL,
    decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Immutable Audit Logs (Append-Only Audit Trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id UUID REFERENCES public.milestones(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id),
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    state_transition TEXT,
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_milestones_project ON public.milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_evidence_milestone ON public.evidence_files(milestone_id);
CREATE INDEX IF NOT EXISTS idx_evidence_sha256 ON public.evidence_files(sha256_hash);
CREATE INDEX IF NOT EXISTS idx_extractions_invoice ON public.document_extractions(invoice_number, supplier_name);
CREATE INDEX IF NOT EXISTS idx_findings_milestone ON public.verification_findings(milestone_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_milestone ON public.audit_logs(milestone_id, created_at DESC);
