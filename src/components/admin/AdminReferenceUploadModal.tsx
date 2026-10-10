import React, { useState } from 'react';
import { useProjects } from '../../context/ProjectContext.tsx';
import { Project, Milestone } from '../../types/index.ts';
import { fileToBase64 } from '../../lib/geminiApi.ts';
import { handleImageError, DEFAULT_MASTER_BLUEPRINT_URL } from '../../lib/imageUtils.ts';
import { 
  X, 
  Upload, 
  FileCode, 
  Image, 
  Trash2, 
  Loader2,
  ShieldCheck
} from 'lucide-react';

interface AdminReferenceUploadModalProps {
  project: Project;
  milestone?: Milestone;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AdminReferenceUploadModal: React.FC<AdminReferenceUploadModalProps> = ({
  project,
  milestone,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { updateMilestoneReferences, updateProjectReferences, addAuditLog } = useProjects();

  const [scopeType, setScopeType] = useState<'milestone' | 'project'>(milestone ? 'milestone' : 'project');
  const [referenceImages, setReferenceImages] = useState<string[]>(() => {
    if (milestone && milestone.reference_images && milestone.reference_images.length > 0) {
      return milestone.reference_images;
    }
    if (project.reference_images && project.reference_images.length > 0) {
      return project.reference_images;
    }
    return [
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80' // Architectural CAD Blueprint
    ];
  });
  const [specs, setSpecs] = useState<string>(
    milestone?.reference_specs || 'IS 456 / IS 1786 Standard: 16x Fe-500D Primary Rebar (25mm), 150mm c/c Stirrup Pitch, 50mm Clear Cover'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsProcessing(true);
      setStatusMessage('Processing and encoding engineering reference blueprints...');

      try {
        const newImages: string[] = [];
        for (let i = 0; i < e.target.files.length; i++) {
          const file = e.target.files[i];
          const { dataUrl } = await fileToBase64(file);
          newImages.push(dataUrl);
        }
        setReferenceImages((prev) => {
          // Prepend newly uploaded user drawings to index 0 so they become the active reference
          // Also strip out default unsplash sample images when custom drawings are uploaded
          const customOnly = prev.filter((img) => !img.startsWith('https://images.unsplash.com'));
          return [...newImages, ...customOnly];
        });
        setStatusMessage(`Successfully imported ${newImages.length} reference drawing(s)!`);
      } catch (err) {
        console.warn('Error reading files:', err);
        setStatusMessage('Error reading files.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (referenceImages.length > 0) {
      const primaryUrl = referenceImages[0];
      if (milestone && updateMilestoneReferences) {
        updateMilestoneReferences(milestone.id, referenceImages, specs);
      }
      if (updateProjectReferences) {
        updateProjectReferences(project.id, primaryUrl, referenceImages);
      }
      addAuditLog({
        milestone_id: milestone?.id || 'master',
        project_id: project.id,
        actor_name: 'Lead Inspector / Design Authority',
        actor_role: 'admin_inspector',
        action_type: 'milestone_updated',
        title: `Approved Reference Blueprints Updated (${referenceImages.length} CAD drawing${referenceImages.length > 1 ? 's' : ''})`,
        description: `Uploaded official design baseline for VLM comparison on "${milestone?.title || project.title}". Specs: ${specs}`,
      });
    }

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Admin Reference Blueprint & CAD Upload (VLM Standard)
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700">
                  AI Ground Truth
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Upload authorized engineering drawings and 3D CAD references. Multimodal VLM will compare contractor site photos against these reference images.
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

        <div className="overflow-y-auto pr-1 space-y-5 flex-1 scrollbar-thin">
          {/* Target Scope Selection */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-xs font-semibold text-slate-300">Reference Scope:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setScopeType('milestone')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  scopeType === 'milestone'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Dedicated Phase ({milestone ? milestone.title : 'Selected Milestone'})
              </button>
              <button
                type="button"
                onClick={() => setScopeType('project')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  scopeType === 'project'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Entire Project Master Plan
              </button>
            </div>
          </div>

          {/* Quick 1-Click Blueprints Presets */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 text-[11px] font-semibold">1-Click CAD Drawing Presets:</span>
            <button
              type="button"
              onClick={() => {
                setReferenceImages([
                  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
                  'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80'
                ]);
                setSpecs('IS 456 / IS 1786 Standard: 16x Fe-500D Primary Vertical Rebars (25mm), 150mm c/c Stirrups, 50mm Clear Cover');
                setStatusMessage('Loaded Pier 14 Structural Rebar CAD Blueprint Standard.');
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition-colors flex items-center gap-1"
            >
              📐 Preset 1: Pier 14 Rebar Cage CAD (IS 456)
            </button>
            <button
              type="button"
              onClick={() => {
                setReferenceImages([
                  DEFAULT_MASTER_BLUEPRINT_URL
                ]);
                setSpecs('M-40 Concrete Viaduct Deck Pour: 250mm Slab Thickness, Grade 60 Shear Studs, Waterproof Membrane');
                setStatusMessage('Loaded Deck Slab CAD Blueprint.');
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition-colors flex items-center gap-1"
            >
              📐 Preset 2: Viaduct Deck Slab Blueprint
            </button>
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/50 rounded-2xl p-5 text-center bg-slate-950/50 transition-colors">
            <input
              type="file"
              id="admin-blueprint-upload"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="admin-blueprint-upload"
              className="cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white">
                Click to upload multiple CAD Blueprints, Architectural 3D Renders, or Approved Structural Drawings
              </span>
              <span className="text-[11px] text-slate-400">
                Supports PNG, JPG, PDF, WEBP high-resolution engineering schematics
              </span>
            </label>
          </div>

          {/* Processing message */}
          {isProcessing && (
            <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center gap-3 text-blue-300 text-xs animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-blue-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Reference Specifications */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Engineering Specifications & Quality Thresholds (Passed to VLM Prompt):
            </label>
            <textarea
              rows={2}
              value={specs}
              onChange={(e) => setSpecs(e.target.value)}
              placeholder="Specify rebar grade, stirrups pitch, concrete mix, cover depth..."
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* Uploaded Reference Gallery Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Image className="w-4 h-4 text-emerald-400" />
                Active Approved Reference Blueprints ({referenceImages.length})
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Multimodal VLM Baseline
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {referenceImages.map((imgUrl, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                  <img
                    src={imgUrl}
                    alt={`Reference ${idx + 1}`}
                    onError={(e) => handleImageError(e, DEFAULT_MASTER_BLUEPRINT_URL)}
                    className="w-full h-28 object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex items-end justify-between p-2">
                    <span className="text-[10px] font-mono font-bold text-emerald-400">
                      CAD Reference #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="p-1 rounded-md bg-rose-500/80 hover:bg-rose-500 text-white transition-colors"
                      title="Remove Reference"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-glow-brand flex items-center gap-2 transition-all hover:scale-102"
          >
            <ShieldCheck className="w-4 h-4" />
            Lock Approved Blueprints as VLM Baseline
          </button>
        </div>
      </div>
    </div>
  );
};
