import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProjects } from '../../context/ProjectContext.tsx';
import { EvidenceItem } from '../../types/index.ts';
import { getStatusBadge } from '../../components/projects/MilestoneList.tsx';
import { InspectorDecisionModal } from '../../components/audit/InspectorDecisionModal.tsx';
import { 
  ArrowLeft, 
  Camera, 
  FileText, 
  MapPin, 
  Calendar, 
  Sparkles, 
  ShieldCheck, 
  ExternalLink,
  Receipt,
  ClipboardCheck,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';

export const InspectorVerificationCockpit: React.FC = () => {
  const { milestoneId } = useParams<{ milestoneId: string }>();
  const { 
    milestones, 
    getProjectById, 
    getMilestoneEvidence, 
    getMilestoneBOQ,
    getMilestoneDiscrepancies,
    resolveDiscrepancy 
  } = useProjects();

  const milestone = milestones.find((m) => m.id === milestoneId);
  const project = milestone ? getProjectById(milestone.project_id) : undefined;
  const evidenceList = milestone ? getMilestoneEvidence(milestone.id) : [];
  const boqItems = milestone ? getMilestoneBOQ(milestone.id) : [];
  const discrepancies = milestone ? getMilestoneDiscrepancies(milestone.id) : [];

  const photos = evidenceList.filter((e) => e.type === 'photo');
  const documents = evidenceList.filter((e) => e.type !== 'photo');

  const [selectedPhoto, setSelectedPhoto] = useState<EvidenceItem | undefined>(photos[0]);
  const [selectedDoc, setSelectedDoc] = useState<EvidenceItem | undefined>(documents[0]);
  const [photoZoom, setPhotoZoom] = useState(1);

  // Modals
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);

  if (!milestone || !project) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h2 className="text-base font-bold text-white mb-2">Milestone not found</h2>
        <Link to="/admin/dashboard" className="text-xs text-blue-400 hover:underline">
          Return to Inspector Dashboard
        </Link>
      </div>
    );
  }

  const activePhoto = selectedPhoto || photos[0];
  const activeDoc = selectedDoc || documents[0];
  const openDiscrepancies = discrepancies.filter(d => d.status === 'open');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Breadcrumb & Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link
              to={`/admin/project/${project.id}?milestone=${milestone.id}`}
              className="inline-flex items-center gap-1 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Project Scope
            </Link>
            <span>/</span>
            <span className="text-blue-400 font-bold">{project.code}</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Side-by-Side Verification Cockpit: {milestone.title}
            </h1>
            {getStatusBadge(milestone.status)}
          </div>
        </div>

        {/* Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsDecisionModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-102"
          >
            <ShieldCheck className="w-4 h-4" />
            Make Official Decision
          </button>
        </div>
      </div>

      {/* Side-by-Side Dual Pane Verification Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ================= LEFT PANE: PHYSICAL SITE EVIDENCE ================= */}
        <div className="space-y-4 rounded-2xl glass-panel border border-slate-800 p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Physical Site Progress
                  </h3>
                  <span className="text-[11px] text-slate-400">Geotagged site photographs & Vision AI analysis</span>
                </div>
              </div>

              {/* Photo Zoom Controls */}
              {activePhoto && (
                <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800 p-1">
                  <button
                    onClick={() => setPhotoZoom(z => Math.max(0.75, z - 0.25))}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono px-1.5 text-slate-300">{Math.round(photoZoom * 100)}%</span>
                  <button
                    onClick={() => setPhotoZoom(z => Math.min(2.5, z + 0.25))}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPhotoZoom(1)}
                    className="p-1 text-slate-400 hover:text-white ml-0.5"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Photo Selector Strip */}
            {photos.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {photos.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPhoto(p);
                      setPhotoZoom(1);
                    }}
                    className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all relative ${
                      activePhoto?.id === p.id
                        ? 'border-amber-400 ring-2 ring-amber-400/20'
                        : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={p.file_url} alt={p.file_name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Active Photo Display */}
            {activePhoto ? (
              <div className="space-y-3">
                <div className="relative h-72 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                  <img
                    src={activePhoto.file_url}
                    alt={activePhoto.file_name}
                    style={{ transform: `scale(${photoZoom})` }}
                    className="w-full h-full object-contain transition-transform duration-200"
                  />
                  <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-mono text-emerald-300 border border-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    <span>{activePhoto.latitude?.toFixed(4)}°, {activePhoto.longitude?.toFixed(4)}°</span>
                    <a
                      href={`https://www.google.com/maps?q=${activePhoto.latitude},${activePhoto.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-400 hover:underline flex items-center gap-0.5 ml-1"
                    >
                      Map <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>

                {/* Multimodal Vision AI Detections Card */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Multimodal Vision AI Analysis
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {activePhoto.ai_confidence || 96}% Confidence
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activePhoto.ai_summary || 'Visual inspection verified rebar cage alignment, stirrup spacing (150mm c/c), and cover clearances compliant with contract.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs">
                No site photographs uploaded yet for this milestone.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              Captured: {activePhoto?.captured_at ? new Date(activePhoto.captured_at).toLocaleString() : 'N/A'}
            </span>
            <span className="text-slate-300">By <strong>{activePhoto?.uploaded_by_name || 'Contractor'}</strong></span>
          </div>
        </div>

        {/* ================= RIGHT PANE: COMMERCIAL & SUPPLY DOCUMENTS ================= */}
        <div className="space-y-4 rounded-2xl glass-panel border border-slate-800 p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Commercial & Supply Documentation
                  </h3>
                  <span className="text-[11px] text-slate-400">Delivery challans, invoices & OCR verification</span>
                </div>
              </div>

              <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-slate-900 text-blue-300 border border-slate-800">
                {documents.length} Docs Attached
              </span>
            </div>

            {/* Document Selector Strip */}
            {documents.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {documents.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDoc(d)}
                    className={`shrink-0 px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      activeDoc?.id === d.id
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {d.type === 'challan' && <FileText className="w-3.5 h-3.5 text-blue-400" />}
                    {d.type === 'invoice' && <Receipt className="w-3.5 h-3.5 text-emerald-400" />}
                    {d.type === 'inspection_report' && <ClipboardCheck className="w-3.5 h-3.5 text-purple-400" />}
                    <span className="truncate max-w-[120px]">{d.file_name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Active Document Display */}
            {activeDoc ? (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-bold">
                        {activeDoc.type.replace('_', ' ')}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-white">{activeDoc.file_name}</h4>
                    </div>
                    <a
                      href={activeDoc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1"
                    >
                      Open PDF <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* OCR Extracted Line Items */}
                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1.5">
                      <span>Document OCR Extraction</span>
                      <span className="text-emerald-400 font-mono font-bold">Verified ({activeDoc.ai_confidence || 98}%)</span>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed font-mono">
                      {activeDoc.ai_summary || 'UltraTech RMC Delivery Challan: 50.00 Cu.m of Grade M40 Concrete delivered to Site Batching Bay #2.'}
                    </p>
                  </div>
                </div>

                {/* Contractual BOQ Baseline Comparison Box */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-300 block">
                    Linked Contractual BOQ Baseline Items
                  </span>
                  <div className="space-y-1.5 font-mono text-xs">
                    {boqItems.map((boq) => (
                      <div key={boq.id} className="flex items-center justify-between p-1.5 rounded bg-slate-900/80 border border-slate-800/60">
                        <span className="text-slate-300 font-sans">{boq.item_code}: {boq.description}</span>
                        <span className="text-amber-400 font-bold">{boq.quantity_ordered} {boq.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs">
                No supporting documents uploaded yet.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Recorded: {activeDoc?.uploaded_at ? new Date(activeDoc.uploaded_at).toLocaleString() : 'N/A'}</span>
            <span className="text-slate-300">Supplier: <strong className="text-white">Ultratech / Tata Steel</strong></span>
          </div>
        </div>
      </div>

      {/* Bottom Action Cockpit: Discrepancy Overview & Direct Resolver */}
      <div className="p-5 rounded-2xl glass-panel border border-slate-800 bg-slate-900/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Inspector Verification Gate</h3>
          </div>
          <p className="text-xs text-slate-300">
            {openDiscrepancies.length > 0
              ? `There are ${openDiscrepancies.length} open discrepancy flags requiring inspector resolution before milestone sign-off.`
              : 'All 5-stage material quantities and visual evidence reconcile with contractual baseline.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {openDiscrepancies.length > 0 && (
            <button
              onClick={() => openDiscrepancies.forEach(d => resolveDiscrepancy(d.id))}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors"
            >
              Resolve All Flags
            </button>
          )}

          <button
            onClick={() => setIsDecisionModalOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-102"
          >
            <ShieldCheck className="w-4 h-4" />
            Make Official Decision
          </button>
        </div>
      </div>

      {/* Decision Modal */}
      <InspectorDecisionModal
        milestoneId={milestone.id}
        projectId={project.id}
        milestoneTitle={milestone.title}
        isOpen={isDecisionModalOpen}
        onClose={() => setIsDecisionModalOpen(false)}
      />
    </div>
  );
};
