export type UserRole = 'admin_inspector' | 'contractor';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  organization?: string;
  avatar_url?: string;
  created_at?: string;
}

export type MilestoneStatus = 'pending' | 'in_progress' | 'submitted' | 'verified' | 'rejected';

export interface BOQItem {
  id: string;
  milestone_id: string;
  item_code: string;
  description: string;
  unit: string; // e.g., 'MT', 'Cu.m', 'Sq.m', 'Bags', 'R.m'
  quantity_ordered: number;
  quantity_delivered?: number;
  quantity_billed?: number;
  quantity_paid?: number;
  quantity_consumed?: number;
  unit_rate: number;
  notes?: string;
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string;
  sequence_order: number;
  weight_percentage: number;
  target_date: string;
  status: MilestoneStatus;
  version?: number; // Optimistic Concurrency Control
  boq_items?: BOQItem[];
  reference_images?: string[]; // Admin uploaded CAD / blueprint reference photos for this phase
  reference_specs?: string;
  created_at?: string;
}

export interface Project {
  id: string;
  title: string;
  code: string;
  description: string;
  location: string;
  client_name: string;
  total_budget: number;
  assigned_contractor_id: string;
  assigned_contractor_name?: string;
  reference_blueprint_url?: string; // Master project reference blueprint
  reference_images?: string[]; // Project-wide reference drawings
  created_by?: string;
  created_at?: string;
  milestones?: Milestone[];
}

export interface VLMComparisonResult {
  reference_image_url: string;
  reference_title?: string;
  compliance_score: number; // 0 - 100
  verdict: 'compliant' | 'minor_deviation' | 'critical_deviation';
  alignment_details: string;
  detected_matches: string[];
  detected_deviations: string[];
  analyzed_at: string;
}

export interface EvidenceItem {
  id: string;
  milestone_id: string;
  project_id: string;
  uploaded_by: string;
  uploaded_by_name?: string;
  type: 'photo' | 'invoice' | 'challan' | 'inspection_report';
  file_url: string;
  file_name: string;
  file_size?: number;
  sha256_hash?: string;
  perceptual_hash?: string;
  latitude?: number;
  longitude?: number;
  location_name?: string;
  captured_at?: string;
  uploaded_at: string;
  status?: 
    | 'UPLOAD_PENDING'
    | 'UPLOAD_FAILED'
    | 'PROCESSING_PENDING'
    | 'PROCESSING_FAILED'
    | 'VERIFICATION_COMPLETE'
    | 'NEEDS_REVIEW'
    | 'APPROVED'
    | 'REJECTED'
    | 'MORE_EVIDENCE_REQUIRED';
  ai_analyzed?: boolean;
  ai_summary?: string;
  ai_confidence?: number;
  vlm_comparison?: VLMComparisonResult;
  tags?: string[];
}

export interface DiscrepancyFlag {
  id: string;
  milestone_id: string;
  evidence_id?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  flag_type: 'quantity_mismatch' | 'duplicate_document' | 'date_anomaly' | 'visual_incomplete' | 'geofence_mismatch';
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  created_at: string;
}

export interface InspectionSchedule {
  id: string;
  milestone_id: string;
  project_id: string;
  inspector_name: string;
  scheduled_date: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}
