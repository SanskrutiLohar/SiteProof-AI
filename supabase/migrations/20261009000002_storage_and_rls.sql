-- ====================================================================
-- SiteProof AI: Production Storage Bucket & Row Level Security (RLS)
-- Comprehensive, Hardened, Non-Destructive Security Migration
-- ====================================================================

-- 1. Create Private Storage Bucket for Milestone Evidence
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'evidence-files',
    'evidence-files',
    false, -- Private bucket with authenticated token access
    52428800, -- 50 MB max limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];

-- 2. Enable Row Level Security (RLS) on ALL 16 Core Entity Tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approved_reference_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspector_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- 3. Security Definer Helper Functions (with explicit search_path)
-- -------------------------------------------------------------

-- Helper: Retrieve current user's role safely without RLS recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role
    FROM public.profiles
    WHERE id = auth.uid();
    RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Helper: Check if current authenticated user has the 'admin_inspector' role
CREATE OR REPLACE FUNCTION public.is_inspector()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.profiles
        WHERE id = auth.uid() 
          AND role = 'admin_inspector'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Helper: Check if current user is an authorized contractor for a specific project
CREATE OR REPLACE FUNCTION public.is_project_contractor(p_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF p_project_id IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        -- Directly assigned primary contractor
        SELECT 1 
        FROM public.projects p
        JOIN public.profiles pr ON pr.id = auth.uid()
        WHERE p.id = p_project_id 
          AND p.assigned_contractor_id = auth.uid()
          AND pr.role = 'contractor'
    ) OR EXISTS (
        -- Project member with authorized contractor/site role
        SELECT 1 
        FROM public.project_members pm
        JOIN public.profiles pr ON pr.id = auth.uid()
        WHERE pm.project_id = p_project_id 
          AND pm.user_id = auth.uid()
          AND pm.role IN ('contractor_lead', 'site_engineer')
          AND pr.role = 'contractor'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Helper: Check general project authorization (Inspector OR Project Contractor)
CREATE OR REPLACE FUNCTION public.has_project_access(p_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.is_inspector() OR public.is_project_contractor(p_project_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Helper: Safely extract and validate UUID from storage folder name without runtime errors
CREATE OR REPLACE FUNCTION public.safe_folder_uuid(p_name TEXT)
RETURNS UUID AS $$
DECLARE
    v_parts TEXT[];
    v_folder TEXT;
BEGIN
    IF p_name IS NULL THEN
        RETURN NULL;
    END IF;
    v_parts := storage.foldername(p_name);
    IF v_parts IS NULL OR array_length(v_parts, 1) < 1 THEN
        RETURN NULL;
    END IF;
    v_folder := v_parts[1];
    -- Validate standard UUID regex pattern: 8-4-4-4-12 hexadecimal digits
    IF v_folder ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        RETURN v_folder::UUID;
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT SET search_path = public, pg_temp;

-- Grant execution to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_inspector() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_project_contractor(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_project_access(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.safe_folder_uuid(TEXT) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.get_current_user_role() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_inspector() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_project_contractor(UUID) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_project_access(UUID) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.safe_folder_uuid(TEXT) FROM anon, public;

-- -------------------------------------------------------------
-- 4. Triggers for Column-Level Integrity & Anti-Tampering
-- -------------------------------------------------------------

-- Trigger function: Enforce milestone update constraints on contractors
CREATE OR REPLACE FUNCTION public.check_milestone_contractor_update()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT public.is_inspector() THEN
        -- Contractors cannot alter baseline configuration
        IF NEW.project_id <> OLD.project_id OR
           NEW.title <> OLD.title OR
           NEW.sequence_order <> OLD.sequence_order OR
           NEW.weight_percentage <> OLD.weight_percentage OR
           NEW.target_date <> OLD.target_date THEN
            RAISE EXCEPTION 'Contractors are not authorized to modify milestone configuration or baseline criteria.';
        END IF;

        -- Contractors can only advance status between pending, in_progress, and submitted
        IF NEW.status NOT IN ('pending', 'in_progress', 'submitted') THEN
            RAISE EXCEPTION 'Contractors cannot set milestone status to %', NEW.status;
        END IF;

        -- Contractors cannot modify verified or rejected milestones
        IF OLD.status IN ('verified', 'rejected') AND NEW.status <> OLD.status THEN
            RAISE EXCEPTION 'Contractors cannot reopen or alter verified/rejected milestones.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_check_milestone_update ON public.milestones;
CREATE TRIGGER trg_check_milestone_update
    BEFORE UPDATE ON public.milestones
    FOR EACH ROW
    EXECUTE FUNCTION public.check_milestone_contractor_update();

-- Trigger function: Enforce material record update constraints on contractors
CREATE OR REPLACE FUNCTION public.check_material_record_update()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT public.is_inspector() THEN
        -- Contractors cannot alter baseline quantities, units, rates, or financial fields
        IF NEW.project_id <> OLD.project_id OR
           NEW.milestone_id <> OLD.milestone_id OR
           NEW.material_name <> OLD.material_name OR
           NEW.unit <> OLD.unit OR
           NEW.planned_qty <> OLD.planned_qty OR
           NEW.unit_rate <> OLD.unit_rate OR
           NEW.ordered_qty <> OLD.ordered_qty OR
           NEW.paid_qty <> OLD.paid_qty THEN
            RAISE EXCEPTION 'Contractors may only update delivered or consumed quantities on material records.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_check_material_record_update ON public.material_records;
CREATE TRIGGER trg_check_material_record_update
    BEFORE UPDATE ON public.material_records
    FOR EACH ROW
    EXECUTE FUNCTION public.check_material_record_update();

-- -------------------------------------------------------------
-- 5. RLS Policies: Profiles (Recursion-Free)
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view member profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all member profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert/update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Inspectors can manage all profiles" ON public.profiles;

CREATE POLICY "Users can view member profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = id 
        AND (role = 'contractor' OR public.is_inspector())
    );

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        AND (
            -- Anti-escalation: role cannot change unless already inspector
            role = public.get_current_user_role()
            OR public.is_inspector()
        )
    );

CREATE POLICY "Inspectors can manage all profiles"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.is_inspector())
    WITH CHECK (public.is_inspector());

-- -------------------------------------------------------------
-- 6. RLS Policies: Projects & Project Members
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Inspectors can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Inspectors can manage projects" ON public.projects;
DROP POLICY IF EXISTS "Contractors can view assigned projects" ON public.projects;
DROP POLICY IF EXISTS "Authorized users can view projects" ON public.projects;
DROP POLICY IF EXISTS "Authorized users can view project members" ON public.project_members;
DROP POLICY IF EXISTS "Inspectors can manage project members" ON public.project_members;

CREATE POLICY "Authorized users can view projects"
    ON public.projects FOR SELECT
    TO authenticated
    USING (public.has_project_access(id));

CREATE POLICY "Inspectors can manage projects"
    ON public.projects FOR ALL
    TO authenticated
    USING (public.is_inspector())
    WITH CHECK (public.is_inspector());

CREATE POLICY "Authorized users can view project members"
    ON public.project_members FOR SELECT
    TO authenticated
    USING (public.has_project_access(project_id));

CREATE POLICY "Inspectors can manage project members"
    ON public.project_members FOR ALL
    TO authenticated
    USING (public.is_inspector())
    WITH CHECK (public.is_inspector());

-- -------------------------------------------------------------
-- 7. RLS Policies: Milestones, BOQ Items & Reference Evidence
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Authorized users can view milestones" ON public.milestones;
DROP POLICY IF EXISTS "Inspectors can manage milestones" ON public.milestones;
DROP POLICY IF EXISTS "Contractors can update status on assigned milestones" ON public.milestones;
DROP POLICY IF EXISTS "Contractors can update submission status on assigned milestones" ON public.milestones;
DROP POLICY IF EXISTS "Authorized users can view BOQ items" ON public.boq_items;
DROP POLICY IF EXISTS "Inspectors can manage BOQ items" ON public.boq_items;
DROP POLICY IF EXISTS "Authorized users can view reference evidence" ON public.approved_reference_evidence;
DROP POLICY IF EXISTS "Inspectors can manage reference evidence" ON public.approved_reference_evidence;

CREATE POLICY "Authorized users can view milestones"
    ON public.milestones FOR SELECT
    TO authenticated
    USING (public.has_project_access(project_id));

CREATE POLICY "Inspectors can manage milestones"
    ON public.milestones FOR ALL
    TO authenticated
    USING (public.is_inspector())
    WITH CHECK (public.is_inspector());

CREATE POLICY "Contractors can update status on assigned milestones"
    ON public.milestones FOR UPDATE
    TO authenticated
    USING (public.is_project_contractor(project_id))
    WITH CHECK (public.is_project_contractor(project_id));

CREATE POLICY "Authorized users can view BOQ items"
    ON public.boq_items FOR SELECT
    TO authenticated
    USING (public.has_project_access(project_id));

CREATE POLICY "Inspectors can manage BOQ items"
    ON public.boq_items FOR ALL
    TO authenticated
    USING (public.is_inspector())
    WITH CHECK (public.is_inspector());

CREATE POLICY "Authorized users can view reference evidence"
    ON public.approved_reference_evidence FOR SELECT
    TO authenticated
    USING (
        public.is_inspector() OR EXISTS (
            SELECT 1 FROM public.milestones m 
            WHERE m.id = milestone_id AND public.is_project_contractor(m.project_id)
        )
    );

CREATE POLICY "Inspectors can manage reference evidence"
    ON public.approved_reference_evidence FOR ALL
    TO authenticated
    USING (public.is_inspector())
    WITH CHECK (public.is_inspector());

-- -------------------------------------------------------------
-- 8. RLS Policies: Evidence Submissions & Files
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view authorized evidence submissions" ON public.evidence_submissions;
DROP POLICY IF EXISTS "Contractors can insert evidence submissions" ON public.evidence_submissions;
DROP POLICY IF EXISTS "Inspectors can manage evidence submissions" ON public.evidence_submissions;
DROP POLICY IF EXISTS "Users can view evidence files" ON public.evidence_files;
DROP POLICY IF EXISTS "Authorized users can insert evidence files" ON public.evidence_files;
DROP POLICY IF EXISTS "Contractors and inspectors can insert evidence files" ON public.evidence_files;
DROP POLICY IF EXISTS "Inspectors can manage evidence files" ON public.evidence_files;
DROP POLICY IF EXISTS "Authorized users can view project documents" ON public.project_documents;
DROP POLICY IF EXISTS "Inspectors can manage project documents" ON public.project_documents;

CREATE POLICY "Users can view authorized evidence submissions"
    ON public.evidence_submissions FOR SELECT
    TO authenticated
    USING (public.has_project_access(project_id));

CREATE POLICY "Contractors can insert evidence submissions"
    ON public.evidence_submissions FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_project_contractor(project_id) 
        AND contractor_id = auth.uid()
    );

CREATE POLICY "Inspectors can manage evidence submissions"
    ON public.evidence_submissions FOR ALL
    TO authenticated
    USING (public.is_inspector())
    WITH CHECK (public.is_inspector());

CREATE POLICY "Users can view evidence files"
    ON public.evidence_files FOR SELECT
    TO authenticated
    USING (public.has_project_access(project_id));

CREATE POLICY "Authorized users can insert evidence files"
    ON public.evidence_files FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_inspector() 
        OR (public.is_project_contractor(project_id) AND uploaded_by = auth.uid())
    );

