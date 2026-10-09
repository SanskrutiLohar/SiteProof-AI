import React, { useState, useRef } from 'react';
import { useProjects } from '../../context/ProjectContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { extractExifFromImage, getBrowserLocation, ParsedExifData } from '../../lib/exifReader.ts';
import { 
  X, 
  UploadCloud, 
  Camera, 
  FileText, 
  Receipt, 
  ClipboardCheck, 
  MapPin, 
  Calendar, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  Compass,
  Tag
} from 'lucide-react';

interface EvidenceUploadModalProps {
  milestoneId: string;
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'photo' | 'challan' | 'invoice' | 'inspection_report';
}

export const EvidenceUploadModal: React.FC<EvidenceUploadModalProps> = ({
  milestoneId,
  projectId,
  isOpen,
  onClose,
  defaultType = 'photo'
}) => {
  const { addEvidence, getMilestoneBOQ } = useProjects();
  const { profile } = useAuth();
  const boqItems = getMilestoneBOQ(milestoneId);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [evidenceType, setEvidenceType] = useState<'photo' | 'challan' | 'invoice' | 'inspection_report'>(defaultType);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Metadata fields
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [capturedAt, setCapturedAt] = useState<string>(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');
  const [selectedBOQId, setSelectedBOQId] = useState<string>('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // State indicators
  const [exifData, setExifData] = useState<ParsedExifData | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    setSelectedFile(file);
    setErrorMsg(null);

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Auto-detect type if not explicitly set
    if (file.type.includes('image')) {
      if (evidenceType !== 'challan' && evidenceType !== 'invoice' && evidenceType !== 'inspection_report') {
        setEvidenceType('photo');
      }
      // Extract EXIF data
      const parsed = await extractExifFromImage(file);
      setExifData(parsed);

      if (parsed.hasGps && parsed.latitude && parsed.longitude) {
        setLatitude(parsed.latitude);
        setLongitude(parsed.longitude);
      }

      if (parsed.dateTime) {
        setCapturedAt(parsed.dateTime.slice(0, 16));
      }
    } else if (file.type.includes('pdf')) {
      if (evidenceType === 'photo') {
        setEvidenceType('challan');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleGetLocation = async () => {
    setIsLocating(true);
    const loc = await getBrowserLocation();
    setIsLocating(false);
    if (loc) {
      setLatitude(loc.latitude);
      setLongitude(loc.longitude);
      if (!locationName) {
        setLocationName('Current Site GPS Fix');
      }
    } else {
      setErrorMsg('Could not fetch browser location. Please check browser permissions.');
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !previewUrl) {
      setErrorMsg('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    try {
      // Build evidence item
      const linkedBOQ = boqItems.find(b => b.id === selectedBOQId);
      const combinedTags = [...tags];
      if (linkedBOQ) {
        combinedTags.push(`BOQ: ${linkedBOQ.item_code}`);
      }
      if (notes.trim()) {
        combinedTags.push('Field Notes');
      }

      // Convert file to base64 for persistent storage if image
      let finalFileUrl = previewUrl || '';
      if (selectedFile) {
        const reader = new FileReader();
        finalFileUrl = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string || previewUrl || '');
          reader.onerror = () => resolve(previewUrl || '');
          reader.readAsDataURL(selectedFile);
        });
      }

      addEvidence({
        milestone_id: milestoneId,
        project_id: projectId,
        uploaded_by: profile?.id || 'cont-001',
        uploaded_by_name: profile?.full_name || 'Contractor Site Engineer',
        type: evidenceType,
        file_name: selectedFile ? selectedFile.name : `Evidence_${Date.now()}`,
        file_url: finalFileUrl,
        file_size: selectedFile?.size,
        latitude,
        longitude,
        location_name: locationName || 'Site Location Unspecified',
        captured_at: new Date(capturedAt).toISOString(),
        ai_analyzed: false,
        tags: combinedTags,
      });

      setIsUploading(false);
      setSuccessMsg(true);

      setTimeout(() => {
        onClose();
        setSuccessMsg(false);
      }, 900);
    } catch {
      setIsUploading(false);
      setErrorMsg('Failed to process evidence upload. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl my-8 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Upload Milestone Evidence</h2>
              <p className="text-xs text-slate-400">
                Site photographs, delivery challans, and invoices for milestone verification
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

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Evidence uploaded successfully! Added to milestone register.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Evidence Type Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              Evidence Category <span className="text-amber-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setEvidenceType('photo')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  evidenceType === 'photo'
                    ? 'bg-amber-500/20 border-amber-500/80 text-amber-300 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Camera className="w-4 h-4" />
                Site Photo
              </button>

              <button
                type="button"
                onClick={() => setEvidenceType('challan')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  evidenceType === 'challan'
                    ? 'bg-blue-500/20 border-blue-500/80 text-blue-300 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                Delivery Challan
              </button>

              <button
                type="button"
                onClick={() => setEvidenceType('invoice')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  evidenceType === 'invoice'
                    ? 'bg-emerald-500/20 border-emerald-500/80 text-emerald-300 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Receipt className="w-4 h-4" />
                Tax Invoice
              </button>

              <button
                type="button"
                onClick={() => setEvidenceType('inspection_report')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  evidenceType === 'inspection_report'
                    ? 'bg-purple-500/20 border-purple-500/80 text-purple-300 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ClipboardCheck className="w-4 h-4" />
                Test Cert / Report
              </button>
            </div>
          </div>

          {/* Drag & Drop File Zone */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              Media File (JPEG, PNG, WEBP, PDF) <span className="text-amber-400">*</span>
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-amber-400 bg-amber-500/10'
                  : 'border-slate-700 hover:border-slate-500 bg-slate-800/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileProcess(e.target.files[0]);
                  }
                }}
              />

              {previewUrl && selectedFile?.type.includes('image') ? (
                <div className="flex flex-col items-center gap-3">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-44 rounded-xl object-contain border border-slate-700"
                  />
                  <p className="text-xs text-slate-300 font-medium">{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                  <p className="text-[11px] text-amber-400">Click to choose a different file</p>
                </div>
              ) : selectedFile ? (
                <div className="flex flex-col items-center gap-2 py-3">
                  <FileText className="w-10 h-10 text-blue-400" />
                  <p className="text-xs font-bold text-slate-200">{selectedFile.name}</p>
                  <p className="text-[11px] text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB • Document Ready</p>
                  <p className="text-[11px] text-amber-400">Click to change file</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4">
                  <UploadCloud className="w-8 h-8 text-slate-400 animate-bounce" />
                  <p className="text-xs font-semibold text-slate-200">
                    Drag and drop file here, or <span className="text-amber-400 underline">browse files</span>
                  </p>
                  <p className="text-[11px] text-slate-500">Supports high-res site photos up to 25MB and PDF documents</p>
                </div>
              )}
            </div>

            {/* EXIF GPS Chip */}
            {exifData && exifData.hasGps && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>EXIF GPS Coordinates Extracted: <strong>{exifData.latitude}°, {exifData.longitude}°</strong></span>
                </div>
                <span className="text-[10px] font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700/50">Auto-Tagged</span>
              </div>
            )}
          </div>

          {/* Location & Geolocation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                Site Location / Grid Ref
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g., Pier 12 - Grid C2, East Face"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-blue-400" />
                  GPS Coordinates
                </label>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isLocating}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 disabled:opacity-50"
                >
                  {isLocating ? 'Locating...' : '📍 Use My GPS'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="any"
                  value={latitude ?? ''}
                  onChange={(e) => setLatitude(e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="Latitude"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <input
                  type="number"
                  step="any"
                  value={longitude ?? ''}
                  onChange={(e) => setLongitude(e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="Longitude"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Capture Date & Linked BOQ Item */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                Capture Date & Time
              </label>
              <input
                type="datetime-local"
                value={capturedAt}
                onChange={(e) => setCapturedAt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                Link to BOQ Baseline Item
              </label>
              <select
                value={selectedBOQId}
                onChange={(e) => setSelectedBOQId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="">-- General Milestone Evidence --</option>
                {boqItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.item_code}: {item.description.slice(0, 32)}... ({item.quantity_ordered} {item.unit})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags & Field Notes */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                Custom Tags
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="e.g. Rebar Cage, M40 Grade, Inspection Stamp"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white"
                >
                  Add Tag
                </button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-amber-300 border border-slate-700"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-rose-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Contractor Inspection Remarks / Field Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes on visual conditions, test batch numbers, or staging levels..."
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none"
              />
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
              disabled={isUploading || (!selectedFile && !previewUrl)}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Uploading Evidence...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  Save & Attach Evidence
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
