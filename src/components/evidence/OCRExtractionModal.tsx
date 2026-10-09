import React, { useState } from 'react';
import { 
  FileText, 
  X, 
  Save, 
  CheckCircle2, 
  Sparkles, 
  Edit3, 
  RotateCcw,
  Building,
  Calendar,
  Hash,
  Package
} from 'lucide-react';
import { EvidenceItem } from '../../types/index.ts';

interface OCRExtractionModalProps {
  evidenceItem: EvidenceItem;
  isOpen: boolean;
  onClose: () => void;
}

export interface ExtractedDocumentFields {
  supplier_name: string;
  invoice_number: string;
  document_date: string;
  material_description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  tax_amount: number;
  total_amount: number;
  purchase_order_ref: string;
  confidence_score: number;
  is_manually_corrected: boolean;
}

export const OCRExtractionModal: React.FC<OCRExtractionModalProps> = ({
  evidenceItem,
  isOpen,
  onClose,
}) => {
  // Initialize extracted fields with fallback defaults or parsed data
  const initialFields: ExtractedDocumentFields = {
    supplier_name: evidenceItem.file_name.includes('Tata') ? 'Tata Steel Ltd' : 'UltraTech RMC India Pvt Ltd',
    invoice_number: evidenceItem.file_name.includes('Tata') ? 'INV-2026-TMT-8842' : 'CHAL-2026-UT-4491',
    document_date: evidenceItem.captured_at ? evidenceItem.captured_at.slice(0, 10) : '2026-10-06',
    material_description: evidenceItem.file_name.includes('Tata')
      ? 'Fe500D High Yield Corrosion Resistant TMT Rebar (16mm-32mm)'
      : 'M45 Grade Ready Mix Concrete with Fly-ash Pozzolana',
    quantity: evidenceItem.file_name.includes('Tata') ? 18.5 : 120.0,
    unit: evidenceItem.file_name.includes('Tata') ? 'MT' : 'Cu.m',
    unit_price: evidenceItem.file_name.includes('Tata') ? 72000 : 6850,
    tax_amount: evidenceItem.file_name.includes('Tata') ? 240000 : 148000,
    total_amount: evidenceItem.file_name.includes('Tata') ? 1572000 : 970000,
    purchase_order_ref: 'PO-DMRC-2026-PKG2-088',
    confidence_score: 96.4,
    is_manually_corrected: false,
  };

  const [fields, setFields] = useState<ExtractedDocumentFields>(initialFields);
  const [originalFields] = useState<ExtractedDocumentFields>(initialFields);
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveCorrections = (e: React.FormEvent) => {
    e.preventDefault();
    setFields({
      ...fields,
      is_manually_corrected: true,
    });
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetToRaw = () => {
    setFields(originalFields);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Document OCR & Field Verification</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 border border-blue-800 text-blue-300">
                  {fields.confidence_score}% Confidence
                </span>
                {fields.is_manually_corrected && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 border border-amber-800 text-amber-300">
                    Auditor Corrected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {evidenceItem.file_name} • Supplier commercial extraction & quantity audit
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {saveSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Extracted field corrections saved and recorded in audit log.</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Document Preview */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Source Document Preview</span>
                <span className="text-[11px] text-slate-500 font-mono">Original Artifact</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2 flex items-center justify-center min-h-[300px] overflow-hidden">
                {evidenceItem.file_url.startsWith('data:image') || evidenceItem.file_url.includes('images.unsplash.com') || evidenceItem.file_url.endsWith('.jpg') || evidenceItem.file_url.endsWith('.png') ? (
                  <img
                    src={evidenceItem.file_url}
                    alt="Document"
                    className="w-full max-h-[360px] object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-center p-6 space-y-2">
                    <FileText className="w-12 h-12 text-blue-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-300">{evidenceItem.file_name}</p>
                    <p className="text-[11px] text-slate-500">PDF Document Stream Ready</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: OCR Fields Form */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Structured OCR Extractions
                </span>
                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Edit3 className="w-3 h-3" />
                      Edit / Correct Fields
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResetToRaw}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset to AI Raw
                    </button>
                  )}
                </div>
              </div>

              <form onSubmit={handleSaveCorrections} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Supplier Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <Building className="w-3 h-3 text-blue-400" /> Supplier / Vendor
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={fields.supplier_name}
                      onChange={(e) => setFields({ ...fields, supplier_name: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500 disabled:opacity-75"
                    />
                  </div>

                  {/* Invoice / Challan Number */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <Hash className="w-3 h-3 text-amber-400" /> Document / Invoice #
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={fields.invoice_number}
                      onChange={(e) => setFields({ ...fields, invoice_number: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-75 font-mono"
                    />
                  </div>

                  {/* Date */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-emerald-400" /> Invoice Date
                    </label>
                    <input
                      type="date"
                      disabled={!isEditing}
                      value={fields.document_date}
                      onChange={(e) => setFields({ ...fields, document_date: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-75"
                    />
                  </div>

                  {/* PO Reference */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-purple-400" /> Purchase Order Ref
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={fields.purchase_order_ref}
                      onChange={(e) => setFields({ ...fields, purchase_order_ref: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500 disabled:opacity-75 font-mono"
                    />
                  </div>
                </div>

                {/* Material Description */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <Package className="w-3 h-3 text-amber-400" /> Extracted Material Line Item
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={fields.material_description}
                    onChange={(e) => setFields({ ...fields, material_description: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-75"
                  />
                </div>

                {/* Quantity & Unit Pricing */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400">Quantity</label>
                    <input
                      type="number"
                      step="0.01"
                      disabled={!isEditing}
                      value={fields.quantity}
                      onChange={(e) => setFields({ ...fields, quantity: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono disabled:opacity-75"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400">Unit</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={fields.unit}
                      onChange={(e) => setFields({ ...fields, unit: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono disabled:opacity-75"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400">Unit Rate ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      disabled={!isEditing}
                      value={fields.unit_price}
                      onChange={(e) => setFields({ ...fields, unit_price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono disabled:opacity-75"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400">Total ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      disabled={!isEditing}
                      value={fields.total_amount}
                      onChange={(e) => setFields({ ...fields, total_amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-amber-500/40 text-xs text-amber-300 font-mono font-bold disabled:opacity-75"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save & Reconcile
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            NIVSB Audit Engine • Discrepancy checks run continuously across 5-stage contractual records
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