CREATE POLICY "Inspectors can manage evidence files"
    ON public.evidence_files FOR ALL
    TO authenticated
    USING (public.is_inspector())
    WITH CHECK (public.is_inspector());

CREATE POLICY "Authorized users can view project documents"
    ON public.project_documents FOR SELECT
    TO authenticated
    USING (public.has_project_access(project_id));

CREATE POLICY "Inspectors can manage project documents"
    ON public.project_documents FOR ALL
    TO authenticated
    USING (public.is_inspector())
    WITH CHECK (public.is_inspector());

-- -------------------------------------------------------------
-- 9. RLS Policies: Document Extractions & Material Records
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Authorized users can view extractions" ON public.document_extractions;
DROP POLICY IF EXISTS "Authorized users can insert document extractions" ON public.document_extractions;
DROP POLICY IF EXISTS "Users can update document extractions" ON public.document_extractions;
DROP POLICY IF EXISTS "Inspectors can update document extractions" ON public.document_extractions;
DROP POLICY IF EXISTS "Inspectors can delete document extractions" ON public.document_extractions;
DROP POLICY IF EXISTS "Inspectors can manage document extractions" ON public.document_extractions;
DROP POLICY IF EXISTS "Authorized users can view material records" ON public.material_records;
DROP POLICY IF EXISTS "Inspectors can insert material records" ON public.material_records;
DROP POLICY IF EXISTS "Authorized users can update material records" ON public.material_records;
DROP POLICY IF EXISTS "Inspectors and contractors can update material records" ON public.material_records;
DROP POLICY IF EXISTS "Inspectors can delete material records" ON public.material_records;

