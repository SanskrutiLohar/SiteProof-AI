import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProjects } from '../../context/ProjectContext.tsx';
import { BOQTable } from '../../components/projects/BOQTable.tsx';
import { getStatusBadge } from '../../components/projects/MilestoneList.tsx';
import { EvidenceGallery } from '../../components/evidence/EvidenceGallery.tsx';
import { AIDiscrepancyPanel } from '../../components/ai/AIDiscrepancyPanel.tsx';
import { AuditReportModal } from '../../components/audit/AuditReportModal.tsx';
import { AuditActivityTimeline } from '../../components/audit/AuditActivityTimeline.tsx';
import { 
  ArrowLeft, 
  HardHat, 
  Calendar, 
  Send, 
  Layers, 
  CheckCircle2, 
  Camera, 
  FileText, 
  Receipt,
  Sparkles,
  Printer,
  History
} from 'lucide-react';

export const ContractorMilestonePage: React.FC = () => {
  const { milestoneId } = useParams<{ milestoneId: string }>();
  const { 
    milestones, 
    getMilestoneBOQ, 
    getProjectById, 
    getMilestoneEvidence,
    updateMilestoneStatus 
  } = useProjects();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);

  const milestone = milestones.find((m) => m.id === milestoneId);
  const project = milestone ? getProjectById(milestone.project_id) : undefined;
  const boqItems = milestone ? getMilestoneBOQ(milestone.id) : [];
  const evidenceList = milestone ? getMilestoneEvidence(milestone.id) : [];

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

  const countPhoto = evidenceList.filter((e) => e.type === 'photo').length;
  const countChallan = evidenceList.filter((e) => e.type === 'challan').length;
  const countInvoice = evidenceList.filter((e) => e.type === 'invoice').length;

  const handleSubmitMilestone = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      updateMilestoneStatus(milestone.id, 'submitted');
      setIsSubmitting(false);
      setSubmissionFeedback('Milestone evidence package submitted successfully for Inspector Audit!');
      setTimeout(() => setSubmissionFeedback(null), 5000);
    }, 600);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button & Action Shortcuts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/contractor/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Assigned Projects
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAuditTrail(!showAuditTrail)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <History className="w-3.5 h-3.5 text-blue-400" />
            {showAuditTrail ? 'Hide Audit Log' : 'View Audit Log'}
          </button>

          <button
            onClick={() => setIsReportOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/20 hover:scale-102"
            title="Generate and print comprehensive audit verification report"
          >
            <Printer className="w-4 h-4" />
            Generate Audit Report
          </button>
        </div>
      </div>

      {/* Submission Success Toast */}
      {submissionFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between shadow-lg shadow-emerald-500/5 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{submissionFeedback}</span>
          </div>
          <span className="text-[10px] font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
            Awaiting Inspector Sign-off
          </span>
        </div>
      )}

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

          <div className="flex items-center gap-3 shrink-0">
            {getStatusBadge(milestone.status)}

            {milestone.status !== 'verified' && milestone.status !== 'submitted' && (
              <button
                onClick={handleSubmitMilestone}
                disabled={isSubmitting || evidenceList.length === 0}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                title={evidenceList.length === 0 ? 'Upload or load demo evidence before submitting' : 'Submit package for verification'}
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          {milestone.description}
        </p>

        {/* Milestone Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>Target: <strong className="text-slate-200">{milestone.target_date}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <HardHat className="w-4 h-4 text-amber-500" />
            <span>Weight: <strong className="text-slate-200">{milestone.weight_percentage}%</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>BOQ Items: <strong className="text-slate-200">{boqItems.length}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Attached Evidence: <strong className="text-slate-200">{evidenceList.length} files</strong></span>
          </div>
        </div>
      </div>

      {/* Audit Activity Trail Drawer (Collapsible) */}
      {showAuditTrail && (
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 animate-fadeIn">
          <AuditActivityTimeline milestoneId={milestone.id} />
        </div>
      )}

      {/* Evidence Summary Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl glass-panel border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400">Geotagged Site Photos</span>
              <h4 className="text-base font-bold text-white">{countPhoto} uploaded</h4>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
            GPS Active
          </span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400">Delivery Challans</span>
              <h4 className="text-base font-bold text-white">{countChallan} logged</h4>
            </div>
          </div>
          <span className="text-[10px] font-mono text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/50">
            Material Slips
          </span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400">Tax Invoices</span>
              <h4 className="text-base font-bold text-white">{countInvoice} attached</h4>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
            GST Validated
          </span>
        </div>
      </div>

      {/* AI Verification & Discrepancy Cockpit */}
      <AIDiscrepancyPanel
        milestoneId={milestone.id}
        isInspector={false}
      />

      {/* Evidence Gallery & Timeline Explorer */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Milestone Evidence Workspace
            </h2>
            <p className="text-xs text-slate-400">
              Contractor photo records, material dispatch tickets, and billing documents for AI & Inspector audit
            </p>
          </div>
        </div>

        <EvidenceGallery
          milestoneId={milestone.id}
          projectId={project.id}
          isContractor={true}
        />
      </div>

      {/* Bill of Quantities Baseline */}
      <div className="space-y-3 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            Contractual Bill of Quantities (BOQ) Baseline
          </h2>
          <span className="text-xs text-slate-400">
            Target material quantities required for milestone sign-off
          </span>
        </div>

        <BOQTable items={boqItems} showReconciliation={true} />
      </div>

      {/* Audit Report Modal */}
      <AuditReportModal
        project={project}
        milestone={milestone}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </div>
  );
};
