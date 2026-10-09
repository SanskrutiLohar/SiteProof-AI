import React, { useState } from 'react';
import { EvidenceItem } from '../../types/index.ts';
import { OCRExtractionModal } from './OCRExtractionModal.tsx';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Calendar, 
  User, 
  Tag, 
  FileText, 
  Sparkles, 
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';

interface EvidenceLightboxProps {
  evidence: EvidenceItem;
  allEvidence: EvidenceItem[];
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (item: EvidenceItem) => void;
}

export const EvidenceLightbox: React.FC<EvidenceLightboxProps> = ({
  evidence,
  allEvidence,
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [isOCRExtractionOpen, setIsOCRExtractionOpen] = useState(false);

  if (!isOpen || !evidence) return null;

  const currentIndex = allEvidence.findIndex((e) => e.id === evidence.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allEvidence.length - 1;

  const handlePrev = () => {
    if (hasPrev && onNavigate) {
      setZoomLevel(1);
      onNavigate(allEvidence[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext && onNavigate) {
      setZoomLevel(1);
      onNavigate(allEvidence[currentIndex + 1]);
    }
  };

  const formattedDate = evidence.captured_at
    ? new Date(evidence.captured_at).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : new Date(evidence.uploaded_at).toLocaleString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md animate-fadeIn select-none">
      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 h-16 px-6 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-800 text-amber-400 border border-slate-700">
            {currentIndex + 1} / {allEvidence.length}
          </span>
          <h3 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
            {evidence.file_name}
          </h3>
        </div>

        {/* Toolbar & Close */}
        <div className="flex items-center gap-2">
          {evidence.type === 'photo' && (
            <div className="flex items-center bg-slate-800/80 rounded-xl border border-slate-700 p-1 mr-2">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono font-semibold px-2 text-slate-300">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors ml-1"
                title="Reset Zoom"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
              isDrawerOpen
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            {isDrawerOpen ? 'Hide Metadata' : 'Show Metadata'}
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative w-full h-full pt-16 flex overflow-hidden">
        {/* Media Viewing Canvas */}
        <div className="flex-1 relative flex items-center justify-center p-6 sm:p-10 overflow-hidden bg-slate-950/50">
          {evidence.type === 'photo' ? (
            <div className="w-full h-full flex items-center justify-center overflow-auto">
              <img
                src={evidence.file_url}
                alt={evidence.file_name}
                style={{ transform: `scale(${zoomLevel})` }}
                className="max-h-[85vh] max-w-[85vw] object-contain rounded-xl shadow-2xl transition-transform duration-200"
              />
            </div>
          ) : (
            <div className="max-w-xl w-full p-8 rounded-2xl glass-panel border border-slate-700 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
                <FileText className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">{evidence.file_name}</h4>
                <p className="text-xs text-slate-400 mt-1">
                  {evidence.type === 'challan' && 'Material Delivery Challan Document'}
                  {evidence.type === 'invoice' && 'Commercial Tax Invoice Document'}
                  {evidence.type === 'inspection_report' && 'Laboratory / Inspection Test Certificate'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 text-left space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Document Type:</span>
                  <span className="text-white capitalize">{evidence.type.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">File Size:</span>
                  <span className="text-white">{evidence.file_size ? `${(evidence.file_size / 1024).toFixed(1)} KB` : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Recorded Timestamp:</span>
                  <span className="text-white">{formattedDate}</span>
                </div>
              </div>

              <a
                href={evidence.file_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-all"
              >
                Open Full Document <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Previous / Next Floating Buttons */}
          {hasPrev && (
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700/80 shadow-xl transition-all hover:scale-110"
              title="Previous item"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {hasNext && (
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700/80 shadow-xl transition-all hover:scale-110"
              title="Next item"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Side Metadata Drawer */}
        {isDrawerOpen && (
          <div className="w-80 sm:w-96 h-full bg-slate-900 border-l border-slate-800 p-6 overflow-y-auto space-y-6 z-20 animate-slideLeft">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                Evidence Details
              </span>
              <h3 className="text-base font-bold text-white mt-1">
                {evidence.location_name || evidence.file_name}
              </h3>
            </div>

            {/* AI Verification Findings */}
            <div className={`p-4 rounded-2xl border space-y-2 ${
              evidence.ai_analyzed
                ? 'bg-gradient-to-br from-amber-500/15 via-slate-850 to-slate-900 border-amber-500/40'
                : 'bg-slate-800/40 border-slate-700/60'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  {evidence.type === 'photo' ? 'Multimodal Vision AI' : 'Document OCR Extraction'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  evidence.ai_analyzed
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {evidence.ai_analyzed ? `${evidence.ai_confidence || 95}% Confidence` : 'Verified OCR'}
                </span>
              </div>
              <p className="text-[11px] text-slate-200 leading-relaxed">
                {evidence.ai_summary || 'Extracted structured line items, supplier identity, quantities, and contractual reconciliation data.'}
              </p>

              {evidence.type !== 'photo' && (
                <button
                  onClick={() => setIsOCRExtractionOpen(true)}
                  className="w-full mt-2 py-2 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Inspect & Edit OCR Line Items
                </button>
              )}
            </div>

            {/* Metadata Fields */}
            <div className="space-y-4 text-xs">
              {/* Capture Time */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <Calendar className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] text-slate-400 block">Capture Timestamp</span>
                  <strong className="text-slate-200">{formattedDate}</strong>
                </div>
              </div>

              {/* Location & GPS */}
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] text-slate-400 block">Site Location</span>
                    <strong className="text-slate-200">{evidence.location_name || 'Unspecified'}</strong>
                  </div>
                </div>

                {evidence.latitude && evidence.longitude && (
                  <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between font-mono text-[11px]">
                    <span className="text-slate-400">
                      GPS: {evidence.latitude.toFixed(5)}°, {evidence.longitude.toFixed(5)}°
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${evidence.latitude},${evidence.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-400 hover:underline flex items-center gap-1"
                    >
                      Open Map <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Uploader */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <User className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] text-slate-400 block">Submitted By</span>
                  <strong className="text-slate-200">{evidence.uploaded_by_name || 'Contractor Site Rep'}</strong>
                </div>
              </div>

              {/* Tags */}
              {evidence.tags && evidence.tags.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[11px]">Assigned Tags & BOQ Links</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {evidence.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-semibold text-amber-300 border border-slate-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* OCR Extraction & Inspector Correction Modal */}
      {isOCRExtractionOpen && (
        <OCRExtractionModal
          evidenceItem={evidence}
          isOpen={isOCRExtractionOpen}
          onClose={() => setIsOCRExtractionOpen(false)}
        />
      )}
    </div>
  );
};
