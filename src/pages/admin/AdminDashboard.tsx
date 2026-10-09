import React, { useState } from 'react';
import { useProjects } from '../../context/ProjectContext.tsx';
import { ProjectCard } from '../../components/projects/ProjectCard.tsx';
import { CreateProjectModal } from '../../components/projects/CreateProjectModal.tsx';
import { 
  Building2, 
  Plus, 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { projects, milestones } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalProjects = projects.length;
  const verifiedMilestones = milestones.filter(m => m.status === 'verified').length;
  const pendingMilestones = milestones.filter(m => m.status === 'in_progress' || m.status === 'submitted').length;
  const totalBudget = projects.reduce((sum, p) => sum + p.total_budget, 0);

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl glass-panel border border-blue-500/20 bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-slate-950">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Inspector & Admin Cockpit
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Construction Milestone Audit Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Monitor active infrastructure projects, track contractor progress submissions, and verify physical milestones against contract BOQ baselines.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-glow-brand transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create New Project
        </button>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl glass-card border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Monitored Projects</span>
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalProjects}</div>
          <p className="text-[10px] text-slate-500 mt-1">Across civil & commercial zones</p>
        </div>

        <div className="p-4 rounded-xl glass-card border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Total Capital Budget</span>
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">${(totalBudget / 1000000).toFixed(1)}M</div>
          <p className="text-[10px] text-slate-500 mt-1">Under strict BOQ auditing</p>
        </div>

        <div className="p-4 rounded-xl glass-card border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Pending Reviews</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{pendingMilestones}</div>
          <p className="text-[10px] text-slate-500 mt-1">Awaiting evidence / inspection</p>
        </div>

        <div className="p-4 rounded-xl glass-card border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Verified Milestones</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{verifiedMilestones}</div>
          <p className="text-[10px] text-slate-500 mt-1">Audited and approved</p>
        </div>
      </div>

      {/* Project Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects, codes, locations..."
            className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="text-xs text-slate-400">
          Showing <span className="font-bold text-white">{filteredProjects.length}</span> of {projects.length} projects
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center glass-panel rounded-2xl border border-slate-800">
          <AlertCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300">No projects match your search query</h3>
          <p className="text-xs text-slate-500 mt-1">Try searching for a different keyword or create a new project.</p>
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
