import React, { useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useProjects } from '../../context/ProjectContext.tsx';
import { isProjectAccessible } from '../../lib/projectAccess.ts';
import { handleImageError, DEFAULT_CAD_DRAWING_URL, DEFAULT_MASTER_BLUEPRINT_URL } from '../../lib/imageUtils.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { MilestoneList } from '../../components/projects/MilestoneList.tsx';
import { BOQTable } from '../../components/projects/BOQTable.tsx';
import { EvidenceGallery } from '../../components/evidence/EvidenceGallery.tsx';
import { AIDiscrepancyPanel } from '../../components/ai/AIDiscrepancyPanel.tsx';
import { AuditReportModal } from '../../components/audit/AuditReportModal.tsx';
import { InspectionSchedulerModal } from '../../components/audit/InspectionSchedulerModal.tsx';
import { AuditActivityTimeline } from '../../components/audit/AuditActivityTimeline.tsx';
import { BOQUploadModal } from '../../components/projects/BOQUploadModal.tsx';
import { AddQuotationModal } from '../../components/projects/AddQuotationModal.tsx';
import { AdminReferenceUploadModal } from '../../components/admin/AdminReferenceUploadModal.tsx';
import { 
  Building2, 
  MapPin, 
  IndianRupee, 
  HardHat, 
  Layers, 
  ArrowLeft,
  Calendar,
  Sparkles,
  FileCheck,
  Printer,
  History,
  ShieldCheck,
  FileCode,
  FileSpreadsheet,
  Image as ImageIcon,
  Lock
} from 'lucide-react';

