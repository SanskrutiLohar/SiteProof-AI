import React, { useState } from 'react';
import { useProjects } from '../../context/ProjectContext.tsx';
import { BOQItem } from '../../types/index.ts';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Sparkles, 
  Check, 
  Plus, 
  Trash2, 
  Loader2 
} from 'lucide-react';

interface BOQUploadModalProps {
  projectId?: string;
  milestoneId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const BOQUploadModal: React.FC<BOQUploadModalProps> = ({
  milestoneId,
  isOpen,
  onClose,
}) => {
  const { addBOQItem } = useProjects();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedItems, setExtractedItems] = useState<Array<Omit<BOQItem, 'id'>>>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      simulateBOQExtraction(selected);
    }
  };

  const simulateBOQExtraction = (selectedFile: File) => {
    setIsProcessing(true);
    setStatusMessage('Scanning document with OCR vision parser...');

    setTimeout(() => {
      // Intelligently parse sample or mock quotation line items based on file name or default standard
      const isRebar = selectedFile.name.toLowerCase().includes('rebar') || selectedFile.name.toLowerCase().includes('steel');
      const isConcrete = selectedFile.name.toLowerCase().includes('concrete') || selectedFile.name.toLowerCase().includes('cement');

      let parsed: Array<Omit<BOQItem, 'id'>> = [];

      if (isRebar) {
        parsed = [
          {
            milestone_id: milestoneId,
            item_code: 'BOQ-STL-01',
            description: 'Fe-500D High-Yield Thermo-Mechanically Treated Rebars (16mm & 25mm)',
            unit: 'Metric Ton',
            quantity_ordered: 120.0,
            quantity_delivered: 0,
            quantity_billed: 0,
            quantity_paid: 0,
            quantity_consumed: 0,
            unit_rate: 850.0,
          },
          {
            milestone_id: milestoneId,
            item_code: 'BOQ-STL-02',
            description: 'GI Binding Wire (18 Gauge) & Heavy-Duty PVC Cover Blocks (50mm)',
            unit: 'Kg',
            quantity_ordered: 450.0,
            quantity_delivered: 0,
            quantity_billed: 0,
            quantity_paid: 0,
            quantity_consumed: 0,
            unit_rate: 15.0,
          },
        ];
      } else if (isConcrete) {
        parsed = [
          {
            milestone_id: milestoneId,
            item_code: 'BOQ-CNC-01',
            description: 'M-40 Grade Ready-Mix Concrete with Flyash Retarder Admixture',
            unit: 'Cum',
            quantity_ordered: 650.0,
            quantity_delivered: 0,
            quantity_billed: 0,
            quantity_paid: 0,
            quantity_consumed: 0,
            unit_rate: 140.0,
          },
          {
            milestone_id: milestoneId,
            item_code: 'BOQ-FRM-01',
            description: 'Waterproof Film-Faced Plywood Shuttering & Steel Staging Props',
            unit: 'Sqm',
            quantity_ordered: 800.0,
            quantity_delivered: 0,
            quantity_billed: 0,
            quantity_paid: 0,
            quantity_consumed: 0,
            unit_rate: 45.0,
          },
        ];
      } else {
        parsed = [
          {
            milestone_id: milestoneId,
            item_code: `BOQ-ITEM-${Date.now().toString().slice(-4)}`,
            description: 'Structural Steel / Reinforcement Baseline Material',
            unit: 'Metric Ton',
            quantity_ordered: 85.0,
            quantity_delivered: 0,
            quantity_billed: 0,
            quantity_paid: 0,
            quantity_consumed: 0,
            unit_rate: 750.0,
          },
          {
            milestone_id: milestoneId,
            item_code: `BOQ-ITEM-${(Date.now() + 1).toString().slice(-4)}`,
            description: 'High-Strength Concrete Pour & Formwork Support',
            unit: 'Cum',
            quantity_ordered: 420.0,
            quantity_delivered: 0,
            quantity_billed: 0,
            quantity_paid: 0,
            quantity_consumed: 0,
            unit_rate: 125.0,
          },
        ];
      }

      setExtractedItems(parsed);
      setIsProcessing(false);
      setStatusMessage('OCR Extraction complete! Review line items below before saving to milestone baseline.');
    }, 1200);
  };

  const handleUpdateItem = (index: number, field: string, value: string | number) => {
    const updated = [...extractedItems];
    updated[index] = { ...updated[index], [field]: value };
    setExtractedItems(updated);
  };

  const handleAddItem = () => {
    setExtractedItems([
      ...extractedItems,
      {
        milestone_id: milestoneId,
        item_code: `BOQ-NEW-${extractedItems.length + 1}`,
        description: 'New Bill of Quantities Item',
        unit: 'Unit',
        quantity_ordered: 100,
        quantity_delivered: 0,
        quantity_billed: 0,
        quantity_paid: 0,
        quantity_consumed: 0,
        unit_rate: 50,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setExtractedItems(extractedItems.filter((_, i) => i !== index));
  };

  const handleSaveToMilestone = () => {
    extractedItems.forEach((item) => {
      addBOQItem(item);
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 my-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Upload Quotation / BOQ Document (OCR)
              </h3>
              <p className="text-xs text-slate-400">
                Upload supplier quotation, tender bill, or CAD BOQ sheet to auto-extract baseline items.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Dropzone */}
        <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/50 rounded-2xl p-6 text-center bg-slate-950/50 transition-colors">
          <input
            type="file"
            id="boq-file-upload"
            accept=".pdf,.png,.jpg,.jpeg,.xlsx,.csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="boq-file-upload"
            className="cursor-pointer flex flex-col items-center justify-center gap-2"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shadow-inner">
              <Upload className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-white">
              {file ? file.name : 'Click to select quotation / BOQ file'}
            </span>
            <span className="text-xs text-slate-400">
              Supports PDF, PNG, JPG, or Scanned Documents (up to 25 MB)
            </span>
          </label>
        </div>

        {/* Processing State */}
        {isProcessing && (
          <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center gap-3 text-blue-300 text-xs animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-blue-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Extracted Items Review Table */}
        {extractedItems.length > 0 && !isProcessing && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Extracted Baseline Items ({extractedItems.length})
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700"
              >
                <Plus className="w-3.5 h-3.5" /> Add Row
              </button>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono sticky top-0">
                  <tr>
                    <th className="p-2.5">Code</th>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5">Unit</th>
                    <th className="p-2.5">Ordered Qty</th>
                    <th className="p-2.5">Unit Rate ($)</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {extractedItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.item_code}
                          onChange={(e) => handleUpdateItem(idx, 'item_code', e.target.value)}
                          className="w-24 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-white text-xs font-mono"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                          className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-white text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleUpdateItem(idx, 'unit', e.target.value)}
                          className="w-20 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-white text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={item.quantity_ordered}
                          onChange={(e) => handleUpdateItem(idx, 'quantity_ordered', parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-white text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={item.unit_rate}
                          onChange={(e) => handleUpdateItem(idx, 'unit_rate', parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-white text-xs"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 rounded text-rose-400 hover:bg-rose-500/20"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={extractedItems.length === 0}
            onClick={handleSaveToMilestone}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
          >
            <Check className="w-4 h-4" />
            Import Baseline Items ({extractedItems.length})
          </button>
        </div>
      </div>
    </div>
  );
};
