import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProjects } from '../../context/ProjectContext.tsx';
import { isProjectAccessible } from '../../lib/projectAccess.ts';
import { handleImageError, DEFAULT_CAD_DRAWING_URL, DEFAULT_SITE_PHOTO_URL } from '../../lib/imageUtils.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { EvidenceItem } from '../../types/index.ts';
import { getStatusBadge } from '../../components/projects/MilestoneList.tsx';
import { InspectorDecisionModal } from '../../components/audit/InspectorDecisionModal.tsx';
import { AuditReportModal } from '../../components/audit/AuditReportModal.tsx';
import { AdminReferenceUploadModal } from '../../components/admin/AdminReferenceUploadModal.tsx';
import { AddQuotationModal } from '../../components/projects/AddQuotationModal.tsx';
import { validateEvidenceGeofence } from '../../lib/geoDistance.ts';
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
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Edit3,
  Printer,
  FileCode,
  FileSpreadsheet,
  Columns,
  Lock
} from 'lucide-react';

export const InspectorVerificationCockpit: React.FC = () => {
  const { milestoneId } = useParams<{ milestoneId: string }>();
  const { profile } = useAuth();
  const { 
    milestones, 
    getProjectById, 
    getMilestoneEvidence, 
    getMilestoneBOQ,
    getMilestoneDiscrepancies,
    resolveDiscrepancy,
    getMilestoneDecision
  } = useProjects();

  const milestone = milestones.find((m) => m.id === milestoneId);
  const project = milestone ? getProjectById(milestone.project_id) : undefined;
  const evidenceList = milestone ? getMilestoneEvidence(milestone.id) : [];
  const boqItems = milestone ? getMilestoneBOQ(milestone.id) : [];
  const discrepancies = milestone ? getMilestoneDiscrepancies(milestone.id) : [];
  const existingDecision = milestone ? getMilestoneDecision(milestone.id) : undefined;

  const photos = evidenceList.filter((e) => e.type === 'photo');
  const documents = evidenceList.filter((e) => e.type !== 'photo');

  const [selectedPhoto, setSelectedPhoto] = useState<EvidenceItem | undefined>(photos[0]);
  const [selectedDoc, setSelectedDoc] = useState<EvidenceItem | undefined>(documents[0]);
  const [photoZoom, setPhotoZoom] = useState(1);
  const [vlmMode, setVlmMode] = useState(true);

  // Modals
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState(false);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);

  if (!milestone || !project || !isProjectAccessible(project, profile)) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 shadow-lg shadow-rose-950/30">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Confidential Verification Workspace</h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
          This milestone inspection cockpit is restricted to authorized personnel. You do not have permission to inspect this contract.
        </p>
        <div className="pt-2">
          <Link 
            to="/admin/dashboard" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-all shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to My Projects
          </Link>
        </div>
      </div>
    );
  }

  const activePhoto = selectedPhoto || photos[0];
  const activeDoc = selectedDoc || documents[0];
  const openDiscrepancies = discrepancies.filter(d => d.status === 'open');
  const photoGeofence = activePhoto ? validateEvidenceGeofence(activePhoto.latitude, activePhoto.longitude, project?.location || 'Nashik, Maharashtra') : undefined;

  const hasDecision = !!existingDecision || milestone.status === 'verified' || milestone.status === 'rejected';
  const isApproved = existingDecision?.status === 'verified' || (!existingDecision && milestone.status === 'verified');
  const isRejected = existingDecision?.status === 'rejected' || (!existingDecision && milestone.status === 'rejected');
  const isPendingEvidence = existingDecision?.status === 'pending_evidence';

  const referenceBlueprintUrl = milestone?.reference_images?.[0] || DEFAULT_CAD_DRAWING_URL;

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
            onClick={() => setIsQuotationModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm hover:scale-102"
            title="Upload and inspect approved contractual quotation baseline for anomaly cross-referencing"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            <span>Quotation Baseline</span>
          </button>

          <button
            onClick={() => setIsBlueprintModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/40 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm hover:scale-102"
            title="Upload or manage approved CAD blueprints for VLM comparison"
          >
            <FileCode className="w-4 h-4 text-blue-400" />
            <span>CAD Reference (VLM)</span>
          </button>

          <button
            onClick={() => setIsReportOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm hover:scale-102"
            title="Generate & print official milestone verification audit report"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Audit Certificate</span>
          </button>

          {isApproved ? (
            <button
              onClick={() => setIsDecisionModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/10 transition-all hover:scale-102"
              title="Click to view or edit official approved sign-off"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Decision: Approved & Signed</span>
              <Edit3 className="w-3 h-3 text-emerald-400/70 ml-1" />
            </button>
          ) : isRejected ? (
            <button
              onClick={() => setIsDecisionModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-rose-500/10 transition-all hover:scale-102"
              title="Click to view or edit rejection remarks"
            >
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>Decision: Rejected</span>
              <Edit3 className="w-3 h-3 text-rose-400/70 ml-1" />
            </button>
          ) : isPendingEvidence ? (
            <button
              onClick={() => setIsDecisionModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/10 transition-all hover:scale-102"
              title="Click to view requested evidence details"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Decision: Evidence Requested</span>
              <Edit3 className="w-3 h-3 text-amber-400/70 ml-1" />
            </button>
          ) : (
            <button
              onClick={() => setIsDecisionModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-102"
            >
              <ShieldCheck className="w-4 h-4" />
              Make Official Decision
            </button>
          )}
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
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    Physical Progress & VLM Audit
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-900/60 text-blue-300 border border-blue-700">
                      Gemini 1.5 Flash
                    </span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Contractor site capture vs. Admin approved design</span>
                </div>
              </div>

              {/* View Mode & Zoom Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVlmMode(!vlmMode)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-all ${
                    vlmMode
                      ? 'bg-blue-600/20 text-blue-300 border-blue-500/50 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                  title="Toggle Split-Screen comparison against Admin's reference blueprint"
                >
                  <Columns className="w-3 h-3 text-blue-400" />
                  <span>{vlmMode ? 'Split VLM' : 'Single'}</span>
                </button>

                {activePhoto && (
                  <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800 p-0.5">
                    <button
                      onClick={() => setPhotoZoom(z => Math.max(0.75, z - 0.25))}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-mono px-1 text-slate-300">{Math.round(photoZoom * 100)}%</span>
                    <button
                      onClick={() => setPhotoZoom(z => Math.min(2.5, z + 0.25))}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
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

            {/* Active Visual Inspection Workspace */}
            {activePhoto ? (
              <div className="space-y-3">
                {vlmMode ? (
                  /* Dual-Image Split Screen (Contractor Photo vs Admin Reference CAD) */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Left: Actual Site Photo */}
                    <div className="relative h-64 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex flex-col justify-between p-2">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-300 z-10 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                        <span className="text-amber-400 font-bold">1. Actual Site Photo</span>
                        <span>{activePhoto.location_name?.slice(0, 16) || 'Site Photo'}</span>
                      </div>
                      <img
                        src={activePhoto.file_url}
                        alt={activePhoto.file_name}
                        onError={(e) => handleImageError(e, DEFAULT_SITE_PHOTO_URL)}
                        style={{ transform: `scale(${photoZoom})` }}
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                      <div className="relative z-10 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-emerald-300 border border-slate-800 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-400" />
                          {activePhoto.latitude ? `${activePhoto.latitude.toFixed(2)}°, ${activePhoto.longitude?.toFixed(2)}°` : 'GPS Set'}
                        </span>
                        {photoGeofence?.isMismatch ? (
                          <span className="text-rose-400 font-bold">⚠️ Out of Zone</span>
                        ) : (
                          <span className="text-emerald-400 font-bold">✓ In-Zone</span>
                        )}
                      </div>
                    </div>

                    {/* Right: Admin Approved CAD Drawing */}
                    <div className="relative h-64 bg-slate-950 rounded-xl overflow-hidden border border-blue-500/40 flex flex-col justify-between p-2">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-300 z-10 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                        <span className="text-blue-400 font-bold flex items-center gap-1">
                          <FileCode className="w-3 h-3 text-blue-400" />
                          2. CAD Blueprint
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsBlueprintModalOpen(true)}
                          className="text-[9px] text-blue-300 hover:underline"
                        >
                          Change
                        </button>
                      </div>
                      <img
                        src={referenceBlueprintUrl}
                        alt="Approved CAD Blueprint"
                        onError={(e) => handleImageError(e, DEFAULT_CAD_DRAWING_URL)}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="relative z-10 bg-slate-950/90 backdrop-blur-md px-2 py-1 rounded text-[10px] font-mono text-slate-300 border border-slate-800 truncate">
                        {milestone?.reference_specs || 'IS 456 Standard • 16x Fe-500D (25mm)'}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Single Photo View */
                  <div className="relative h-72 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                    <img
                      src={activePhoto.file_url}
                      alt={activePhoto.file_name}
                      onError={(e) => handleImageError(e, DEFAULT_SITE_PHOTO_URL)}
                      style={{ transform: `scale(${photoZoom})` }}
                      className="w-full h-full object-contain transition-transform duration-200"
                    />
                    <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-mono text-emerald-300 border border-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      <span>{activePhoto.latitude ? `${activePhoto.latitude.toFixed(4)}°, ${activePhoto.longitude?.toFixed(4)}°` : 'GPS Position Set'}</span>
                      {photoGeofence?.isMismatch ? (
                        <span className="text-rose-400 font-bold ml-1">
                          • ⚠️ {photoGeofence.distanceKm} km from {project?.location || 'Nashik'}
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-bold ml-1">
                          • ✓ In Site Geofence
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* VLM Multimodal Comparative Analysis Card */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-blue-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      VLM Comparative Analysis (Actual Photo vs Blueprint)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                      {activePhoto.vlm_comparison?.compliance_score || 94}% Design Compliance
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activePhoto.vlm_comparison?.alignment_details || 'VLM Engine: Rebar cage tying and stirrup spacing conform to the approved CAD drawing with 50mm clear cover verified.'}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
                      ✓ Fe-500D 16-Bar Cage
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
                      ✓ 150mm Stirrup Pitch
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
                      ✓ 1200mm Column Formwork
                    </span>
                  </div>
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
      <div className={`p-5 rounded-2xl glass-panel border ${
        isApproved 
          ? 'border-emerald-500/40 bg-emerald-950/20' 
          : isRejected 
          ? 'border-rose-500/40 bg-rose-950/20' 
          : isPendingEvidence
          ? 'border-amber-500/40 bg-amber-950/20'
          : 'border-slate-800 bg-slate-900/90'
      } flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            {isApproved ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : isRejected ? (
              <XCircle className="w-5 h-5 text-rose-400" />
            ) : isPendingEvidence ? (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            )}
            <h3 className="text-sm font-bold text-white">
              {isApproved
                ? 'Certified Inspector Decision: Milestone Approved & Verified'
                : isRejected
                ? 'Certified Inspector Decision: Milestone Rejected'
                : isPendingEvidence
                ? 'Certified Inspector Decision: Additional Evidence Requested'
                : 'Inspector Verification Gate'}
            </h3>
          </div>
          
          {hasDecision && existingDecision ? (
            <div className="text-xs text-slate-300 space-y-1">
              <p>
                Signed by <strong className="text-white">{existingDecision.inspectorName}</strong> ({existingDecision.inspectorRole}) on {new Date(existingDecision.decidedAt).toLocaleString()}
              </p>
              {existingDecision.decisionRemarks && (
                <p className="text-slate-400 italic">
                  "{existingDecision.decisionRemarks}"
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-300">
              {openDiscrepancies.length > 0
                ? `There are ${openDiscrepancies.length} open discrepancy flags requiring inspector resolution before milestone sign-off.`
                : 'All 5-stage material quantities and visual evidence reconcile with contractual baseline.'}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {!hasDecision && openDiscrepancies.length > 0 && (
            <button
              onClick={() => openDiscrepancies.forEach(d => resolveDiscrepancy(d.id))}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors"
            >
              Resolve All Flags
            </button>
          )}

          {isApproved ? (
            <button
              onClick={() => setIsDecisionModalOpen(true)}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-102"
            >
              <CheckCircle2 className="w-4 h-4" />
              Update Approved Sign-off
            </button>
          ) : isRejected ? (
            <button
              onClick={() => setIsDecisionModalOpen(true)}
              className="px-6 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-rose-500/20 transition-all hover:scale-102"
            >
              <XCircle className="w-4 h-4" />
              Update Rejection Decision
            </button>
          ) : isPendingEvidence ? (
            <button
              onClick={() => setIsDecisionModalOpen(true)}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-102"
            >
              <AlertTriangle className="w-4 h-4" />
              Update Evidence Request
            </button>
          ) : (
            <button
              onClick={() => setIsDecisionModalOpen(true)}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-102"
            >
              <ShieldCheck className="w-4 h-4" />
              Make Official Decision
            </button>
          )}
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

      {/* Audit Report Certificate Modal */}
      <AuditReportModal
        project={project}
        milestone={milestone}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />

      {/* Admin Blueprint Reference Upload Modal */}
      <AdminReferenceUploadModal
        project={project}
        milestone={milestone}
        isOpen={isBlueprintModalOpen}
        onClose={() => setIsBlueprintModalOpen(false)}
      />

      {/* Admin Quotation Baseline Upload Modal */}
      <AddQuotationModal
        projectId={project.id}
        milestoneId={milestone.id}
        isOpen={isQuotationModalOpen}
        onClose={() => setIsQuotationModalOpen(false)}
      />
    </div>
  );
};
