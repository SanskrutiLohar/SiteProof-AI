import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProjects } from '../../context/ProjectContext.tsx';
import { BOQTable } from '../../components/projects/BOQTable.tsx';
import { getStatusBadge } from '../../components/projects/MilestoneList.tsx';
import { 
  ArrowLeft, 
  HardHat, 
  Calendar, 
  UploadCloud, 
  Layers, 
  FileText,
  Camera
} from 'lucide-react';

export const ContractorMilestonePage: React.FC = () => {
  const { milestoneId } = useParams<{ milestoneId: string }>();
  const { milestones, getMilestoneBOQ, getProjectById } = useProjects();

  const milestone = milestones.find((m) => m.id === milestoneId);
  const project = milestone ? getProjectById(milestone.project_id) : undefined;
  const boqItems = milestone ? getMilestoneBOQ(milestone.id) : [];

  if (!milestone || !project) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h2 className="text-base font-bold text-white mb-2">Milestone not found</h2>
        <Link to="/contractor/dashboard" className="text-xs text-amber-400 hover:underline">
          Return to Contractor Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/contractor/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Assigned Projects
        </Link>
      </div>

      {/* Milestone Overview Header */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                {project.code}
              </span>
              <span className="text-xs text-slate-400">{project.title}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {milestone.title}
            </h1>
          </div>

          <div className="shrink-0">
            {getStatusBadge(milestone.status)}
          </div>
        </div>

        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          {milestone.description}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>Target Deadline: <strong className="text-slate-200">{milestone.target_date}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <HardHat className="w-4 h-4 text-amber-500" />
            <span>Weight: <strong className="text-slate-200">{milestone.weight_percentage}% of Contract</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>BOQ Baseline Items: <strong className="text-slate-200">{boqItems.length} Items</strong></span>
          </div>
        </div>
      </div>

      {/* Evidence Submission Callout for Phase 2 */}
      <div className="p-6 rounded-2xl glass-panel border border-amber-500/30 bg-amber-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Evidence Upload Pipeline</h3>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            In Phase 2, you will capture geotagged site photographs, upload supplier delivery challans, and attach invoices for automated AI OCR matching.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            disabled
            className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-400 cursor-not-allowed flex items-center gap-1.5"
          >
            <Camera className="w-3.5 h-3.5" />
            Upload Site Photo (Phase 2)
          </button>
          <button
            disabled
            className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-400 cursor-not-allowed flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            Upload Challan/Invoice (Phase 2)
          </button>
        </div>
      </div>

      {/* Bill of Quantities Baseline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            Contractual Bill of Quantities (BOQ) Requirements
          </h2>
          <span className="text-xs text-slate-400">
            Target material quantities required for milestone approval
          </span>
        </div>

        <BOQTable items={boqItems} showReconciliation={true} />
      </div>
    </div>
  );
};
