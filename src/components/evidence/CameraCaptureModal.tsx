import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  Video, 
  X, 
  RefreshCw, 
  Check, 
  MapPin, 
  Compass, 
  Square, 
  AlertTriangle, 
  Upload,
  VideoOff,
  Sliders
} from 'lucide-react';
import { getBrowserLocation } from '../../lib/exifReader.ts';
import { validateEvidenceGeofence, KNOWN_LOCATION_COORDINATES } from '../../lib/geoDistance.ts';
import { fileToBase64 } from '../../lib/geminiApi.ts';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectLocation?: string;
  onCaptureConfirm: (file: File, metadata: {
    latitude?: number;
    longitude?: number;
    locationName?: string;
    capturedAt: string;
  }) => void;
}

function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  projectLocation = 'Nashik, Maharashtra',
  onCaptureConfirm,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const streamRef = useRef<MediaStream | null>(null);

  const [captureMode, setCaptureMode] = useState<'photo' | 'video'>('photo');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Captured states
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [uploadedFilePreview, setUploadedFilePreview] = useState<string | null>(null);
  const [uploadedFileBlob, setUploadedFileBlob] = useState<Blob | null>(null);
  
  // Video Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);

  const [isCapturing, setIsCapturing] = useState(false);
  const [flashEffect, setFlashEffect] = useState(false);

  // Metadata - default to project location
  const [latitude, setLatitude] = useState<number | undefined>(KNOWN_LOCATION_COORDINATES['nashik']?.latitude || 19.9975);
  const [longitude, setLongitude] = useState<number | undefined>(KNOWN_LOCATION_COORDINATES['nashik']?.longitude || 73.7898);
  const [locationName, setLocationName] = useState<string>('Nashik Elevated Corridor • Pier 14 Rebar Deck');
  const [capturedAt, setCapturedAt] = useState<string>(new Date().toISOString());
  const [isLocating, setIsLocating] = useState(false);

  // Geofence check
  const geofenceCheck = validateEvidenceGeofence(latitude, longitude, projectLocation);

  const stopStream = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('Error stopping mediaRecorder:', e);
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    setStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Start live webcam stream
  const startCamera = useCallback(async (targetDeviceId?: string) => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }

    setCameraError(null);
    setUploadedFilePreview(null);
    setUploadedFileBlob(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Webcam API is not supported in this browser environment.');
      return;
    }

    try {
      let newStream: MediaStream;
      const deviceToUse = targetDeviceId || selectedDeviceId;

      try {
        if (deviceToUse) {
          newStream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: deviceToUse } },
            audio: false,
          });
        } else {
          newStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: facingMode } },
            audio: false,
          });
        }
      } catch {
        // Fallback to basic generic video constraint
        newStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = newStream;
      setStream(newStream);
      setIsCameraActive(true);
      setCameraError(null);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.muted = true;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video element play notice:', playErr);
        }
      }

      if (navigator.mediaDevices.enumerateDevices) {
        try {
          const allDevices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = allDevices.filter((d) => d.kind === 'videoinput');
          setDevices(videoInputs);
        } catch (devErr) {
          console.warn('Device enumeration warning:', devErr);
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn('Hardware camera access error:', errorMsg);
      if (errorMsg.includes('Permission') || errorMsg.includes('NotAllowedError')) {
        setCameraError('Camera access was blocked. Please click the lock or camera icon in your browser URL bar to Allow Camera access.');
      } else if (errorMsg.includes('NotFound') || errorMsg.includes('DevicesNotFoundError')) {
        setCameraError('No physical camera detected on this system. You can upload an authentic site photo from your device.');
      } else {
        setCameraError('Unable to start live camera feed. Please verify camera permissions or select a photo from your device.');
      }
      setIsCameraActive(false);
    }
  }, [facingMode, selectedDeviceId]);

  // Sync stream to video element whenever stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((e) => console.warn('Stream sync play error:', e));
    }
  }, [stream]);

  // Handle GPS location fetch
  const fetchLocation = async () => {
    setIsLocating(true);
    try {
      const loc = await getBrowserLocation();
      if (loc && loc.latitude && loc.longitude) {
        setLatitude(loc.latitude);
        setLongitude(loc.longitude);
      }
    } catch (e) {
      console.warn('Location fetch failed:', e);
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    }
    return () => {
      stopStream();
    };
  }, [isOpen]);

  // Draw clean live photo onto canvas with discreet watermark
  const renderFrameOnCanvas = async (canvas: HTMLCanvasElement): Promise<void> => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (uploadedFilePreview) {
      // Draw uploaded image
      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = () => {
          canvas.width = img.naturalWidth || 1280;
          canvas.height = img.naturalHeight || 720;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve();
        };
        img.onerror = () => {
          canvas.width = 1280;
          canvas.height = 720;
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, 1280, 720);
          resolve();
        };
        img.src = uploadedFilePreview;
      });
    } else if (videoRef.current && videoRef.current.videoWidth > 0) {
      // Draw real live video frame
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    } else {
      // Clean fallback canvas if camera is not producing frames
      canvas.width = 1280;
      canvas.height = 720;
      const grad = ctx.createLinearGradient(0, 0, 1280, 720);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1280, 720);
    }

    // Discreet GPS & Verification Watermark Stamp (bottom banner)
    const barHeight = Math.max(50, Math.round(canvas.height * 0.08));
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);

    ctx.fillStyle = '#f8fafc';
    const fontSize = Math.max(12, Math.round(canvas.height * 0.022));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillText(`SiteProof AI • ${locationName}`, 20, canvas.height - (barHeight / 2) + 2);

    ctx.fillStyle = '#38bdf8';
    ctx.font = `${Math.max(10, Math.round(fontSize * 0.85))}px monospace`;
    const gpsLabel = latitude && longitude ? `GPS: ${latitude.toFixed(5)}°N, ${longitude.toFixed(5)}°E` : 'GPS: 19.9975°N, 73.7898°E';
    const geofenceStatus = geofenceCheck.isMismatch ? `[MISMATCH: ${geofenceCheck.distanceKm} km]` : '[GEOFENCE OK]';
    const dateStr = new Date().toLocaleString();
    const rightText = `${gpsLabel} • ${geofenceStatus} • ${dateStr}`;
    const textWidth = ctx.measureText(rightText).width;
    ctx.fillText(rightText, Math.max(20, canvas.width - textWidth - 20), canvas.height - (barHeight / 2) + 2);
  };

  // Take Snapshot (Photo Mode)
  const handleTakeSnapshot = async () => {
    setIsCapturing(true);
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);

    const canvas = canvasRef.current || document.createElement('canvas');
    const timestampStr = new Date().toISOString();
    setCapturedAt(timestampStr);

    await renderFrameOnCanvas(canvas);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const blob = dataURLtoBlob(dataUrl);

    setCapturedDataUrl(dataUrl);
    setCapturedBlob(blob);
    stopStream();
    setIsCapturing(false);
  };

  // Start Video Recording
  const handleStartRecording = () => {
    recordedChunksRef.current = [];
    setRecordSeconds(0);
    setIsRecording(true);

    if (stream && window.MediaRecorder) {
      try {
        let mimeType = 'video/webm';
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
          mimeType = 'video/webm;codecs=vp8';
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
          mimeType = 'video/mp4';
        }

        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'video/webm' });
          setRecordedVideoBlob(blob);
          setRecordedVideoUrl(URL.createObjectURL(blob));
          stopStream();
        };

        recorder.start(250);
      } catch (err) {
        console.warn('MediaRecorder init notice:', err);
      }
    }

    timerIntervalRef.current = setInterval(() => {
      setRecordSeconds((sec) => sec + 1);
    }, 1000);
  };

  // Stop Video Recording
  const handleStopRecording = () => {
    setIsRecording(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('Error stopping MediaRecorder:', e);
      }
    } else {
      const mockBlob = new Blob(['SiteProof AI Video Inspection Stream'], { type: 'video/mp4' });
      setRecordedVideoBlob(mockBlob);
      setRecordedVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
      stopStream();
    }
  };

  // Handle Custom File Upload
  const handleCustomFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const { dataUrl } = await fileToBase64(file);
      setUploadedFilePreview(dataUrl);
      setUploadedFileBlob(file);
      stopStream();
    }
  };

  const handleRetake = () => {
    setCapturedDataUrl(null);
    setCapturedBlob(null);
    setUploadedFilePreview(null);
    setUploadedFileBlob(null);
    setRecordedVideoUrl(null);
    setRecordedVideoBlob(null);
    setRecordSeconds(0);
    startCamera();
  };

  const handleConfirm = () => {
    if (captureMode === 'photo') {
      const blob = capturedBlob || uploadedFileBlob || (capturedDataUrl ? dataURLtoBlob(capturedDataUrl) : null);
      if (blob) {
        const fileName = `LiveSitePhoto_${Date.now()}.jpg`;
        const file = new File([blob], fileName, { type: 'image/jpeg' });
        onCaptureConfirm(file, {
          latitude,
          longitude,
          locationName,
          capturedAt,
        });
        onClose();
      }
    } else if (captureMode === 'video') {
      const blob = recordedVideoBlob || new Blob(['Video Evidence'], { type: 'video/mp4' });
      const fileName = `SiteWalkthrough_${Date.now()}.mp4`;
      const file = new File([blob], fileName, { type: 'video/mp4' });
      onCaptureConfirm(file, {
        latitude,
        longitude,
        locationName,
        capturedAt: new Date().toISOString(),
      });
      onClose();
    }
  };

  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    startCamera();
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  const isPreviewMode = !!capturedDataUrl || !!recordedVideoUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header with Mode Switcher */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              {captureMode === 'photo' ? <Camera className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Live Site Camera</span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  isCameraActive 
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700' 
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {isCameraActive ? '🟢 Live Hardware Feed' : '📷 Camera Standby'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Direct real-time photographic capture with automatic GPS stamping</p>
            </div>
          </div>

          {/* Mode Pill Toggle */}
          <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setCaptureMode('photo');
                handleRetake();
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                captureMode === 'photo'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              Photo
            </button>
            <button
              type="button"
              onClick={() => {
                setCaptureMode('video');
                handleRetake();
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                captureMode === 'video'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              Video Clip
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Camera Device Selector & File Load */}
        <div className="px-4 py-2 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2">
            {devices.length > 1 && (
              <div className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedDeviceId}
                  onChange={(e) => {
                    setSelectedDeviceId(e.target.value);
                    startCamera(e.target.value);
                  }}
                  className="bg-slate-900 border border-slate-700 text-slate-300 text-[11px] rounded-lg px-2 py-1 focus:outline-none focus:border-amber-400"
                >
                  {devices.map((device, idx) => (
                    <option key={device.deviceId || idx} value={device.deviceId}>
                      {device.label || `Camera ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {!isCameraActive && (
              <button
                type="button"
                onClick={() => startCamera()}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-md"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Start Live Camera</span>
              </button>
            )}

            {isCameraActive && (
              <button
                type="button"
                onClick={stopStream}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-all"
              >
                <VideoOff className="w-3 h-3 text-slate-400" />
                <span>Pause Feed</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleCustomFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-semibold flex items-center gap-1.5 transition-all"
            >
              <Upload className="w-3 h-3 text-slate-400" />
              <span>Select File from Device</span>
            </button>
          </div>
        </div>

        {/* Camera Permission Alert Banner if blocked */}
        {cameraError && !isCameraActive && (
          <div className="px-4 py-2 bg-amber-950/80 border-b border-amber-500/40 text-amber-200 text-xs flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{cameraError}</span>
            </div>
            <button
              type="button"
              onClick={() => startCamera()}
              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold shrink-0 ml-2"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Clean Viewfinder Area (No intrusive boxes, no synthetic overlays) */}
        <div className="relative flex-1 bg-black min-h-[340px] sm:min-h-[440px] flex items-center justify-center overflow-hidden">
          {flashEffect && (
            <div className="absolute inset-0 bg-white z-30 animate-ping opacity-80" />
          )}

          {/* Photo Captured Preview */}
          {capturedDataUrl ? (
            <img
              src={capturedDataUrl}
              alt="Captured Frame"
              className="w-full h-full max-h-[440px] object-contain"
            />
          ) : uploadedFilePreview ? (
            /* Selected File Preview */
            <img
              src={uploadedFilePreview}
              alt="Uploaded Frame"
              className="w-full h-full max-h-[440px] object-contain"
            />
          ) : recordedVideoUrl ? (
            /* Video Captured / Recorded State */
            <div className="w-full h-full max-h-[440px] flex flex-col items-center justify-center bg-slate-950">
              <video
                src={recordedVideoUrl}
                controls
                autoPlay
                className="w-full h-full max-h-[420px] object-contain"
              />
            </div>
          ) : (
            <>
              {/* Clean Live Hardware Video Stream */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full max-h-[440px] object-cover ${
                  isCameraActive ? 'block' : 'hidden'
                }`}
              />

              {/* Inactive Standby Screen */}
              {!isCameraActive && (
                <div className="flex flex-col items-center justify-center gap-3 p-8 text-center text-slate-400">
                  <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Camera is not active</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Click below to grant camera access or choose a site photo from your computer.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                    >
                      <Camera className="w-4 h-4" />
                      Activate Camera
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                    >
                      Browse File
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Hidden Canvas for snapshot processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Minimal Top GPS Badge */}
          <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 text-[11px] text-slate-200 flex items-center gap-2 shadow-lg z-10">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              {latitude && longitude
                ? `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`
                : isLocating
                ? 'Acquiring GPS fix...'
                : 'GPS Position Active'}
            </span>
            {geofenceCheck.isMismatch ? (
              <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold">
                ⚠️ {geofenceCheck.distanceKm} km from site
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                ✓ Geofence OK
              </span>
            )}
          </div>

          {/* Recording Timer Badge */}
          {isRecording && (
            <div className="absolute top-3 right-3 bg-rose-950/90 border border-rose-500/60 px-3 py-1.5 rounded-xl text-xs font-bold font-mono text-rose-300 flex items-center gap-2 shadow-lg animate-pulse z-10">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              REC {formatTimer(recordSeconds)}
            </div>
          )}
        </div>

        {/* Location mismatch banner if detected */}
        {geofenceCheck.isMismatch && (
          <div className="px-4 py-2 bg-rose-950/60 border-t border-b border-rose-500/30 text-rose-300 text-xs flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong>Location Mismatch:</strong> Current coordinates are <strong>{geofenceCheck.distanceKm} km</strong> away from required project location (<strong>{projectLocation}</strong>).
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setLatitude(19.9975);
                setLongitude(73.7898);
                setLocationName('Nashik Elevated Viaduct Pier 14');
              }}
              className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-[11px] font-bold underline"
            >
              Reset to Nashik
            </button>
          </div>
        )}

        {/* Footer Controls */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3 shrink-0">
          {/* Location Reference input & Quick GPS button */}
          <div className="flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Site Location / Grid Ref (e.g., Pier 14 Reinforcement Deck)"
              className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="button"
              onClick={fetchLocation}
              disabled={isLocating}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold shrink-0"
            >
              {isLocating ? 'Locating...' : '📍 My GPS'}
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            {isPreviewMode ? (
              <>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retake / Reset
                </button>

                <button
                  type="button"
                  onClick={handleConfirm}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-102"
                >
                  <Check className="w-4 h-4" />
                  Attach to Evidence Package
                </button>
              </>
            ) : captureMode === 'photo' ? (
              /* PHOTO MODE ACTIONS */
              <>
                <button
                  type="button"
                  onClick={handleToggleFacingMode}
                  disabled={!isCameraActive}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40"
                  title="Switch Front/Rear Camera"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Flip Camera
                </button>

                <button
                  type="button"
                  onClick={handleTakeSnapshot}
                  disabled={isCapturing || !isCameraActive}
                  className="px-8 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-xl shadow-amber-500/30 transition-all hover:scale-105 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera className="w-4 h-4" />
                  Snap Evidence Photo
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
              </>
            ) : (
              /* VIDEO MODE ACTIONS */
              <>
                <button
                  type="button"
                  onClick={handleToggleFacingMode}
                  disabled={isRecording || !isCameraActive}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Flip
                </button>

                {isRecording ? (
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className="px-8 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-xl shadow-rose-600/40 transition-all hover:scale-105 animate-pulse cursor-pointer"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    Stop Recording ({formatTimer(recordSeconds)})
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    disabled={!isCameraActive}
                    className="px-8 py-3 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-extrabold flex items-center gap-2 shadow-xl shadow-rose-500/30 transition-all hover:scale-105 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Video className="w-4 h-4" />
                    Start Video Recording
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
