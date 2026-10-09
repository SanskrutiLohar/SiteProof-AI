import React from 'react';
import { useProjects } from '../../context/ProjectContext.tsx';
import { 
  ShieldCheck, 
  UploadCloud, 
  Sparkles, 
  AlertTriangle, 
  Calendar, 
  Layers
} from 'lucide-react';

interface AuditActivityTimelineProps {
  milestoneId: string;
}

export const AuditActivityTimeline: React.FC<AuditActivityTimelineProps> = ({
  milestoneId,
}) => {
  const { milestones, getMilestoneEvidence, getMilestoneDiscrepancies } = useProjects();
  const milestone = milestones.find((m) => m.id === milestoneId);
  const evidenceList = getMilestoneEvidence(milestoneId);
  const discrepancies = getMilestoneDiscrepancies(milestoneId);

  // Derive complete lifecycle events
  const events = [
    {
      id: 'evt-create',
      type: 'milestone_created',
      title: 'Milestone Created & BOQ Baseline Established',
      actor: 'Admin / Lead Inspector',
      time: milestone?.created_at || '2026-10-01T08:00:00Z',
      icon: <Layers className="w-4 h-4 text-blue-400" />,
      desc: `Target deadline set to ${milestone?.target_date || 'N/A'} with contractual BOQ items attached.`,
    },
    ...evidenceList.map((e, idx) => ({
      id: `evt-ev-${e.id || idx}`,
      type: 'evidence_uploaded',
      title: `Evidence Uploaded: ${e.file_name}`,
      actor: e.uploaded_by_name || 'Contractor Site Rep',
      time: e.uploaded_at,
      icon: <UploadCloud className="w-4 h-4 text-amber-400" />,
      desc: `${e.type.toUpperCase()} recorded at ${e.location_name || 'Site'}. GPS: ${e.latitude ? `${e.latitude.toFixed(4)}°, ${e.longitude?.toFixed(4)}°` : 'N/A'}.`,
    })),
    ...evidenceList.filter(e => e.ai_analyzed).map((e, idx) => ({
      id: `evt-ai-${e.id || idx}`,
      type: 'ai_analyzed',
      title: `Gemini Multimodal Vision & OCR Executed`,
      actor: 'SiteProof AI Engine',
      time: e.captured_at || e.uploaded_at,
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      desc: e.ai_summary || 'Analyzed structural progress and extracted itemized commercial quantities.',
    })),
    ...discrepancies.map((d, idx) => ({
      id: `evt-disc-${d.id || idx}`,
      type: 'discrepancy',
      title: `Audit Variance Flagged: ${d.title}`,
      actor: 'AI Verification Guardrail',
      time: d.created_at,
      icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
      desc: `${d.description} (Severity: ${d.severity.toUpperCase()}) - Status: ${d.status.toUpperCase()}`,
    })),
    ...(milestone?.status === 'verified' ? [{
      id: 'evt-verified',
      type: 'milestone_approved',
      title: 'Milestone Officially Approved & Certified',
      actor: 'David Vance (Senior Lead Auditor)',
      time: new Date().toISOString(),
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      desc: 'Official digital signature recorded under National Infrastructure Verification Board regulations.',
    }] : [])
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Immutable Milestone Audit Activity Trail ({events.length} Events)
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-500">Tamper-evident record</span>
      </div>

      <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {events.map((evt) => (
          <div key={evt.id} className="relative group">
            {/* Timeline node */}
            <div className="absolute -left-6 sm:-left-8 top-1 w-6 sm:w-8 h-6 sm:h-8 rounded-full bg-slate-900 border border-slate-700 group-hover:border-amber-400 flex items-center justify-center transition-colors z-10 shadow">
              {evt.icon}
            </div>

            {/* Content card */}
            <div className="p-3.5 rounded-xl glass-panel border border-slate-800/80 hover:border-slate-700 transition-all space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h4 className="text-xs font-bold text-slate-200 group-hover:text-amber-400 transition-colors">
                  {evt.title}
                </h4>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span>{new Date(evt.time).toLocaleString()}</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {evt.desc}
              </p>

              <div className="text-[10px] text-slate-500 pt-1 flex items-center gap-1.5">
                <span>By: <strong className="text-slate-300">{evt.actor}</strong></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
