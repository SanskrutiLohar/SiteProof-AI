import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Project, 
  Milestone, 
  BOQItem, 
  UserProfile, 
  MilestoneStatus, 
  EvidenceItem,
  DiscrepancyFlag
} from '../types/index.ts';
import { MilestoneReconciliationReport } from '../types/ai.ts';
import { 
  MilestoneDecision, 
  AuditLogEntry, 
  ScheduledSiteInspection 
} from '../types/audit.ts';
import { 
  INITIAL_PROJECTS, 
  INITIAL_MILESTONES, 
  INITIAL_BOQ_ITEMS, 
  INITIAL_CONTRACTORS 
} from '../lib/seedData.ts';
import { INITIAL_EVIDENCE, generateSampleEvidenceForMilestone } from '../lib/sampleEvidence.ts';
import { analyzeEvidenceWithAI } from '../lib/geminiApi.ts';
import { performMilestoneReconciliation } from '../lib/reconciliationEngine.ts';

interface ProjectContextType {
  projects: Project[];
  milestones: Milestone[];
  boqItems: BOQItem[];
  contractors: UserProfile[];
  evidence: EvidenceItem[];
  discrepancies: DiscrepancyFlag[];
  schedules: ScheduledSiteInspection[];
  auditLogs: AuditLogEntry[];
  decisions: MilestoneDecision[];
  createProject: (
    projectData: Omit<Project, 'id' | 'created_at'>,
    milestoneList: Array<Omit<Milestone, 'id' | 'project_id' | 'created_at'>>
  ) => Project;
  updateMilestoneStatus: (milestoneId: string, status: MilestoneStatus) => void;
  getProjectById: (projectId: string) => Project | undefined;
  getProjectMilestones: (projectId: string) => Milestone[];
  getMilestoneBOQ: (milestoneId: string) => BOQItem[];
  getContractorProjects: (contractorId: string) => Project[];
  addBOQItem: (item: Omit<BOQItem, 'id'>) => BOQItem;
  updateBOQItem: (id: string, updates: Partial<BOQItem>) => void;
  // Evidence Management
  addEvidence: (evidenceData: Omit<EvidenceItem, 'id' | 'uploaded_at'>) => EvidenceItem;
  deleteEvidence: (evidenceId: string) => void;
  getMilestoneEvidence: (milestoneId: string) => EvidenceItem[];
  getProjectEvidence: (projectId: string) => EvidenceItem[];
  loadSampleEvidenceForMilestone: (milestoneId: string, projectId: string) => void;
  // AI Verification & Discrepancies
  runMilestoneAIAnalysis: (milestoneId: string) => Promise<MilestoneReconciliationReport>;
  getMilestoneDiscrepancies: (milestoneId: string) => DiscrepancyFlag[];
  getProjectDiscrepancies: (projectId: string) => DiscrepancyFlag[];
  resolveDiscrepancy: (flagId: string, resolutionNote?: string) => void;
  dismissDiscrepancy: (flagId: string) => void;
  // Inspection Schedules & Certified Decisions
  scheduleInspection: (data: Omit<ScheduledSiteInspection, 'id' | 'created_at'>) => ScheduledSiteInspection;
  updateInspectionStatus: (id: string, status: ScheduledSiteInspection['status'], notes?: string) => void;
  getMilestoneSchedules: (milestoneId: string) => ScheduledSiteInspection[];
  addAuditLog: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => AuditLogEntry;
  getMilestoneAuditLogs: (milestoneId: string) => AuditLogEntry[];
  recordMilestoneDecision: (decision: MilestoneDecision) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('siteproof_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const [milestones, setMilestones] = useState<Milestone[]>(() => {
    const saved = localStorage.getItem('siteproof_milestones');
    return saved ? JSON.parse(saved) : INITIAL_MILESTONES;
  });

  const [boqItems, setBoqItems] = useState<BOQItem[]>(() => {
    const saved = localStorage.getItem('siteproof_boq_items');
    return saved ? JSON.parse(saved) : INITIAL_BOQ_ITEMS;
  });

  const [evidence, setEvidence] = useState<EvidenceItem[]>(() => {
    const saved = localStorage.getItem('siteproof_evidence');
    return saved ? JSON.parse(saved) : INITIAL_EVIDENCE;
  });

  const [discrepancies, setDiscrepancies] = useState<DiscrepancyFlag[]>(() => {
    const saved = localStorage.getItem('siteproof_discrepancies');
    return saved ? JSON.parse(saved) : [];
  });

  const [schedules, setSchedules] = useState<ScheduledSiteInspection[]>(() => {
    const saved = localStorage.getItem('siteproof_schedules');
    return saved ? JSON.parse(saved) : [];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem('siteproof_audit_logs');
    return saved ? JSON.parse(saved) : [
      {
        id: 'log-seed-01',
        milestone_id: 'm-metro-01',
        project_id: 'proj-metro-01',
        actor_name: 'David Vance (Senior Lead Auditor)',
        actor_role: 'admin_inspector',
        action_type: 'milestone_created',
        title: 'Milestone Baseline Established',
        description: 'Contractual Bill of Quantities (BOQ) and QA benchmark tolerances initialized.',
        timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
      }
    ];
  });

  const [decisions, setDecisions] = useState<MilestoneDecision[]>(() => {
    const saved = localStorage.getItem('siteproof_decisions');
    return saved ? JSON.parse(saved) : [];
  });

  const [contractors] = useState<UserProfile[]>(INITIAL_CONTRACTORS);

  useEffect(() => {
    localStorage.setItem('siteproof_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('siteproof_milestones', JSON.stringify(milestones));
  }, [milestones]);

  useEffect(() => {
    localStorage.setItem('siteproof_boq_items', JSON.stringify(boqItems));
  }, [boqItems]);

  useEffect(() => {
    try {
      localStorage.setItem('siteproof_evidence', JSON.stringify(evidence));
    } catch (e) {
      console.warn('LocalStorage quota limit reached for evidence cache, persisting in memory:', e);
    }
  }, [evidence]);

  useEffect(() => {
    localStorage.setItem('siteproof_discrepancies', JSON.stringify(discrepancies));
  }, [discrepancies]);

  useEffect(() => {
    localStorage.setItem('siteproof_schedules', JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem('siteproof_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('siteproof_decisions', JSON.stringify(decisions));
  }, [decisions]);

  const getProjectById = (projectId: string) => {
    return projects.find((p) => p.id === projectId);
  };

  const getProjectMilestones = (projectId: string) => {
    return milestones
      .filter((m) => m.project_id === projectId)
      .sort((a, b) => a.sequence_order - b.sequence_order);
  };

  const getMilestoneBOQ = (milestoneId: string) => {
    return boqItems.filter((b) => b.milestone_id === milestoneId);
  };

  const getContractorProjects = (contractorId: string) => {
    return projects.filter((p) => p.assigned_contractor_id === contractorId);
  };

  const createProject = (
    projectData: Omit<Project, 'id' | 'created_at'>,
    milestoneList: Array<Omit<Milestone, 'id' | 'project_id' | 'created_at'>>
  ): Project => {
    const projectId = `proj-${Date.now()}`;
    const contractor = contractors.find(c => c.id === projectData.assigned_contractor_id);

    const newProject: Project = {
      ...projectData,
      id: projectId,
      assigned_contractor_name: contractor?.organization || contractor?.full_name || 'Assigned Contractor',
      created_at: new Date().toISOString(),
    };

    const newMilestones: Milestone[] = milestoneList.map((m, idx) => ({
      ...m,
      id: `m-${projectId}-${idx + 1}`,
      project_id: projectId,
      sequence_order: idx + 1,
      status: 'pending',
      version: 1,
      created_at: new Date().toISOString(),
    }));

    setProjects((prev) => [newProject, ...prev]);
    setMilestones((prev) => [...prev, ...newMilestones]);

    addAuditLog({
      milestone_id: newMilestones[0]?.id || '',
      project_id: projectId,
      actor_name: 'System Admin',
      actor_role: 'admin_inspector',
      action_type: 'milestone_created',
      title: 'Project & Milestones Created',
      description: `Project ${newProject.code} created with ${newMilestones.length} milestones.`,
    });

    return newProject;
  };

  const updateMilestoneStatus = (milestoneId: string, status: MilestoneStatus) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === milestoneId ? { ...m, status, version: (m.version || 1) + 1 } : m))
    );

    const targetMilestone = milestones.find((m) => m.id === milestoneId);
    if (targetMilestone) {
      addAuditLog({
        milestone_id: milestoneId,
        project_id: targetMilestone.project_id,
        actor_name: 'Workflow Engine',
        actor_role: 'system_ai',
        action_type: status === 'submitted' ? 'milestone_submitted' : status === 'verified' ? 'milestone_approved' : 'milestone_rejected',
        title: `Milestone Status: ${status.toUpperCase()}`,
        description: `Milestone "${targetMilestone.title}" transitioned to ${status}.`,
      });
    }
  };

  const addBOQItem = (item: Omit<BOQItem, 'id'>): BOQItem => {
    const newItem: BOQItem = {
      ...item,
      id: `boq-${Date.now()}`,
    };
    setBoqItems((prev) => [...prev, newItem]);
    return newItem;
  };

  const updateBOQItem = (id: string, updates: Partial<BOQItem>) => {
    setBoqItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // Evidence Helpers
  const addEvidence = (evidenceData: Omit<EvidenceItem, 'id' | 'uploaded_at'>): EvidenceItem => {
    const newEvidence: EvidenceItem = {
      ...evidenceData,
      id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      uploaded_at: new Date().toISOString(),
    };

    setEvidence((prev) => [newEvidence, ...prev]);

    addAuditLog({
      milestone_id: evidenceData.milestone_id,
      project_id: evidenceData.project_id,
      actor_name: evidenceData.uploaded_by_name || 'Contractor Site Rep',
      actor_role: 'contractor',
      action_type: 'evidence_uploaded',
      title: `Evidence Uploaded: ${evidenceData.type.toUpperCase()}`,
      description: `Uploaded "${evidenceData.file_name}" at ${evidenceData.location_name || 'Site'}. SHA-256 registered.`,
      metadata: { sha256: evidenceData.sha256_hash },
    });

    return newEvidence;
  };

  const deleteEvidence = (evidenceId: string) => {
    setEvidence((prev) => prev.filter((item) => item.id !== evidenceId));
  };

  const getMilestoneEvidence = (milestoneId: string) => {
    return evidence.filter((item) => item.milestone_id === milestoneId);
  };

  const getProjectEvidence = (projectId: string) => {
    return evidence.filter((item) => item.project_id === projectId);
  };

  const loadSampleEvidenceForMilestone = (milestoneId: string, projectId: string) => {
    const existing = evidence.filter((e) => e.milestone_id === milestoneId);
    if (existing.length > 0) {
      return;
    }

    const initialPack = INITIAL_EVIDENCE.filter((e) => e.milestone_id === milestoneId);
    if (initialPack.length > 0) {
      setEvidence((prev) => [...initialPack, ...prev]);
    } else {
      const generatedPack = generateSampleEvidenceForMilestone(milestoneId, projectId);
      setEvidence((prev) => [...generatedPack, ...prev]);
    }

    addAuditLog({
      milestone_id: milestoneId,
      project_id: projectId,
      actor_name: 'System Pre-flight',
      actor_role: 'system_ai',
      action_type: 'evidence_uploaded',
      title: 'Demo Evidence Package Loaded',
      description: 'Loaded authentic high-resolution site photos, delivery challans, and tax invoices.',
    });
  };

  // AI Verification & Discrepancies
  const runMilestoneAIAnalysis = async (milestoneId: string): Promise<MilestoneReconciliationReport> => {
    const milestoneItems = evidence.filter((e) => e.milestone_id === milestoneId);
    const boqs = boqItems.filter((b) => b.milestone_id === milestoneId);

    const updatedEvidenceItems: EvidenceItem[] = [];

    for (const item of milestoneItems) {
      const aiResult = await analyzeEvidenceWithAI(item);
      const updatedItem: EvidenceItem = {
        ...item,
        ai_analyzed: true,
        ai_summary: aiResult.rawSummary,
        ai_confidence: aiResult.confidence,
      };
      updatedEvidenceItems.push(updatedItem);
    }

    setEvidence((prev) =>
      prev.map((ev) => {
        const match = updatedEvidenceItems.find((u) => u.id === ev.id);
        return match || ev;
      })
    );

    const { report, discrepancies: newDiscrepancies } = performMilestoneReconciliation(
      milestoneId,
      boqs,
      updatedEvidenceItems
    );

    setDiscrepancies((prev) => [
      ...prev.filter((f) => f.milestone_id !== milestoneId),
      ...newDiscrepancies,
    ]);

    const currentMilestone = milestones.find((m) => m.id === milestoneId);
    if (currentMilestone && currentMilestone.status === 'pending') {
      updateMilestoneStatus(milestoneId, 'in_progress');
    }

    addAuditLog({
      milestone_id: milestoneId,
      project_id: currentMilestone?.project_id || '',
      actor_name: 'Gemini Multimodal AI',
      actor_role: 'system_ai',
      action_type: 'ai_analyzed',
      title: 'AI Vision & Document OCR Audit Completed',
      description: `Reconciled ${boqs.length} BOQ items. Match score: ${report.overallConfidence}%. Flagged ${newDiscrepancies.length} discrepancies.`,
    });

    return report;
  };

  const getMilestoneDiscrepancies = (milestoneId: string) => {
    return discrepancies.filter((d) => d.milestone_id === milestoneId);
  };

  const getProjectDiscrepancies = (projectId: string) => {
    const projectMilestoneIds = milestones
      .filter((m) => m.project_id === projectId)
      .map((m) => m.id);
    return discrepancies.filter((d) => projectMilestoneIds.includes(d.milestone_id));
  };

  const resolveDiscrepancy = (flagId: string, resolutionNote?: string) => {
    setDiscrepancies((prev) =>
      prev.map((d) =>
        d.id === flagId
          ? {
              ...d,
              status: 'resolved',
            }
          : d
      )
    );

    const flag = discrepancies.find((d) => d.id === flagId);
    if (flag) {
      addAuditLog({
        milestone_id: flag.milestone_id,
        project_id: '',
        actor_name: 'Lead Inspector',
        actor_role: 'admin_inspector',
        action_type: 'discrepancy_resolved',
        title: `Discrepancy Resolved: ${flag.title}`,
        description: resolutionNote || 'Auditor marked discrepancy as verified/resolved.',
      });
    }
  };

  const dismissDiscrepancy = (flagId: string) => {
    setDiscrepancies((prev) =>
      prev.map((d) => (d.id === flagId ? { ...d, status: 'dismissed' } : d))
    );
  };

  // Physical Inspections & Decisions
  const scheduleInspection = (data: Omit<ScheduledSiteInspection, 'id' | 'created_at'>): ScheduledSiteInspection => {
    const newSchedule: ScheduledSiteInspection = {
      ...data,
      id: `sched-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    setSchedules((prev) => [newSchedule, ...prev]);

    addAuditLog({
      milestone_id: data.milestone_id,
      project_id: data.project_id,
      actor_name: data.inspector_name,
      actor_role: 'admin_inspector',
      action_type: 'inspection_scheduled',
      title: 'Physical Site Inspection Scheduled',
      description: `Scheduled for ${new Date(data.scheduled_date).toLocaleString()} at ${data.location}.`,
    });

    return newSchedule;
  };

  const updateInspectionStatus = (
    id: string,
    status: ScheduledSiteInspection['status'],
    notes?: string
  ) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status,
              completion_notes: notes || s.completion_notes,
              completed_at: status === 'completed' ? new Date().toISOString() : s.completed_at,
            }
          : s
      )
    );
  };

  const getMilestoneSchedules = (milestoneId: string) => {
    return schedules.filter((s) => s.milestone_id === milestoneId);
  };

  const addAuditLog = (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry => {
    const newLog: AuditLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };

    setAuditLogs((prev) => [newLog, ...prev]);
    return newLog;
  };

  const getMilestoneAuditLogs = (milestoneId: string) => {
    return auditLogs
      .filter((l) => l.milestone_id === milestoneId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const recordMilestoneDecision = (decision: MilestoneDecision) => {
    setDecisions((prev) => [
      ...prev.filter((d) => d.milestoneId !== decision.milestoneId),
      decision,
    ]);

    const targetStatus: MilestoneStatus = 
      decision.status === 'verified' 
        ? 'verified' 
        : decision.status === 'rejected' 
        ? 'rejected' 
        : 'in_progress';

    updateMilestoneStatus(decision.milestoneId, targetStatus);

    const targetMilestone = milestones.find((m) => m.id === decision.milestoneId);
    addAuditLog({
      milestone_id: decision.milestoneId,
      project_id: targetMilestone?.project_id || '',
      actor_name: decision.inspectorName,
      actor_role: 'admin_inspector',
      action_type: decision.status === 'verified' ? 'milestone_approved' : decision.status === 'rejected' ? 'milestone_rejected' : 'additional_evidence_requested',
      title: `Official Inspector Sign-off: ${decision.status.toUpperCase()}`,
      description: `Auditor signature: "${decision.digitalSignature}". Remarks: ${decision.decisionRemarks}`,
      metadata: {
        digital_signature: decision.digitalSignature,
        checklist_checked: decision.checklistChecked,
      },
    });
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        milestones,
        boqItems,
        contractors,
        evidence,
        discrepancies,
        schedules,
        auditLogs,
        decisions,
        createProject,
        updateMilestoneStatus,
        getProjectById,
        getProjectMilestones,
        getMilestoneBOQ,
        getContractorProjects,
        addBOQItem,
        updateBOQItem,
        addEvidence,
        deleteEvidence,
        getMilestoneEvidence,
        getProjectEvidence,
        loadSampleEvidenceForMilestone,
        runMilestoneAIAnalysis,
        getMilestoneDiscrepancies,
        getProjectDiscrepancies,
        resolveDiscrepancy,
        dismissDiscrepancy,
        scheduleInspection,
        updateInspectionStatus,
        getMilestoneSchedules,
        addAuditLog,
        getMilestoneAuditLogs,
        recordMilestoneDecision,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};