CREATE POLICY "Authorized users can view extractions"
    ON public.document_extractions FOR SELECT
    TO authenticated
    USING (
        public.is_inspector() OR EXISTS (
            SELECT 1 FROM public.milestones m
            WHERE m.id = milestone_id AND public.is_project_contractor(m.project_id)
        )
    );

CREATE POLICY "Authorized users can insert document extractions"
    ON public.document_extractions FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_inspector() OR EXISTS (
            SELECT 1 FROM public.milestones m
            WHERE m.id = milestone_id AND public.is_project_contractor(m.project_id)
        )
    );

CREATE POLICY "Inspectors can update document extractions"
    ON public.document_extractions FOR UPDATE
    TO authenticated
    USING (public.is_inspector())
    WITH CHECK (public.is_inspector());

CREATE POLICY "Inspectors can delete document extractions"
    ON public.document_extractions FOR DELETE
    TO authenticated
    USING (public.is_inspector());

CREATE POLICY "Authorized users can view material records"
    ON public.material_records FOR SELECT
    TO authenticated
    USING (public.has_project_access(project_id));

CREATE POLICY "Inspectors can insert material records"
    ON public.material_records FOR INSERT
    TO authenticated
    WITH CHECK (public.is_inspector());

CREATE POLICY "Authorized users can update material records"
    ON public.material_records FOR UPDATE
    TO authenticated
    USING (public.has_project_access(project_id))
    WITH CHECK (public.has_project_access(project_id));

