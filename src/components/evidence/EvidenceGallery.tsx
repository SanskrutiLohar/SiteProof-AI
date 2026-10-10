import React, { useState } from 'react';
import { EvidenceItem } from '../../types/index.ts';
import { useProjects } from '../../context/ProjectContext.tsx';
import { EvidenceCard } from './EvidenceCard.tsx';
import { EvidenceTimeline } from './EvidenceTimeline.tsx';
import { EvidenceLightbox } from './EvidenceLightbox.tsx';
import { EvidenceUploadModal } from './EvidenceUploadModal.tsx';
import { CameraCaptureModal } from './CameraCaptureModal.tsx';
import { computeSHA256 } from '../../lib/integrityEngine.ts';
import { fileToBase64 } from '../../lib/geminiApi.ts';
import { 
  Camera, 
  FileText, 
  Receipt, 
  ClipboardCheck, 
  Layers, 
  UploadCloud, 
  Sparkles, 
  LayoutGrid, 
  Clock, 
  Search,
  Filter
} from 'lucide-react';

interface EvidenceGalleryProps {
  milestoneId: string;
  projectId: string;
  isContractor?: boolean;
}

type TabType = 'all' | 'photo' | 'challan' | 'invoice' | 'inspection_report';
type ViewMode = 'grid' | 'timeline';

export const EvidenceGallery: React.FC<EvidenceGalleryProps> = ({
  milestoneId,
  projectId,
  isContractor = true,
}) => {
  const { 
    getMilestoneEvidence, 
    deleteEvidence, 
    loadSampleEvidenceForMilestone,
    addEvidence,
    getProjectById
  } = useProjects();

  const project = getProjectById(projectId);
  const evidenceList = getMilestoneEvidence(milestoneId);

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [activeLightboxItem, setActiveLightboxItem] = useState<EvidenceItem | null>(null);

  const handleDirectCameraConfirm = async (file: File, meta: {
    latitude?: number;
    longitude?: number;
    locationName?: string;
    capturedAt: string;
  }) => {
    try {
      const { dataUrl } = await fileToBase64(file);
      const hash = await computeSHA256(file);

      addEvidence({
        milestone_id: milestoneId,
        project_id: projectId,
        file_name: file.name,
        file_url: dataUrl,
        file_size: file.size,
        type: 'photo',
        uploaded_by: 'Contractor Site Engineer',
        sha256_hash: hash,
        latitude: meta.latitude || 19.9975,
        longitude: meta.longitude || 73.7898,
        location_name: meta.locationName || 'Nashik Elevated Corridor • Pier 14 Deck',
        captured_at: meta.capturedAt,
        tags: ['Live Site Capture', 'Camera Authenticated', 'Geotagged'],
        status: 'VERIFICATION_COMPLETE',
      });
    } catch (err) {
      console.warn('Direct camera attachment error:', err);
    }
  };

  // Tab counts
  const countPhoto = evidenceList.filter((e) => e.type === 'photo').length;
  const countChallan = evidenceList.filter((e) => e.type === 'challan').length;
  const countInvoice = evidenceList.filter((e) => e.type === 'invoice').length;
  const countReport = evidenceList.filter((e) => e.type === 'inspection_report').length;

  // Filtered list
  const filteredEvidence = evidenceList.filter((item) => {
    const matchesTab = activeTab === 'all' || item.type === activeTab;
    const matchesSearch = 
      item.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.location_name && item.location_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.tags && item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesTab && matchesSearch;
  });

  const handleLoadDemoEvidence = () => {
    loadSampleEvidenceForMilestone(milestoneId, projectId);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar: Tabs, View Toggle, Search & Upload CTA */}
      <div className="p-4 sm:p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              All Evidence ({evidenceList.length})
            </button>

            <button
              onClick={() => setActiveTab('photo')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'photo'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              Site Photos ({countPhoto})
            </button>

            <button
              onClick={() => setActiveTab('challan')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'challan'
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Challans ({countChallan})
            </button>

            <button
              onClick={() => setActiveTab('invoice')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'invoice'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              Invoices ({countInvoice})
            </button>

            <button
              onClick={() => setActiveTab('inspection_report')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'inspection_report'
                  ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              Reports ({countReport})
            </button>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 shrink-0">
            {isContractor && (
              <>
                <button
                  onClick={handleLoadDemoEvidence}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                  title="Populate authentic construction photos, challans, and invoices for this milestone"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Load Demo Pack
                </button>

                <button
                  type="button"
                  onClick={() => setIsCameraModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm hover:scale-102"
                  title="Open live camera to capture geotagged photos or record inspection video"
                >
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span>Live Camera</span>
                </button>

                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all hover:scale-102"
                >
                  <UploadCloud className="w-4 h-4" />
                  Upload Files
                </button>
              </>
            )}
          </div>
        </div>

        {/* Secondary Bar: Search & View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by filename, location, or tag..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center gap-1 self-end sm:self-auto bg-slate-900 rounded-xl p-1 border border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-slate-800 text-amber-300 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Gallery Grid
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'timeline'
                  ? 'bg-slate-800 text-amber-300 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Timeline
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Display */}
      {filteredEvidence.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-panel border border-slate-800/80 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
            <Filter className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">No evidence records found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? 'No items match your search filter. Try clearing the search query.'
                : 'Upload site photographs, delivery challans, or load the pre-curated demo evidence pack.'}
            </p>
          </div>

          {isContractor && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={handleLoadDemoEvidence}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Load Authentic Demo Pack
              </button>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                Upload New Evidence
              </button>
            </div>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvidence.map((item) => (
            <EvidenceCard
              key={item.id}
              evidence={item}
              onPreview={(ev) => setActiveLightboxItem(ev)}
              onDelete={(id) => deleteEvidence(id)}
              canDelete={isContractor}
            />
          ))}
        </div>
      ) : (
        <div className="p-4 sm:p-6 rounded-2xl glass-panel border border-slate-800">
          <EvidenceTimeline
            evidenceList={filteredEvidence}
            onPreview={(ev) => setActiveLightboxItem(ev)}
          />
        </div>
      )}

      {/* Upload Modal */}
      <EvidenceUploadModal
        milestoneId={milestoneId}
        projectId={projectId}
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />

      {/* Direct Camera & Video Recorder Modal */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        projectLocation={project?.location || 'Nashik, Maharashtra'}
        onCaptureConfirm={handleDirectCameraConfirm}
      />

      {/* Lightbox Modal */}
      {activeLightboxItem && (
        <EvidenceLightbox
          evidence={activeLightboxItem}
          allEvidence={filteredEvidence}
          isOpen={Boolean(activeLightboxItem)}
          onClose={() => setActiveLightboxItem(null)}
          onNavigate={(nextItem) => setActiveLightboxItem(nextItem)}
        />
      )}
    </div>
  );
};
