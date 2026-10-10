import React from 'react';
import { Milestone, MilestoneStatus } from '../../types/index.ts';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ChevronRight, 
  Calendar, 
  Layers,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface MilestoneListProps {
  milestones: Milestone[];
  projectId: string;
  isContractor?: boolean;
}

export const getStatusBadge = (status: MilestoneStatus) => {
  switch (status) {
    case 'verified':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Verified / Approved
        </span>
      );
    case 'submitted':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 animate-pulse">
          <Clock className="w-3.5 h-3.5" />
          Evidence Submitted
        </span>
      );
    case 'in_progress':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <Clock className="w-3.5 h-3.5" />
          In Progress
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <AlertTriangle className="w-3.5 h-3.5" />
          Action Required
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
          <Clock className="w-3.5 h-3.5" />
          Pending
        </span>
      );
  }
};

export const MilestoneList: React.FC<MilestoneListProps> = ({
  milestones,
  projectId,
  isContractor = false,
}) => {
  if (milestones.length === 0) {
    return (
      <div className="p-8 text-center glass-panel rounded-xl border border-slate-800">
        <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-xs text-slate-400">No milestone stages configured for this project yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {milestones.map((m, idx) => {
        const linkUrl = isContractor
          ? `/contractor/milestone/${m.id}`
          : `/admin/project/${projectId}?milestone=${m.id}`;

        return (
          <div
            key={m.id}
            className="p-4 rounded-xl glass-card hover:bg-slate-800/80 border border-slate-800/90 hover:border-slate-700 transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <Link to={linkUrl} className="flex items-start gap-3 flex-1">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300 border border-slate-700 shrink-0 mt-0.5">
                #{idx + 1}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                  {m.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 max-w-xl">
                  {m.description}
                </p>
                <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    Target: <strong className="text-slate-300">{m.target_date}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    Weight: <strong className="text-slate-300">{m.weight_percentage}%</strong>
                  </span>
                </div>
              </div>
            </Link>

            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
              {getStatusBadge(m.status)}

              {!isContractor ? (
                <div className="flex items-center gap-1.5">
                  <Link
                    to={`/admin/project/${projectId}?milestone=${m.id}&tab=boq`}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all flex items-center gap-1"
                    title="Inspect or upload quotation baseline"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                    Quotation
                  </Link>

                  <Link
                    to={`/admin/verify/${m.id}`}
                    className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/40 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                    Verify Cockpit
                  </Link>
                </div>
              ) : (
                <Link to={linkUrl} className="p-1 text-slate-500 hover:text-white">
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