CREATE POLICY "Inspectors can delete material records"
    ON public.material_records FOR DELETE
    TO authenticated
    USING (public.is_inspector());

-- -------------------------------------------------------------
-- 10. RLS Policies: Verification Runs & Findings
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Authorized users can view verification runs" ON public.verification_runs;
DROP POLICY IF EXISTS "Inspectors can manage verification runs" ON public.verification_runs;
DROP POLICY IF EXISTS "Authorized users can view findings" ON public.verification_findings;
DROP POLICY IF EXISTS "Inspectors can manage findings" ON public.verification_findings;

CREATE POLICY "Authorized users can view verification runs"
    ON public.verification_runs FOR SELECT
    TO authenticated
    USING (public.has_project_access(project_id));

CREATE POLICY "Inspectors can manage verification runs"
    ON public.verification_runs FOR ALL
    TO authenticated
    USING (public.is_inspector())
    WITH CHECK (public.is_inspector());

CREATE POLICY "Authorized users can view findings"
    ON public.verification_findings FOR SELECT
    TO authenticated
    USING (
        public.is_inspector() OR EXISTS (
            SELECT 1 FROM public.milestones m
            WHERE m.id = milestone_id AND public.is_project_contractor(m.project_id)
        )
    );

CREATE POLICY "Inspectors can manage findings"
    ON public.verification_findings FOR ALL
    TO authenticated
    USING (public.is_inspector())
    WITH CHECK (public.is_inspector());

