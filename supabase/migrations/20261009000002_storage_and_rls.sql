-- ====================================================================
-- SiteProof AI: Storage Bucket & Row Level Security (RLS) Policies
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
    file_size_limit = 52428800;

-- Enable RLS on all public tables
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

-- Helper function: Check if current user is admin/inspector
CREATE OR REPLACE FUNCTION public.is_inspector()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin_inspector'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Check if user is assigned contractor for project
CREATE OR REPLACE FUNCTION public.is_project_contractor(p_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.projects
        WHERE id = p_project_id AND assigned_contractor_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.project_members
        WHERE project_id = p_project_id AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -------------------------------------------------------------
-- RLS: Profiles
-- -------------------------------------------------------------
CREATE POLICY "Users can view all member profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert/update their own profile"
    ON public.profiles FOR ALL
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- -------------------------------------------------------------
-- RLS: Projects
-- -------------------------------------------------------------
CREATE POLICY "Inspectors can view all projects"
    ON public.projects FOR SELECT
    TO authenticated
    USING (public.is_inspector() OR assigned_contractor_id = auth.uid());

CREATE POLICY "Inspectors can manage projects"
    ON public.projects FOR ALL
    TO authenticated
    USING (public.is_inspector())
    WITH CHECK (public.is_inspector());

-- -------------------------------------------------------------
-- RLS: Milestones & BOQ Items
-- -------------------------------------------------------------
CREATE POLICY "Authorized users can view milestones"
    ON public.milestones FOR SELECT
    TO authenticated
    USING (public.is_inspector() OR public.is_project_contractor(project_id));

CREATE POLICY "Inspectors can manage milestones"
    ON public.milestones FOR ALL
    TO authenticated
    USING (public.is_inspector())
    WITH CHECK (public.is_inspector());

CREATE POLICY "Contractors can update submission status on assigned milestones"
    ON public.milestones FOR UPDATE
    TO authenticated
    USING (public.is_project_contractor(project_id))
    WITH CHECK (public.is_project_contractor(project_id));

CREATE POLICY "Authorized users can view BOQ items"
    ON public.boq_items FOR SELECT
    TO authenticated
    USING (public.is_inspector() OR public.is_project_contractor(project_id));

CREATE POLICY "Inspectors can manage BOQ items"
    ON public.boq_items FOR ALL
    TO authenticated
    USING (public.is_inspector())
    WITH CHECK (public.is_inspector());

-- -------------------------------------------------------------
-- RLS: Evidence Submissions & Files
-- -------------------------------------------------------------
CREATE POLICY "Users can view authorized evidence submissions"
    ON public.evidence_submissions FOR SELECT
    TO authenticated
    USING (public.is_inspector() OR public.is_project_contractor(project_id));

CREATE POLICY "Contractors can insert evidence submissions"
    ON public.evidence_submissions FOR INSERT
    TO authenticated
    WITH CHECK (public.is_project_contractor(project_id) AND contractor_id = auth.uid());

CREATE POLICY "Users can view evidence files"
    ON public.evidence_files FOR SELECT
    TO authenticated
    USING (public.is_inspector() OR public.is_project_contractor(project_id));

CREATE POLICY "Contractors and inspectors can insert evidence files"
    ON public.evidence_files FOR INSERT
    TO authenticated
    WITH CHECK (public.is_inspector() OR (public.is_project_contractor(project_id) AND uploaded_by = auth.uid()));

-- -------------------------------------------------------------
-- RLS: Document Extractions, Material Records & Findings
-- -------------------------------------------------------------
CREATE POLICY "Authorized users can view extractions"
    ON public.document_extractions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update document extractions"
    ON public.document_extractions FOR ALL
    TO authenticated
    USING (true);

CREATE POLICY "Authorized users can view findings"
    ON public.verification_findings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Inspectors can manage findings"
    ON public.verification_findings FOR ALL
    TO authenticated
    USING (public.is_inspector())
    WITH CHECK (public.is_inspector());

-- -------------------------------------------------------------
-- RLS: Inspector Decisions & Physical Inspections
-- -------------------------------------------------------------
CREATE POLICY "Authorized users can view decisions"
    ON public.inspector_decisions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Inspectors can create decisions"
    ON public.inspector_decisions FOR INSERT
    TO authenticated
    WITH CHECK (public.is_inspector() AND inspector_id = auth.uid());

CREATE POLICY "Authorized users can view physical inspections"
    ON public.physical_inspections FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Inspectors can manage physical inspections"
    ON public.physical_inspections FOR ALL
    TO authenticated
    USING (public.is_inspector())
    WITH CHECK (public.is_inspector());

-- -------------------------------------------------------------
-- RLS: Immutable Audit Logs (Append-Only)
-- -------------------------------------------------------------
CREATE POLICY "Authorized users can view audit logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated actors can append audit logs"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Explicitly disallow UPDATE and DELETE on audit logs
CREATE POLICY "No updates allowed on audit logs"
    ON public.audit_logs FOR UPDATE
    TO authenticated
    USING (false);

CREATE POLICY "No deletes allowed on audit logs"
    ON public.audit_logs FOR DELETE
    TO authenticated
    USING (false);

-- -------------------------------------------------------------
-- Storage Bucket Policies: evidence-files
-- -------------------------------------------------------------
CREATE POLICY "Authenticated users can upload evidence"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'evidence-files');

CREATE POLICY "Authenticated users can read evidence files"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'evidence-files');
