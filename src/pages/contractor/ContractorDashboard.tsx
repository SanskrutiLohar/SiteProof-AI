import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useProjects } from '../../context/ProjectContext.tsx';
import { ProjectCard } from '../../components/projects/ProjectCard.tsx';
import { 
  HardHat, 
  Clock, 
  UploadCloud, 
  Calendar,
  Building2,
  RotateCcw,
  Lock
} from 'lucide-react';

export const ContractorDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { getUserProjects, resetToCleanNashikEnvironment } = useProjects();
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleCleanReset = () => {
    resetToCleanNashikEnvironment();
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 2000);
  };

  // Strictly filter projects assigned to or created by this contractor account
  const displayProjects = getUserProjects(profile);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Contractor Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl glass-panel border border-amber-500/20 bg-gradient-to-r from-amber-950/40 via-slate-900/60 to-slate-950">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <HardHat className="w-3.5 h-3.5" />
              Contractor Operations Portal
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Assigned Construction Projects & Deliverables
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            View assigned milestone scopes, track inspection dates, and prepare site photograph and delivery challan submissions for audit.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleCleanReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all shadow-sm"
            title="Reset database to fresh Nashik Elevated Viaduct project"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-amber-400 ${resetSuccess ? 'animate-spin' : ''}`} />
            {resetSuccess ? 'Reset Complete!' : 'Clean Nashik Reset'}
          </button>
          <div className="bg-slate-900/90 px-4 py-2.5 rounded-xl border border-slate-800 text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Assigned Org</div>
            <div className="text-xs font-bold text-amber-400 flex items-center gap-1 justify-end mt-0.5">
              <Building2 className="w-3.5 h-3.5" />
              {profile?.organization || 'BuildCorp Infrastructure Ltd'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Notification Banner */}
      <div className="p-4 rounded-xl glass-card border border-blue-500/30 bg-blue-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">
              Milestone 2 Evidence Intake (Elevated Pier Shaft) Ready
            </h4>
            <p className="text-[11px] text-slate-400">
              Phase 2 enables photo capture and invoice/challan OCR upload pipelines for this active milestone.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/30 text-blue-300 border border-blue-500/40 shrink-0 self-start sm:self-auto">
          <Clock className="w-3.5 h-3.5" /> Phase 2 Active
        </span>
      </div>

      {/* Assigned Projects Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            Your Assigned Construction Contracts ({displayProjects.length})
          </h2>
          <span className="text-xs text-slate-400">
            Select a project to review milestone requirements
          </span>
        </div>

        {displayProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayProjects.map((project) => (
              <ProjectCard key={project.id} project={project} isContractor={true} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center glass-panel rounded-2xl border border-slate-800 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center mx-auto text-amber-400">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-200">No projects assigned to your account</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              All infrastructure contracts are strictly confidential and anonymous. Projects assigned to other contractors or managed by other authorities are inaccessible to your account.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