-- -------------------------------------------------------------
-- 11. RLS Policies: Inspector Decisions & Physical Inspections
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Authorized users can view decisions" ON public.inspector_decisions;
DROP POLICY IF EXISTS "Inspectors can create decisions" ON public.inspector_decisions;
DROP POLICY IF EXISTS "Inspectors can manage decisions" ON public.inspector_decisions;
DROP POLICY IF EXISTS "Authorized users can view physical inspections" ON public.physical_inspections;
DROP POLICY IF EXISTS "Inspectors can manage physical inspections" ON public.physical_inspections;

CREATE POLICY "Authorized users can view decisions"
    ON public.inspector_decisions FOR SELECT
    TO authenticated
    USING (public.has_project_access(project_id));

CREATE POLICY "Inspectors can create decisions"
    ON public.inspector_decisions FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_inspector() 
        AND inspector_id = auth.uid()
    );

CREATE POLICY "Inspectors can manage decisions"
    ON public.inspector_decisions FOR ALL
    TO authenticated
    USING (public.is_inspector())
    WITH CHECK (public.is_inspector());

CREATE POLICY "Authorized users can view physical inspections"
    ON public.physical_inspections FOR SELECT
    TO authenticated
    USING (public.has_project_access(project_id));

CREATE POLICY "Inspectors can manage physical inspections"
    ON public.physical_inspections FOR ALL
    TO authenticated
    USING (public.is_inspector())
    WITH CHECK (public.is_inspector());

-- -------------------------------------------------------------
-- 12. RLS Policies: Immutable Audit Logs (Append-Only)
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Authorized users can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authorized actors can append audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated actors can append audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "No updates allowed on audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "No deletes allowed on audit logs" ON public.audit_logs;

CREATE POLICY "Authorized users can view audit logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (
        public.is_inspector() 
        OR (project_id IS NOT NULL AND public.is_project_contractor(project_id))
    );

CREATE POLICY "Authorized actors can append audit logs"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (
        actor_id = auth.uid()
        AND (
            public.is_inspector() 
            OR (project_id IS NOT NULL AND public.is_project_contractor(project_id))
        )
    );

-- Audit logs are strictly immutable: no updates or deletes permitted
CREATE POLICY "No updates allowed on audit logs"
    ON public.audit_logs FOR UPDATE
    TO authenticated
    USING (false);

CREATE POLICY "No deletes allowed on audit logs"
    ON public.audit_logs FOR DELETE
    TO authenticated
    USING (false);

-- -------------------------------------------------------------
-- 13. Storage Bucket Security Policies (evidence-files)
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can upload evidence" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read evidence files" ON storage.objects;
DROP POLICY IF EXISTS "Authorized users can upload evidence files" ON storage.objects;
DROP POLICY IF EXISTS "Authorized users can read evidence files" ON storage.objects;
DROP POLICY IF EXISTS "Inspectors can delete evidence files" ON storage.objects;

-- Read policy: Project-scoped authorization on storage path /evidence-files/<project_id>/...
CREATE POLICY "Authorized users can read evidence files"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'evidence-files' 
        AND (
            public.is_inspector() 
            OR public.is_project_contractor(public.safe_folder_uuid(name))
        )
    );

-- Upload policy: Project-scoped authorization on storage path /evidence-files/<project_id>/...
CREATE POLICY "Authorized users can upload evidence files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'evidence-files' 
        AND (
            public.is_inspector() 
            OR public.is_project_contractor(public.safe_folder_uuid(name))
        )
    );

-- Delete policy: Restricted strictly to lead inspectors
CREATE POLICY "Inspectors can delete evidence files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'evidence-files' 
        AND public.is_inspector()
    );
