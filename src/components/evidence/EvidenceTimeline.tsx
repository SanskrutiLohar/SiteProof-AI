import React from 'react';
import { EvidenceItem } from '../../types/index.ts';
import { 
  Camera, 
  FileText, 
  Receipt, 
  ClipboardCheck, 
  MapPin, 
  Calendar, 
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface EvidenceTimelineProps {
  evidenceList: EvidenceItem[];
  onPreview: (evidence: EvidenceItem) => void;
}

export const EvidenceTimeline: React.FC<EvidenceTimelineProps> = ({
  evidenceList,
  onPreview,
}) => {
  // Sort evidence chronologically
  const sortedEvidence = [...evidenceList].sort((a, b) => {
    const timeA = new Date(a.captured_at || a.uploaded_at).getTime();
    const timeB = new Date(b.captured_at || b.uploaded_at).getTime();
    return timeB - timeA; // latest first
  });

  const getIcon = (type: EvidenceItem['type']) => {
    switch (type) {
      case 'photo':
        return <Camera className="w-4 h-4 text-amber-400" />;
      case 'challan':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'invoice':
        return <Receipt className="w-4 h-4 text-emerald-400" />;
      case 'inspection_report':
        return <ClipboardCheck className="w-4 h-4 text-purple-400" />;
    }
  };

  if (sortedEvidence.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl glass-panel border border-slate-800 text-slate-400 text-xs">
        No evidence logged on the timeline yet.
      </div>
    );
  }

  return (
    <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-amber-500 before:via-blue-500 before:to-slate-800">
      {sortedEvidence.map((item, idx) => {
        const itemDate = item.captured_at
          ? new Date(item.captured_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : new Date(item.uploaded_at).toLocaleDateString();

        return (
          <div key={item.id || idx} className="relative group">
            {/* Timeline node icon */}
            <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 sm:w-8 h-6 sm:h-8 rounded-full bg-slate-900 border-2 border-slate-700 group-hover:border-amber-400 flex items-center justify-center transition-all z-10 shadow-lg">
              {getIcon(item.type)}
            </div>

            {/* Timeline content box */}
            <div 
              onClick={() => onPreview(item)}
              className="p-4 sm:p-5 rounded-2xl glass-panel border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                    {item.type.replace('_', ' ')}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                    {item.location_name || item.file_name}
                  </h4>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400 shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{itemDate}</span>
                </div>
              </div>

              {/* Media preview and metadata */}
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {item.type === 'photo' ? (
                  <img
                    src={item.file_url}
                    alt={item.file_name}
                    className="w-full sm:w-36 h-24 object-cover rounded-xl border border-slate-700 shrink-0"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full sm:w-36 h-24 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-2 text-center shrink-0">
                    <FileText className="w-6 h-6 text-blue-400 mb-1" />
                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">{item.file_name}</span>
                  </div>
                )}

                <div className="space-y-2 flex-1 text-xs">
                  <p className="text-slate-300 text-xs line-clamp-2">
                    {item.file_name}
                  </p>

                  {item.latitude && item.longitude && (
                    <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-mono">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>GPS: {item.latitude.toFixed(4)}°, {item.longitude.toFixed(4)}°</span>
                      <a
                        href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-slate-400 hover:text-amber-400 flex items-center gap-0.5 ml-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {item.tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 rounded bg-slate-800/80 text-[10px] font-medium text-slate-400 border border-slate-700/50"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Uploaded by <strong>{item.uploaded_by_name || 'Contractor'}</strong></span>
                    <span className="text-amber-400 text-[10px] font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Click to Inspect
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
