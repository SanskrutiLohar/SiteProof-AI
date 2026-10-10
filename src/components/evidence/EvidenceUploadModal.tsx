import React, { useState, useRef } from 'react';
import { useProjects } from '../../context/ProjectContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { extractExifFromImage, getBrowserLocation, ParsedExifData } from '../../lib/exifReader.ts';
import { 
  computeSHA256, 
  computePerceptualHash, 
  detectDuplicateEvidence,
  DuplicateDetectionResult 
} from '../../lib/integrityEngine.ts';
import { validateEvidenceGeofence } from '../../lib/geoDistance.ts';
import { CameraCaptureModal } from './CameraCaptureModal.tsx';
import { supabase, isSupabaseConfigured } from '../../lib/supabase.ts';
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
  Tag,
  ShieldAlert,
  Hash,
  AlertTriangle
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
  const { addEvidence, getMilestoneBOQ, getMilestoneEvidence, getProjectById } = useProjects();
  const { profile } = useAuth();
  const project = getProjectById(projectId);
  const boqItems = getMilestoneBOQ(milestoneId);
  const existingMilestoneEvidence = getMilestoneEvidence(milestoneId);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [evidenceType, setEvidenceType] = useState<'photo' | 'challan' | 'invoice' | 'inspection_report'>(defaultType);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  // Metadata fields
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [capturedAt, setCapturedAt] = useState<string>(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');
  const [selectedBOQId, setSelectedBOQId] = useState<string>('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Geofence Validation
  const geofence = validateEvidenceGeofence(latitude, longitude, project?.location || 'Nashik, Maharashtra');

  // Integrity & Hash indicators
  const [sha256Hash, setSha256Hash] = useState<string>('');
  const [perceptualHash, setPerceptualHash] = useState<string>('');
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateDetectionResult | null>(null);
  const [exifData, setExifData] = useState<ParsedExifData | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    setSelectedFile(file);
    setErrorMsg(null);
    setDuplicateWarning(null);

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Auto-detect category
    if (file.type.includes('image')) {
      if (evidenceType !== 'challan' && evidenceType !== 'invoice' && evidenceType !== 'inspection_report') {
        setEvidenceType('photo');
      }

      // 1. Extract EXIF
      const parsed = await extractExifFromImage(file);
      setExifData(parsed);

      if (parsed.hasGps && parsed.latitude && parsed.longitude) {
        setLatitude(parsed.latitude);
        setLongitude(parsed.longitude);
      }
      if (parsed.dateTime) {
        setCapturedAt(parsed.dateTime.slice(0, 16));
      }

      // 2. Compute Hashes & Detect Duplicates
      try {
        const hash = await computeSHA256(file);
        setSha256Hash(hash);

        let pHash: string | undefined = undefined;
        if (file.type.includes('image')) {
          pHash = await computePerceptualHash(file);
          setPerceptualHash(pHash);
        }

        // 3. Detect exact, visual, or filename duplicates against current milestone
        const dupResult = detectDuplicateEvidence(hash, pHash, existingMilestoneEvidence, file.name);
        if (dupResult.isExactDuplicate || dupResult.isVisualDuplicate) {
          setDuplicateWarning(dupResult);
          const docLabel = evidenceType === 'challan' ? 'Delivery challan' : 'Document';
          setErrorMsg(`This ${docLabel} already exists for this milestone phase. Duplicate upload is not allowed.`);
        }
      } catch (hErr) {
        console.warn('Hash computation warning:', hErr);
      }
    } else if (file.type.includes('pdf')) {
      if (evidenceType === 'photo') {
        setEvidenceType('challan');
      }

      try {
        const hash = await computeSHA256(file);
        setSha256Hash(hash);
        const dupResult = detectDuplicateEvidence(hash, undefined, existingMilestoneEvidence, file.name);
        if (dupResult.isExactDuplicate) {
          setDuplicateWarning(dupResult);
          setErrorMsg('This delivery challan already exists for this milestone phase. Duplicate upload is not allowed.');
        }
      } catch (hErr) {
        console.warn('Hash error:', hErr);
      }
    }
  };

  const handleCameraCaptureConfirm = (capturedFile: File, meta: {
    latitude?: number;
    longitude?: number;
    locationName?: string;
    capturedAt: string;
  }) => {
    if (meta.latitude && meta.longitude) {
      setLatitude(meta.latitude);
      setLongitude(meta.longitude);
    }
    if (meta.locationName) {
      setLocationName(meta.locationName);
    }
    if (meta.capturedAt) {
      setCapturedAt(meta.capturedAt.slice(0, 16));
    }
    handleFileProcess(capturedFile);
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
      setErrorMsg('Please select a file or take a photograph to upload.');
      return;
    }

    if (duplicateWarning?.isExactDuplicate || duplicateWarning?.isVisualDuplicate) {
      const docTypeLabel = evidenceType === 'challan' ? 'Delivery challan' : 'Document';
      setErrorMsg(`This ${docTypeLabel} already exists for this milestone phase. Duplicate upload is not allowed.`);
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);
    setUploadProgress(20);

    try {
      // Build tags
      const linkedBOQ = boqItems.find(b => b.id === selectedBOQId);
      const combinedTags = [...tags];
      if (linkedBOQ) {
        combinedTags.push(`BOQ: ${linkedBOQ.item_code}`);
      }
      if (notes.trim()) {
        combinedTags.push('Field Notes');
      }

      let finalFileUrl = previewUrl || '';
      setUploadProgress(50);

      // If live Supabase Storage is configured, upload to evidence-files bucket
      if (isSupabaseConfigured && selectedFile) {
        const fileExt = selectedFile.name.split('.').pop() || 'jpg';
        const storagePath = `${projectId}/${milestoneId}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('evidence-files')
          .upload(storagePath, selectedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.warn('Storage upload error, falling back to local object URL:', uploadError.message);
        } else if (uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from('evidence-files')
            .getPublicUrl(storagePath);
          if (publicUrlData?.publicUrl) {
            finalFileUrl = publicUrlData.publicUrl;
          }
        }
      }

      setUploadProgress(85);

      // Save record with SHA-256 and Perceptual hash
      addEvidence({
        milestone_id: milestoneId,
        project_id: projectId,
        uploaded_by: profile?.id || 'cont-001',
        uploaded_by_name: profile?.full_name || 'Contractor Site Engineer',
        type: evidenceType,
        file_name: selectedFile ? selectedFile.name : `SiteEvidence_${Date.now()}.jpg`,
        file_url: finalFileUrl,
        file_size: selectedFile?.size,
        sha256_hash: sha256Hash || `sha256_${Date.now()}`,
        perceptual_hash: perceptualHash || undefined,
        status: 'VERIFICATION_COMPLETE',
        latitude,
        longitude,
        location_name: locationName || 'Site Location Unspecified',
        captured_at: new Date(capturedAt).toISOString(),
        ai_analyzed: false,
        tags: combinedTags,
      });

      setUploadProgress(100);
      setIsUploading(false);
      setSuccessMsg(true);

      setTimeout(() => {
        onClose();
        setSuccessMsg(false);
      }, 800);
    } catch (err: unknown) {
      setIsUploading(false);
      const msg = err instanceof Error ? err.message : 'Failed to process evidence upload. Please try again.';
      setErrorMsg(msg);
    }
  };

  return (
    <>
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

          {duplicateWarning && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs space-y-1 animate-fadeIn">
              <div className="flex items-center gap-2 font-bold text-rose-300">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  {evidenceType === 'challan'
                    ? '⚠️ Delivery Challan Already Exists'
                    : duplicateWarning.isExactDuplicate
                    ? '⚠️ Duplicate Document Already Exists'
                    : `⚠️ Visual Similarity Warning (${duplicateWarning.duplicateOf?.similarityPercentage}% match)`}
                </span>
              </div>
              <p className="text-[11px] text-rose-200/90 leading-relaxed">
                {evidenceType === 'challan'
                  ? `The delivery challan "${duplicateWarning.duplicateOf?.file_name}" already exists for this milestone phase. Uploading duplicate challans is strictly prohibited.`
                  : duplicateWarning.isExactDuplicate
                  ? `The document "${duplicateWarning.duplicateOf?.file_name}" already exists for this phase. Re-submitting duplicate files is not allowed.`
                  : `This document appears visually identical to "${duplicateWarning.duplicateOf?.file_name}" already uploaded in this phase.`}
              </p>
            </div>
          )}

          {/* Geofence Mismatch Warning Banner */}
          {geofence.isMismatch && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs space-y-1.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>⚠️ Location Mismatch Alert ({geofence.distanceKm} km Away)</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                  Geofence Deviation
                </span>
              </div>
              <p className="text-[11px] text-rose-200/90 leading-relaxed">
                The evidence coordinates are located <strong>{geofence.distanceKm} km</strong> away from the authorized project site in <strong>{project?.location || 'Nashik'}</strong>. Antigravity AI audit verification will flag this location anomaly for inspector review.
              </p>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Evidence uploaded successfully! SHA-256 hash registered in audit ledger.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category Selector with Direct Camera Trigger */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Evidence Category <span className="text-amber-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCameraModalOpen(true)}
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Open Live Camera
                </button>
              </div>

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
                    <p className="text-xs text-slate-300 font-medium">
                      {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                    <p className="text-[11px] text-amber-400">Click to choose a different file</p>
                  </div>
                ) : selectedFile ? (
                  <div className="flex flex-col items-center gap-2 py-3">
                    <FileText className="w-10 h-10 text-blue-400" />
                    <p className="text-xs font-bold text-slate-200">{selectedFile.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {(selectedFile.size / 1024).toFixed(1)} KB • Document Ready
                    </p>
                    <p className="text-[11px] text-amber-400">Click to change file</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <UploadCloud className="w-8 h-8 text-slate-400 animate-bounce" />
                    <p className="text-xs font-semibold text-slate-200">
                      Drag and drop file here, or <span className="text-amber-400 underline">browse files</span>
                    </p>
                    <p className="text-[11px] text-slate-500">Supports high-res site photos up to 50MB and PDF documents</p>
                  </div>
                )}
              </div>

              {/* SHA-256 Hash Chip */}
              {sha256Hash && (
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate">
                    <Hash className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">SHA-256: {sha256Hash}</span>
                  </div>
                  <span className="text-[10px] bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800/60 shrink-0">
                    Cryptographic ID
                  </span>
                </div>
              )}

              {/* EXIF GPS Chip */}
              {exifData && exifData.hasGps && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>EXIF GPS: <strong>{exifData.latitude}°, {exifData.longitude}°</strong></span>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700/50">Auto-Tagged</span>
                </div>
              )}
            </div>

            {/* Location & GPS */}
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
                    step="0.000001"
                    value={latitude || ''}
                    onChange={(e) => setLatitude(parseFloat(e.target.value) || undefined)}
                    placeholder="Latitude"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <input
                    type="number"
                    step="0.000001"
                    value={longitude || ''}
                    onChange={(e) => setLongitude(parseFloat(e.target.value) || undefined)}
                    placeholder="Longitude"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                {/* 1-Click Demo GPS Presets */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setLatitude(19.9975);
                      setLongitude(73.7898);
                      if (!locationName) setLocationName('Nashik Sector 4 Elevated Viaduct Site');
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all font-semibold"
                  >
                    📍 Set Nashik Site (In-Zone)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLatitude(19.0760);
                      setLongitude(72.8777);
                      setLocationName('Mumbai Bandra Site (~142.8 km Mismatch)');
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all font-semibold"
                  >
                    📍 Set Mumbai (Mismatch)
                  </button>
                </div>
              </div>
            </div>

            {/* Date and BOQ Link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  Capture / Document Date
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
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  Link to BOQ Baseline Item (Optional)
                </label>
                <select
                  value={selectedBOQId}
                  onChange={(e) => setSelectedBOQId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="">-- Select Linked BOQ Item --</option>
                  {boqItems.map((boq) => (
                    <option key={boq.id} value={boq.id}>
                      {boq.item_code}: {boq.description.slice(0, 38)}...
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags & Notes */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Field Notes & Observations
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Rebar cage binding completed. Checked covering blocks and tie wire spacing before concrete pour."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-blue-400" />
                  Audit Tags
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
                    placeholder="Type tag and press Enter (e.g., Fe500D, Rebar, Batch 44)"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
                  >
                    Add
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[11px] font-medium flex items-center gap-1"
                      >
                        #{t}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="hover:text-rose-400"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Upload progress */}
            {isUploading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Uploading and calculating cryptographic hashes...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading || (!selectedFile && !previewUrl) || !!duplicateWarning}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-102 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UploadCloud className="w-4 h-4" />
                {isUploading ? 'Registering Evidence...' : 'Save & Register Evidence'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Live Camera Modal */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        projectLocation={project?.location || 'Nashik, Maharashtra'}
        onCaptureConfirm={handleCameraCaptureConfirm}
      />
    </>
  );
};
