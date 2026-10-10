import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProjects } from '../../context/ProjectContext.tsx';
import { isProjectAccessible } from '../../lib/projectAccess.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { MilestoneList } from '../../components/projects/MilestoneList.tsx';
import { 
  Building2, 
  MapPin, 
  IndianRupee, 
  HardHat, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Layers,
  Lock
} from 'lucide-react';

export const ContractorProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { profile } = useAuth();
  const { getProjectById, getProjectMilestones } = useProjects();

  const project = getProjectById(projectId || '');
  const milestones = getProjectMilestones(projectId || '');

  if (!project || !isProjectAccessible(project, profile)) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-lg shadow-amber-950/30">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Private Contract Workspace</h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
          This construction contract is private and confidential. You do not have authorization to view this project.
        </p>
        <div className="pt-2">
          <Link 
            to="/contractor/dashboard" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to Assigned Contracts
          </Link>
        </div>
      </div>
    );
  }

  const verifiedCount = milestones.filter(m => m.status === 'verified').length;
  const totalCount = milestones.length;
  const progressPercent = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back Link */}
      <div>
        <Link
          to="/contractor/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Assigned Contracts
        </Link>
      </div>

      {/* Project Header Banner */}
      <div className="p-6 rounded-2xl glass-panel border border-amber-500/20 bg-gradient-to-r from-amber-950/40 via-slate-900/70 to-slate-950 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {project.code}
            </span>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
              <HardHat className="w-3.5 h-3.5 text-amber-400" />
              Contractor Scope
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {project.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            {project.description || 'Select a milestone stage below to capture live site photographs, upload invoices/challans, and submit evidence packages for AI verification.'}
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-500" />
              {project.location}
            </span>
            <span className="flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-emerald-400" />
              Budget: ₹{project.total_budget.toLocaleString('en-IN')}
            </span>
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-400" />
              Client: {project.client_name}
            </span>
          </div>
        </div>

        {/* Progress Summary Card */}
        <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 shrink-0 w-full lg:w-72">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-400 font-semibold">Audit Progress</span>
            <span className="text-amber-400 font-bold">{progressPercent}% Completed</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {verifiedCount} Verified
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              {totalCount - verifiedCount} Remaining
            </span>
          </div>
        </div>
      </div>

      {/* Instructions Banner */}
      <div className="p-4 rounded-xl glass-card border border-blue-500/30 bg-blue-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">
              Evidence Intake & AI Verification Active
            </h4>
            <p className="text-[11px] text-slate-400">
              Click on any milestone stage below to launch the camera with GPS timestamp stamping or upload documents for OCR parsing.
            </p>
          </div>
        </div>
      </div>

      {/* Milestone Stages List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            Milestone Stages ({milestones.length})
          </h2>
          <span className="text-xs text-slate-400">
            Select a milestone to submit evidence
          </span>
        </div>

        <MilestoneList
          milestones={milestones}
          projectId={project.id}
          isContractor={true}
        />
      </div>
    </div>
  );
};