export const ProjectDetailsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const selectedMilestoneId = searchParams.get('milestone');
  const { profile } = useAuth();

  const { 
    getProjectById, 
    getProjectMilestones, 
    getMilestoneBOQ,
    getProjectEvidence 
  } = useProjects();

  const project = getProjectById(projectId || '');
  const milestones = getProjectMilestones(projectId || '');
  const projectEvidence = getProjectEvidence(projectId || '');

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'milestones' | 'evidence' | 'blueprints' | 'boq' | 'audit_trail'>(
    (tabParam as any) || 'milestones'
  );
  const [selectedMilestoneFilter, setSelectedMilestoneFilter] = useState<string>(
    selectedMilestoneId || (milestones[0]?.id ?? '')
  );

  React.useEffect(() => {
    if (tabParam && ['milestones', 'evidence', 'blueprints', 'boq', 'audit_trail'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
    if (selectedMilestoneId) {
      setSelectedMilestoneFilter(selectedMilestoneId);
    }
  }, [tabParam, selectedMilestoneId]);

  // Modals
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [isBOQUploadOpen, setIsBOQUploadOpen] = useState(false);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState(false);

  if (!project || !isProjectAccessible(project, profile)) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 shadow-lg shadow-rose-950/30">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Private & Anonymous Project</h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
          This project workspace is confidential. It is only accessible to the authorized project owner or the specifically assigned contractor.
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

  // Active milestone for BOQ focus
  const activeMilestone = milestones.find(m => m.id === selectedMilestoneFilter) || milestones[0];
  const boqItems = activeMilestone ? getMilestoneBOQ(activeMilestone.id) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Projects List
        </Link>

        <div className="flex items-center gap-2">
          {activeMilestone && (
            <>
              <Link
                to={`/admin/verify/${activeMilestone.id}`}
                className="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                Launch Verify Cockpit
              </Link>

              <button
                onClick={() => setIsQuotationModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm hover:scale-102"
                title="Upload Approved Contractual Quotation & BOQ Baseline for AI Anomaly Detection"
              >
                <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                Upload Quotation (Baseline)
              </button>

              <button
                onClick={() => setIsBlueprintModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-blue-950/40 text-blue-300 border border-blue-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
                title="Upload CAD Drawings & Approved Blueprints for VLM Verification"
              >
                <FileCode className="w-4 h-4 text-blue-400" />
                Upload Blueprints (VLM)
              </button>

              <button
                onClick={() => setIsSchedulerOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Calendar className="w-4 h-4 text-blue-400" />
                Schedule Visit
              </button>

              <button
                onClick={() => setIsReportOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/20 hover:scale-102"
              >
                <Printer className="w-4 h-4" />
                Audit Certificate
              </button>
            </>
          )}
        </div>
      </div>

      {/* Project Overview Card */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-glow-brand shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-blue-400 border border-slate-700">
                  {project.code}
                </span>
                <span className="text-xs text-slate-400">Client: <strong className="text-slate-200">{project.client_name}</strong></span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                {project.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/90 px-4 py-2.5 rounded-xl border border-slate-800 shrink-0">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Contract Value</div>
              <div className="text-base font-extrabold text-emerald-400 flex items-center">
                <IndianRupee className="w-4 h-4" />
                ₹{project.total_budget.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          {project.description}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-500" />
            <span>{project.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <HardHat className="w-4 h-4 text-amber-500" />
            <span>Contractor: <strong className="text-slate-200">{project.assigned_contractor_name}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>Milestones: <strong className="text-slate-200">{milestones.length} Defined</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span>Total Evidence: <strong className="text-slate-200">{projectEvidence.length} Files</strong></span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-6 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('milestones')}
          className={`pb-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'milestones'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          Milestone Checklist ({milestones.length})
        </button>

        <button
          onClick={() => setActiveTab('evidence')}
          className={`pb-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'evidence'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          Evidence & Document Register ({projectEvidence.length})
        </button>

        <button
          onClick={() => setActiveTab('blueprints')}
          className={`pb-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'blueprints'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode className="w-4 h-4" />
          Approved CAD Blueprints (VLM Standard)
        </button>

        <button
          onClick={() => setActiveTab('boq')}
          className={`pb-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'boq'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          BOQ Reconciliation
        </button>

        <button
          onClick={() => setActiveTab('audit_trail')}
          className={`pb-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'audit_trail'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          Audit Trail History
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'milestones' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200">
              Contractor Milestones & Deliverables
            </h2>
            <span className="text-xs text-slate-400">
              Click on any milestone to inspect contractor progress and evidence
            </span>
          </div>
          <MilestoneList milestones={milestones} projectId={project.id} />
        </div>
      )}

      {activeTab === 'evidence' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Select Milestone Scope</h3>
              <p className="text-xs text-slate-400">Review contractor submissions for specific milestone stage</p>
            </div>
            <select
              value={selectedMilestoneFilter}
              onChange={(e) => setSelectedMilestoneFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-medium focus:outline-none focus:border-blue-400"
            >
              {milestones.map((m) => (
                <option key={m.id} value={m.id}>
                  Stage {m.sequence_order}: {m.title} ({m.status.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {activeMilestone && (
            <>
              <AIDiscrepancyPanel
                milestoneId={activeMilestone.id}
                isInspector={true}
              />
              <EvidenceGallery
                milestoneId={activeMilestone.id}
                projectId={project.id}
                isContractor={false}
              />
            </>
          )}
        </div>
      )}

      {activeTab === 'blueprints' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700">
                  VLM GROUND TRUTH
                </span>
                <h3 className="text-sm font-bold text-white">
                  Admin Approved CAD Drawings & Blueprints
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                When contractor uploads actual site photos, the Multimodal VLM engine performs side-by-side structural comparison against these drawings.
              </p>
            </div>

            <button
              onClick={() => setIsBlueprintModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-glow-brand flex items-center gap-2 transition-all shrink-0"
            >
              <FileCode className="w-4 h-4" />
              Upload Phase Blueprints
            </button>
          </div>

          {/* Blueprint Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <strong className="text-xs text-white flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  Pier 14 Reinforcement CAD Drawing (IS 456 / IS 1786)
                </strong>
                <span className="text-[10px] font-mono text-emerald-400">Active Reference</span>
              </div>
              <img
                src={activeMilestone?.reference_images?.[0] || project.reference_blueprint_url || DEFAULT_CAD_DRAWING_URL}
                alt="CAD Blueprint"
                onError={(e) => handleImageError(e, DEFAULT_CAD_DRAWING_URL)}
                className="w-full h-44 object-cover rounded-xl border border-slate-800"
              />
              <p className="text-[11px] text-slate-300 font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                {activeMilestone?.reference_specs || "16x Fe-500D Primary Rebars (25mm), 150mm c/c Stirrup Pitch, 50mm Clear Cover blocks"}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <strong className="text-xs text-white flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  Project Master Viaduct Architectural Model
                </strong>
                <span className="text-[10px] font-mono text-blue-400">Project Wide</span>
              </div>
              <img
                src={project.reference_blueprint_url || activeMilestone?.reference_images?.[0] || DEFAULT_MASTER_BLUEPRINT_URL}
                alt="Master Plan"
                onError={(e) => handleImageError(e, DEFAULT_MASTER_BLUEPRINT_URL)}
                className="w-full h-44 object-cover rounded-xl border border-slate-800"
              />
              <p className="text-[11px] text-slate-300 font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                Nashik Sector 4 Highway Viaduct • 4-Lane Elevated Corridor Structural Scope
              </p>
            </div>
          </div>

          {/* Uploaded Blueprints Registered Gallery */}
          {((activeMilestone?.reference_images && activeMilestone.reference_images.length > 0) ||
            (project.reference_images && project.reference_images.length > 0)) && (
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-blue-400" />
                  Uploaded Engineering Reference Drawings (VLM Ground Truth Set)
                </h4>
                <span className="text-[11px] font-mono text-slate-400">
                  {(activeMilestone?.reference_images?.length || 0) + (project.reference_images?.length || 0)} Total Drawings
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {[...(activeMilestone?.reference_images || []), ...(project.reference_images || [])]
                  .filter((v, i, a) => a.indexOf(v) === i)
                  .map((imgUrl, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                      <img
                        src={imgUrl}
                        alt={`Uploaded Blueprint ${idx + 1}`}
                        onError={(e) => handleImageError(e, DEFAULT_CAD_DRAWING_URL)}
                        className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex items-end justify-between p-2">
                        <span className="text-[10px] font-mono font-bold text-emerald-400 truncate">
                          Blueprint #{idx + 1}
                        </span>
                        <span className="text-[9px] font-mono bg-blue-900/80 text-blue-200 px-1.5 py-0.5 rounded">
                          Active VLM
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'boq' && (
        <div className="space-y-4">
          {activeMilestone && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
                  Active Milestone Scope
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  {activeMilestone.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-800 text-slate-300">
                  Target: {activeMilestone.target_date}
                </span>
                <button
                  onClick={() => setIsQuotationModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Upload Quotation / Baseline (OCR)
                </button>
              </div>
            </div>
          )}

          <BOQTable items={boqItems} showReconciliation={true} />
        </div>
      )}

      {activeTab === 'audit_trail' && (
        <div className="p-6 rounded-2xl glass-panel border border-slate-800">
          {activeMilestone && (
            <AuditActivityTimeline milestoneId={activeMilestone.id} />
          )}
        </div>
      )}

      {/* Modals */}
      {activeMilestone && (
        <>
          <AdminReferenceUploadModal
            project={project}
            milestone={activeMilestone}
            isOpen={isBlueprintModalOpen}
            onClose={() => setIsBlueprintModalOpen(false)}
          />

          <AuditReportModal
            project={project}
            milestone={activeMilestone}
            isOpen={isReportOpen}
            onClose={() => setIsReportOpen(false)}
          />

          <InspectionSchedulerModal
            milestoneId={activeMilestone.id}
            projectId={project.id}
            isOpen={isSchedulerOpen}
            onClose={() => setIsSchedulerOpen(false)}
          />

          <BOQUploadModal
            projectId={project.id}
            milestoneId={activeMilestone.id}
            isOpen={isBOQUploadOpen}
            onClose={() => setIsBOQUploadOpen(false)}
          />

          <AddQuotationModal
            projectId={project.id}
            milestoneId={activeMilestone.id}
            isOpen={isQuotationModalOpen}
            onClose={() => setIsQuotationModalOpen(false)}
          />
        </>
      )}
    </div>
  );
};
