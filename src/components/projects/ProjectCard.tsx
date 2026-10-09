import React from 'react';
import { Project } from '../../types/index.ts';
import { useProjects } from '../../context/ProjectContext.tsx';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  HardHat, 
  ArrowRight,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProjectCardProps {
  project: Project;
  isContractor?: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, isContractor = false }) => {
  const { getProjectMilestones } = useProjects();
  const milestones = getProjectMilestones(project.id);

  const verifiedCount = milestones.filter(m => m.status === 'verified').length;
  const totalCount = milestones.length;
  const progressPercent = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;

  const targetLink = isContractor 
    ? `/contractor/project/${project.id}`
    : `/admin/project/${project.id}`;

  return (
    <div className="rounded-2xl glass-panel border border-slate-800/90 hover:border-slate-700/90 p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl group">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-blue-400 group-hover:scale-105 group-hover:bg-blue-500/10 transition-all">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {project.code}
              </span>
              <h3 className="text-sm font-bold text-white mt-1 group-hover:text-blue-400 transition-colors line-clamp-1">
                {project.title}
              </h3>
            </div>
          </div>
        </div>

        {/* Location & Client */}
        <div className="space-y-1.5 mb-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{project.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <HardHat className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">
              Contractor: <strong className="text-slate-200 font-medium">{project.assigned_contractor_name || 'Assigned'}</strong>
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 font-medium">Milestone Progress</span>
            <span className="font-bold text-slate-200">{progressPercent}% Verified</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              {verifiedCount} of {totalCount} completed
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              {totalCount - verifiedCount} remaining
            </span>
          </div>
        </div>
      </div>

      {/* Footer info & CTA */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-xs font-semibold text-slate-200">
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          ${project.total_budget.toLocaleString()}
        </div>

        <Link
          to={targetLink}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 transition-all group-hover:shadow-glow-brand"
        >
          {isContractor ? 'Submit Evidence' : 'Audit Cockpit'}
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
