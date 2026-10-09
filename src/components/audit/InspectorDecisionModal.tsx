import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useProjects } from '../../context/ProjectContext.tsx';
import { MilestoneDecision } from '../../types/audit.ts';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  HelpCircle, 
  ShieldCheck, 
  FileSignature, 
  ListChecks,
  AlertCircle
} from 'lucide-react';

interface InspectorDecisionModalProps {
  milestoneId: string;
  projectId?: string;
  milestoneTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const InspectorDecisionModal: React.FC<InspectorDecisionModalProps> = ({
  milestoneId,
  milestoneTitle,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { profile } = useAuth();
  const { 
    updateMilestoneStatus, 
    getMilestoneDiscrepancies,
    resolveDiscrepancy 
  } = useProjects();

  const [decisionType, setDecisionType] = useState<'approve' | 'reject' | 'request_evidence'>('approve');
  const [remarks, setRemarks] = useState('');
  const [digitalSignature, setDigitalSignature] = useState(profile?.full_name || '');
  const [overrideCritical, setOverrideCritical] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-flight checklist
  const [checks, setChecks] = useState<{ [key: string]: boolean }>({
    visual: true,
    challans: true,
    invoices: true,
    quality: true,
  });

  const discrepancies = getMilestoneDiscrepancies(milestoneId);
  const openCriticalFlags = discrepancies.filter(d => d.status === 'open' && d.severity === 'critical');
  const openHighFlags = discrepancies.filter(d => d.status === 'open' && d.severity === 'high');

  if (!isOpen) return null;

  const handleCheckToggle = (key: string) => {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!digitalSignature.trim()) {
      setErrorMsg('Digital verification signature is required.');
      return;
    }

    if (decisionType === 'approve') {
      const allChecked = Object.values(checks).every(Boolean);
      if (!allChecked) {
        setErrorMsg('Please complete and verify all pre-flight inspection checklist items.');
        return;
      }

      if (openCriticalFlags.length > 0 && !overrideCritical) {
        setErrorMsg('Unresolved critical discrepancies exist. You must resolve them or explicitly confirm your override rationale.');
        return;
      }
    } else {
      if (!remarks.trim()) {
        setErrorMsg('Please provide detailed remarks / feedback explaining this decision.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const decisionData: MilestoneDecision = {
        milestoneId,
        status: decisionType === 'approve' ? 'verified' : decisionType === 'reject' ? 'rejected' : 'pending_evidence',
        inspectorName: profile?.full_name || 'Senior Lead Auditor',
        inspectorEmail: profile?.email || 'inspector@siteproof.ai',
        inspectorRole: profile?.organization || 'National Infrastructure Board',
        digitalSignature: digitalSignature.trim(),
        decisionRemarks: remarks.trim() || (decisionType === 'approve' ? 'All physical progress, material challans, and commercial invoices verified compliant.' : ''),
        checklistChecked: Object.keys(checks).filter(k => checks[k]),
        overrideCriticalFlags: overrideCritical,
        decidedAt: new Date().toISOString(),
      };

      // If approving with override, auto-resolve critical flags
      if (decisionType === 'approve' && overrideCritical) {
        openCriticalFlags.forEach(f => resolveDiscrepancy(f.id));
      }

      // Update milestone status
      if (decisionType === 'approve') {
        updateMilestoneStatus(milestoneId, 'verified');
      } else if (decisionType === 'reject') {
        updateMilestoneStatus(milestoneId, 'rejected');
      } else {
        // Request evidence: keeps in_progress or resets to in_progress
        updateMilestoneStatus(milestoneId, 'in_progress');
      }

      // Store decision in localStorage
      const savedDecisions = localStorage.getItem('siteproof_decisions');
      const allDecisions: MilestoneDecision[] = savedDecisions ? JSON.parse(savedDecisions) : [];
      allDecisions.push(decisionData);
      localStorage.setItem('siteproof_decisions', JSON.stringify(allDecisions));

      setIsSubmitting(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch {
      setIsSubmitting(false);
      setErrorMsg('Failed to record inspector decision. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl my-8 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Certified Inspector Decision Sign-off</h2>
              <p className="text-xs text-slate-400">
                Official verification decision for <strong className="text-slate-200">{milestoneTitle}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Type Selector */}
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setDecisionType('approve')}
            className={`p-3.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
              decisionType === 'approve'
                ? 'bg-emerald-500/20 border-emerald-500/80 text-emerald-300 shadow-lg shadow-emerald-500/10'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Approve Milestone
          </button>

          <button
            type="button"
            onClick={() => setDecisionType('reject')}
            className={`p-3.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
              decisionType === 'reject'
                ? 'bg-rose-500/20 border-rose-500/80 text-rose-300 shadow-lg shadow-rose-500/10'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <XCircle className="w-5 h-5 text-rose-400" />
            Reject Milestone
          </button>

          <button
            type="button"
            onClick={() => setDecisionType('request_evidence')}
            className={`p-3.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
              decisionType === 'request_evidence'
                ? 'bg-amber-500/20 border-amber-500/80 text-amber-300 shadow-lg shadow-amber-500/10'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-5 h-5 text-amber-400" />
            Request Information
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Critical Discrepancy Guardrail Warning (if approving) */}
          {decisionType === 'approve' && (openCriticalFlags.length > 0 || openHighFlags.length > 0) && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 space-y-3">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Critical / High Discrepancies Detected ({openCriticalFlags.length + openHighFlags.length})</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                The AI verification engine flagged open discrepancies in this submission. To approve this milestone, you must acknowledge these variances and certify that they have been investigated or resolved on site.
              </p>
              <label className="flex items-start gap-2 text-xs text-rose-200 font-medium cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={overrideCritical}
                  onChange={(e) => setOverrideCritical(e.target.checked)}
                  className="mt-0.5 rounded border-rose-500 text-amber-500 focus:ring-amber-400"
                />
                <span>I certify as Lead Inspector that I have physically reviewed these variances and approve this milestone under authorized engineering discretion.</span>
              </label>
            </div>
          )}

          {/* Pre-Flight Inspection Checklist (if approving) */}
          {decisionType === 'approve' && (
            <div className="space-y-2.5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <ListChecks className="w-4 h-4 text-emerald-400" />
                Certified Auditor Pre-Flight Verification Checklist
              </span>

              <div className="space-y-2 text-xs text-slate-300 pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checks.visual}
                    onChange={() => handleCheckToggle('visual')}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-400"
                  />
                  <span>Physical site photographs verified matching structural stage and grid location.</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checks.challans}
                    onChange={() => handleCheckToggle('challans')}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-400"
                  />
                  <span>Supplier delivery challans and weighbridge tickets verified for material receipt.</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checks.invoices}
                    onChange={() => handleCheckToggle('invoices')}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-400"
                  />
                  <span>Commercial tax invoices reconciled against contracted BOQ baseline rates.</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checks.quality}
                    onChange={() => handleCheckToggle('quality')}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-400"
                  />
                  <span>Quality test certificates (tensile strength / slump test) verified compliant.</span>
                </label>
              </div>
            </div>
          )}

          {/* Remarks / Feedback */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              {decisionType === 'approve' ? 'Inspector Verification Notes (Optional)' : 'Auditor Justification & Feedback (Required) *'}
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={
                decisionType === 'approve'
                  ? 'e.g., Physical rebar cage and concrete batching verified compliant with IS 456 specification.'
                  : 'e.g., Short delivery on Fe550D rebar by 5 MT; contractor must provide revised delivery challan.'
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          {/* Digital Signature & Auditor Attribution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <FileSignature className="w-3.5 h-3.5 text-amber-400" />
                Digital Signature Sign-Off <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={digitalSignature}
                onChange={(e) => setDigitalSignature(e.target.value)}
                placeholder="Type your full legal name"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">
                Authorized Regulatory Authority
              </label>
              <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-mono truncate">
                {profile?.organization || 'National Infrastructure Verification Board'}
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all ${
                decisionType === 'approve'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  : decisionType === 'reject'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Recording Decision...
                </>
              ) : (
                <>
                  {decisionType === 'approve' && <CheckCircle2 className="w-4 h-4" />}
                  {decisionType === 'reject' && <XCircle className="w-4 h-4" />}
                  {decisionType === 'request_evidence' && <HelpCircle className="w-4 h-4" />}
                  Confirm & Sign Decision
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
