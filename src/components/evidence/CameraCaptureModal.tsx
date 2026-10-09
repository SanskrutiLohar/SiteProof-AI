import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  X, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  MapPin, 
  Compass
} from 'lucide-react';
import { getBrowserLocation } from '../../lib/exifReader.ts';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaptureConfirm: (file: File, metadata: {
    latitude?: number;
    longitude?: number;
    locationName?: string;
    capturedAt: string;
  }) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCaptureConfirm,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [flashEffect, setFlashEffect] = useState(false);

  // Metadata
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [locationName, setLocationName] = useState<string>('Live Site Camera Fix');
  const [capturedAt, setCapturedAt] = useState<string>(new Date().toISOString());
  const [isLocating, setIsLocating] = useState(false);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startStream = useCallback(async () => {
    stopStream();
    setPermissionDenied(false);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionDenied(true);
      return;
    }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setPermissionDenied(true);
    }
  }, [facingMode, stopStream]);

  // Handle GPS location fetch
  const fetchLocation = async () => {
    setIsLocating(true);
    try {
      const loc = await getBrowserLocation();
      if (loc) {
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
    if (isOpen && !capturedDataUrl) {
      startStream();
      fetchLocation();
    }
    return () => {
      stopStream();
    };
  }, [isOpen, capturedDataUrl, startStream, stopStream]);

  if (!isOpen) return null;

  const handleTakeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Watermark GPS & Timestamp overlay for authentic audit evidence
      const timestampStr = new Date().toISOString();
      setCapturedAt(timestampStr);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(10, canvas.height - 50, 480, 40);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '13px monospace';
      const gpsLabel = latitude && longitude ? `GPS: ${latitude.toFixed(5)}°, ${longitude.toFixed(5)}° | ` : '';
      ctx.fillText(`SiteProof AI • ${gpsLabel}${new Date().toLocaleString()}`, 20, canvas.height - 25);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setCapturedDataUrl(dataUrl);

      canvas.toBlob((blob) => {
        if (blob) {
          setCapturedBlob(blob);
        }
      }, 'image/jpeg', 0.92);

      stopStream();
    }
    setIsCapturing(false);
  };

  const handleRetake = () => {
    setCapturedDataUrl(null);
    setCapturedBlob(null);
    startStream();
  };

  const handleConfirm = () => {
    if (capturedBlob) {
      const fileName = `SitePhoto_${Date.now()}.jpg`;
      const file = new File([capturedBlob], fileName, { type: 'image/jpeg' });
      onCaptureConfirm(file, {
        latitude,
        longitude,
        locationName,
        capturedAt,
      });
      onClose();
    }
  };

  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Live Site Camera</h3>
              <p className="text-[11px] text-slate-400">Capture authenticated real-time milestone evidence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Captured Preview Area */}
        <div className="relative flex-1 bg-black min-h-[320px] sm:min-h-[400px] flex items-center justify-center overflow-hidden">
          {flashEffect && (
            <div className="absolute inset-0 bg-white z-20 animate-ping opacity-80" />
          )}

          {capturedDataUrl ? (
            <img
              src={capturedDataUrl}
              alt="Captured Frame"
              className="w-full h-full max-h-[420px] object-contain"
            />
          ) : permissionDenied ? (
            <div className="p-6 text-center max-w-sm space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">Camera Inaccessible</h4>
              <p className="text-xs text-slate-400">
                Camera access was denied or is not supported in this browser window. Please use standard file upload or grant browser camera permissions.
              </p>
              <button
                onClick={startStream}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-semibold"
              >
                Retry Access
              </button>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full max-h-[420px] object-cover"
            />
          )}

          {/* Hidden Canvas for snapshot processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* GPS HUD Tag Overlay */}
          <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 text-[11px] text-slate-200 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              {latitude && longitude
                ? `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`
                : isLocating
                ? 'Acquiring GPS fix...'
                : 'GPS Position Active'}
            </span>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
          {/* Location Reference input */}
          <div className="flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Site Location / Grid Ref (e.g., Pier 12 Cap East)"
              className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            {capturedDataUrl ? (
              <>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retake Photo
                </button>

                <button
                  type="button"
                  onClick={handleConfirm}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-102"
                >
                  <Check className="w-4 h-4" />
                  Attach to Evidence
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleToggleFacingMode}
                  disabled={permissionDenied}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40"
                  title="Switch Front/Rear Camera"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Flip Camera
                </button>

                <button
                  type="button"
                  onClick={handleTakeSnapshot}
                  disabled={permissionDenied || isCapturing}
                  className="px-8 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-xl shadow-amber-500/30 transition-all hover:scale-105 disabled:opacity-40"
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
