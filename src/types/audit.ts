/**
 * Types & Contracts for Inspector Decisions, Audit Trail, and Site Schedules
 */

export interface MilestoneDecision {
  milestoneId: string;
  status: 'verified' | 'rejected' | 'pending_evidence';
  inspectorName: string;
  inspectorEmail: string;
  inspectorRole: string;
  digitalSignature: string;
  decisionRemarks: string;
  checklistChecked: string[];
  overrideCriticalFlags?: boolean;
  decidedAt: string;
}

export interface AuditLogEntry {
  id: string;
  milestone_id: string;
  project_id: string;
  actor_name: string;
  actor_role: 'admin_inspector' | 'contractor' | 'system_ai';
  action_type: 
    | 'milestone_created'
    | 'milestone_updated'
    | 'evidence_uploaded'
    | 'ai_analyzed'
    | 'discrepancy_flagged'
    | 'discrepancy_resolved'
    | 'inspection_scheduled'
    | 'inspection_completed'
    | 'milestone_submitted'
    | 'milestone_approved'
    | 'milestone_rejected'
    | 'additional_evidence_requested';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ScheduledSiteInspection {
  id: string;
  milestone_id: string;
  project_id: string;
  inspector_name: string;
  scheduled_date: string;
  location: string;
  checklist_items: string[];
  objectives?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  completion_notes?: string;
  completed_at?: string;
  created_at: string;
}
