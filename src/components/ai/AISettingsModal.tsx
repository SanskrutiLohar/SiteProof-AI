import React, { useState } from 'react';
import { getGeminiApiKey, setGeminiApiKey, isGeminiKeyConfigured } from '../../lib/geminiApi.ts';
import { 
  X, 
  Sparkles, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Cpu,
  ShieldCheck
} from 'lucide-react';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [apiKey, setApiKey] = useState(getGeminiApiKey());
  const [isSaved, setIsSaved] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setGeminiApiKey(apiKey);
    setIsSaved(true);
    setTestResult(null);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestResult({
        success: false,
        message: 'Please enter a Gemini API Key first.'
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash?key=${apiKey.trim()}`
      );
      if (res.ok) {
        setTestResult({
          success: true,
          message: 'Connection successful! Gemini 1.5/2.0 Flash is ready for live multimodal verification.'
        });
      } else {
        setTestResult({
          success: false,
          message: `API returned error status ${res.status}. Check key validity.`
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: `Connection failed: ${err instanceof Error ? err.message : 'Network error'}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const hasKey = isGeminiKeyConfigured();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-lg my-8 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Gemini AI Engine Settings</h2>
              <p className="text-xs text-slate-400">
                Configure Google Gemini API for live Multimodal Vision & OCR
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

        {/* Engine Status Card */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-blue-400" />
              Active AI Architecture
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
              hasKey
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}>
              {hasKey ? 'Live Gemini 1.5 Flash' : 'Domain Heuristic Fallback'}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            {hasKey
              ? 'Connected to Google Gemini Multimodal Vision & Document OCR API for live image recognition and invoice parsing.'
              : 'Zero-configuration fallback active: Uses pre-trained civil engineering heuristics to generate authentic construction verification results offline.'}
          </p>
        </div>

        {/* Test Connection Feedback */}
        {testResult && (
          <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            testResult.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        {isSaved && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Gemini API Key saved locally for this browser session!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                Google Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-0.5"
              >
                Get a free key <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Stored strictly in your local browser storage. Never sent to any third-party server.
            </span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !apiKey.trim()}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
              >
                Save Settings
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
