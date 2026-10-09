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
  // Phase 3 AI Verification & Discrepancies
  runMilestoneAIAnalysis: (milestoneId: string) => Promise<MilestoneReconciliationReport>;
  getMilestoneDiscrepancies: (milestoneId: string) => DiscrepancyFlag[];
  getProjectDiscrepancies: (projectId: string) => DiscrepancyFlag[];
  resolveDiscrepancy: (flagId: string, resolutionNote?: string) => void;
  dismissDiscrepancy: (flagId: string) => void;
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
    localStorage.setItem('siteproof_evidence', JSON.stringify(evidence));
  }, [evidence]);

  useEffect(() => {
    localStorage.setItem('siteproof_discrepancies', JSON.stringify(discrepancies));
  }, [discrepancies]);

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
      created_at: new Date().toISOString(),
    }));

    setProjects((prev) => [newProject, ...prev]);
    setMilestones((prev) => [...prev, ...newMilestones]);

    return newProject;
  };

  const updateMilestoneStatus = (milestoneId: string, status: MilestoneStatus) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === milestoneId ? { ...m, status } : m))
    );
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
  };

  // Phase 3 AI Verification & Discrepancies
  const runMilestoneAIAnalysis = async (milestoneId: string): Promise<MilestoneReconciliationReport> => {
    const milestoneItems = evidence.filter((e) => e.milestone_id === milestoneId);
    const boqs = boqItems.filter((b) => b.milestone_id === milestoneId);

    // 1. Analyze each un-analyzed evidence item
    const updatedEvidenceItems: EvidenceItem[] = [];

    for (const item of milestoneItems) {
      const aiResult = await analyzeEvidenceWithAI(item);
      updatedEvidenceItems.push({
        ...item,
        ai_analyzed: true,
        ai_summary: aiResult.rawSummary,
        ai_confidence: aiResult.confidence,
      });
    }

    // Update evidence in context
    setEvidence((prev) =>
      prev.map((e) => {
        const match = updatedEvidenceItems.find((u) => u.id === e.id);
        return match || e;
      })
    );

    // 2. Perform 5-stage quantity reconciliation & discrepancy analysis
    const { report, discrepancies: newFlags } = performMilestoneReconciliation(
      milestoneId,
      boqs,
      updatedEvidenceItems
    );

    // Update discrepancies state (replacing existing open flags for this milestone)
    setDiscrepancies((prev) => [
      ...prev.filter((f) => f.milestone_id !== milestoneId),
      ...newFlags,
    ]);

    // Update milestone status to in_progress if still pending
    const currentMilestone = milestones.find((m) => m.id === milestoneId);
    if (currentMilestone && currentMilestone.status === 'pending') {
      updateMilestoneStatus(milestoneId, 'in_progress');
    }

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

  const resolveDiscrepancy = (flagId: string) => {
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
  };

  const dismissDiscrepancy = (flagId: string) => {
    setDiscrepancies((prev) =>
      prev.map((d) => (d.id === flagId ? { ...d, status: 'dismissed' } : d))
    );
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
