import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project, Milestone, BOQItem, UserProfile, MilestoneStatus } from '../types/index.ts';
import { 
  INITIAL_PROJECTS, 
  INITIAL_MILESTONES, 
  INITIAL_BOQ_ITEMS, 
  INITIAL_CONTRACTORS 
} from '../lib/seedData.ts';

interface ProjectContextType {
  projects: Project[];
  milestones: Milestone[];
  boqItems: BOQItem[];
  contractors: UserProfile[];
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

  return (
    <ProjectContext.Provider
      value={{
        projects,
        milestones,
        boqItems,
        contractors,
        createProject,
        updateMilestoneStatus,
        getProjectById,
        getProjectMilestones,
        getMilestoneBOQ,
        getContractorProjects,
        addBOQItem,
        updateBOQItem,
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
