import React from 'react';
import { EvidenceItem } from '../../types/index.ts';
import { 
  Camera, 
  FileText, 
  Receipt, 
  ClipboardCheck, 
  MapPin, 
  Calendar, 
  Trash2, 
  Eye, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface EvidenceCardProps {
  evidence: EvidenceItem;
  onPreview: (evidence: EvidenceItem) => void;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({
  evidence,
  onPreview,
  onDelete,
  canDelete = false,
}) => {
  const getTypeBadge = (type: EvidenceItem['type']) => {
    switch (type) {
      case 'photo':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Camera className="w-3 h-3" />
            Photo
          </span>
        );
      case 'challan':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
            <FileText className="w-3 h-3" />
            Delivery Challan
          </span>
        );
      case 'invoice':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <Receipt className="w-3 h-3" />
            Tax Invoice
          </span>
        );
      case 'inspection_report':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
            <ClipboardCheck className="w-3 h-3" />
            Test Certificate
          </span>
        );
    }
  };

  const formattedDate = evidence.captured_at
    ? new Date(evidence.captured_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date(evidence.uploaded_at).toLocaleDateString();

  return (
    <div className="group relative rounded-2xl glass-panel border border-slate-800 hover:border-amber-500/40 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5 flex flex-col justify-between">
      {/* Media Thumbnail Section */}
      <div 
        onClick={() => onPreview(evidence)}
        className="relative h-44 bg-slate-950 overflow-hidden cursor-pointer flex items-center justify-center border-b border-slate-800"
      >
        {evidence.type === 'photo' ? (
          <img
            src={evidence.file_url}
            alt={evidence.file_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full p-4 flex flex-col items-center justify-center bg-slate-900/90 relative">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-2 text-slate-300 group-hover:text-amber-400 transition-colors">
              {evidence.type === 'challan' && <FileText className="w-6 h-6 text-blue-400" />}
              {evidence.type === 'invoice' && <Receipt className="w-6 h-6 text-emerald-400" />}
              {evidence.type === 'inspection_report' && <ClipboardCheck className="w-6 h-6 text-purple-400" />}
            </div>
            <p className="text-xs font-bold text-slate-300 text-center line-clamp-1 max-w-[200px]">
              {evidence.file_name}
            </p>
            <span className="text-[10px] text-slate-500 mt-0.5">Click to Inspect Document</span>
          </div>
        )}

        {/* Top Floating Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          {getTypeBadge(evidence.type)}
        </div>

        {/* AI Status Chip */}
        <div className="absolute top-2.5 right-2.5 z-10">
          {evidence.ai_analyzed ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20">
              <Sparkles className="w-3 h-3" />
              AI Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-900/80 text-slate-300 backdrop-blur-md border border-slate-700/60">
              <Sparkles className="w-3 h-3 text-slate-400" />
              Pending AI
            </span>
          )}
        </div>

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview(evidence);
            }}
            className="p-2 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold text-xs flex items-center gap-1 shadow-lg transition-transform hover:scale-105"
          >
            <Eye className="w-3.5 h-3.5" />
            Inspect
          </button>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          {/* Location & Title */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 line-clamp-1 group-hover:text-amber-400 transition-colors">
              {evidence.location_name || evidence.file_name}
            </h4>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
              <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* GPS Chip if available */}
          {evidence.latitude && evidence.longitude && (
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[10px] text-slate-300 font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <MapPin className="w-3 h-3" />
                {evidence.latitude.toFixed(4)}°, {evidence.longitude.toFixed(4)}°
              </span>
              <a
                href={`https://www.google.com/maps?q=${evidence.latitude},${evidence.longitude}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-slate-400 hover:text-amber-400 flex items-center gap-0.5"
                title="View on Map"
              >
                Map <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          )}

          {/* Tags */}
          {evidence.tags && evidence.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {evidence.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 rounded bg-slate-800/80 text-[10px] font-medium text-slate-400 border border-slate-700/50"
                >
                  {tag}
                </span>
              ))}
              {evidence.tags.length > 3 && (
                <span className="px-1.5 py-0.5 rounded bg-slate-800/80 text-[10px] font-medium text-slate-500">
                  +{evidence.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer info: Uploader and Actions */}
        <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/60 text-[11px] text-slate-500">
          <span className="truncate max-w-[150px]">
            By <strong className="text-slate-300 font-medium">{evidence.uploaded_by_name?.split(' ')[0] || 'Contractor'}</strong>
          </span>

          <div className="flex items-center gap-1">
            {canDelete && onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(evidence.id);
                }}
                className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Delete evidence"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
