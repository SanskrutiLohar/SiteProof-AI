import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ScheduledSiteInspection } from '../../types/audit.ts';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  ListChecks, 
  CheckCircle2, 
  AlertCircle,
  HardHat
} from 'lucide-react';

interface InspectionSchedulerModalProps {
  milestoneId: string;
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const InspectionSchedulerModal: React.FC<InspectionSchedulerModalProps> = ({
  milestoneId,
  projectId,
  isOpen,
  onClose,
}) => {
  const { profile } = useAuth();

  const [date, setDate] = useState<string>(
    new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10)
  );
  const [time, setTime] = useState<string>('10:00');
  const [inspectorName, setInspectorName] = useState(profile?.full_name || 'David Vance (Senior Lead Auditor)');
  const [location, setLocation] = useState('Site Gate 2 / Pier 12 Elevation Deck');
  const [objectives, setObjectives] = useState('Conduct non-destructive rebound hammer tests on pier column concrete, inspect cover block depth, and verify TMT steel batch stamps.');
  
  // Checklist items
  const [checklist, setChecklist] = useState<string[]>([
    'Rebound Hammer / Ultrasonic Pulse Velocity Test Kit',
    'High-Vis Safety Vest & Certified Hard Hat (IS 2925 compliant)',
    'Concrete Cover Depth Meter (Pachometer)',
    'Laser Distance Meter & 50m Measuring Tape',
    'Digital Core Thermometer for Mass Concrete Pouring'
  ]);
  const [newCheckItem, setNewCheckItem] = useState('');

  const [isSaved, setIsSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddChecklist = () => {
    if (newCheckItem.trim() && !checklist.includes(newCheckItem.trim())) {
      setChecklist([...checklist, newCheckItem.trim()]);
      setNewCheckItem('');
    }
  };

  const handleRemoveChecklist = (item: string) => {
    setChecklist(checklist.filter(c => c !== item));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!location.trim() || !inspectorName.trim()) {
      setErrorMsg('Location and assigned inspector are required.');
      return;
    }

    try {
      const scheduledDateTime = `${date}T${time}:00Z`;
      const newSchedule: ScheduledSiteInspection = {
        id: `insp-${Date.now()}`,
        milestone_id: milestoneId,
        project_id: projectId,
        inspector_name: inspectorName,
        scheduled_date: scheduledDateTime,
        location: location.trim(),
        checklist_items: checklist,
        objectives: objectives.trim(),
        status: 'scheduled',
        created_at: new Date().toISOString(),
      };

      const savedSchedules = localStorage.getItem('siteproof_schedules');
      const allSchedules: ScheduledSiteInspection[] = savedSchedules ? JSON.parse(savedSchedules) : [];
      allSchedules.push(newSchedule);
      localStorage.setItem('siteproof_schedules', JSON.stringify(allSchedules));

      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 900);
    } catch {
      setErrorMsg('Failed to schedule inspection. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-xl my-8 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Schedule Physical Site Inspection</h2>
              <p className="text-xs text-slate-400">
                Book on-site auditor walkthrough and non-destructive quality testing
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

        {/* Feedback Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isSaved && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Physical site inspection scheduled successfully and contractor notified!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                Inspection Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                Target Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          {/* Location & Auditor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                Meeting Point / Site Sector
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Pier 12 - Site Gate 2"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-400" />
                Assigned Lead Auditor
              </label>
              <input
                type="text"
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          {/* Objectives */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <HardHat className="w-3.5 h-3.5 text-amber-400" />
              Inspection Objectives & Key Checkpoints
            </label>
            <textarea
              rows={2}
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              placeholder="e.g. Rebound hammer testing, slump test verification, cover block spacing check..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 resize-none"
            />
          </div>

          {/* Testing Equipment & Safety Checklist */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <ListChecks className="w-3.5 h-3.5 text-emerald-400" />
              Required Safety Gear & Testing Apparatus
            </label>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {checklist.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {item}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklist(item)}
                    className="text-slate-500 hover:text-rose-400 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newCheckItem}
                onChange={(e) => setNewCheckItem(e.target.value)}
                placeholder="Add equipment or PPE requirement..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklist();
                  }
                }}
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-400"
              />
              <button
                type="button"
                onClick={handleAddChecklist}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700"
              >
                Add
              </button>
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
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all hover:scale-102"
            >
              <Calendar className="w-4 h-4" />
              Schedule Inspection Visit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
