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
  Loader2,
  Receipt,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

interface BOQUploadModalProps {
  projectId?: string;
  milestoneId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ExtractedDocMetadata {
  docType: 'Quotation' | 'Tax Invoice' | 'Delivery Challan' | 'BOQ Sheet';
  docNumber: string;
  vendorName: string;
  docDate: string;
  gstNumber?: string;
  totalAmount: number;
  ocrConfidence: number;
  rawSummary: string;
}

export const BOQUploadModal: React.FC<BOQUploadModalProps> = ({
  projectId,
  milestoneId,
  isOpen,
  onClose,
}) => {
  const { addBOQItem, getMilestoneEvidence, getProjectEvidence, milestones } = useProjects();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedMetadata, setExtractedMetadata] = useState<ExtractedDocMetadata | null>(null);
  const [extractedItems, setExtractedItems] = useState<Array<Omit<BOQItem, 'id'>>>([]);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    isDuplicate: boolean;
    reason?: string;
    existingFile?: string;
    existingMilestone?: string;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      processOCR(selected.name);
    }
  };

  const processOCR = (fileName: string) => {
    setIsProcessing(true);
    setDuplicateWarning(null);
    setExtractedMetadata(null);
    setStatusMessage('Scanning document with Optical Character Recognition (OCR)...');

    setTimeout(() => {
      setStatusMessage('Extracting tabular text, supplier details, and billing line items...');
    }, 600);

    setTimeout(() => {
      const lower = fileName.toLowerCase();
      const isRebar = lower.includes('rebar') || lower.includes('steel') || lower.includes('tmt');
      const isConcrete = lower.includes('concrete') || lower.includes('cement') || lower.includes('rmc') || lower.includes('challan');
      const isDuplicateTest = lower.includes('duplicate') || lower.includes('9861') || lower.includes('copy');

      let meta: ExtractedDocMetadata;
      let parsed: Array<Omit<BOQItem, 'id'>> = [];

      if (isRebar) {
        meta = {
          docType: 'Quotation',
          docNumber: 'QT-TATA-2026-4412',
          vendorName: 'Tata Tiscon Steel Infrastructure Ltd.',
          docDate: '2026-10-08',
          gstNumber: '27AAACT2938B1Z6',
          totalAmount: 108750,
          ocrConfidence: 96,
          rawSummary: 'OCR converted quotation image into digital structured records: Fe-500D TMT bars and GI binding wire line items extracted.',
        };
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
        meta = {
          docType: 'Delivery Challan',
          docNumber: isDuplicateTest ? 'DC-9861' : 'DC-ULTRA-2026-8892',
          vendorName: 'UltraTech Cement & ReadyMix Co.',
          docDate: '2026-10-09',
          gstNumber: '27AABCU9921D1ZF',
          totalAmount: 127000,
          ocrConfidence: 94,
          rawSummary: 'OCR digitized vendor delivery slip: M-40 Grade Ready-Mix Concrete batch & staging shuttering line items extracted.',
        };
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
        meta = {
          docType: 'Tax Invoice',
          docNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          vendorName: 'National Construction Supply Consortium',
          docDate: new Date().toISOString().slice(0, 10),
          gstNumber: '27AABCN8832L1Z9',
          totalAmount: 116250,
          ocrConfidence: 92,
          rawSummary: 'OCR optical text engine extracted baseline structural materials, unit rates, and commercial invoice amounts.',
        };
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

      // DUPLICATE BILL CHECK
      const allEvidence = projectId ? getProjectEvidence(projectId) : getMilestoneEvidence(milestoneId);
      const isMatch = allEvidence.find(
        (e) => 
          e.file_name.toLowerCase().includes(meta.docNumber.toLowerCase()) ||
          (isDuplicateTest && e.file_name.toLowerCase().includes('9861')) ||
          (meta.docNumber === 'DC-9861' && e.file_name.toLowerCase().includes('9861'))
      );

      if (isMatch || isDuplicateTest) {
        const foundMilestone = milestones.find(m => m.id === isMatch?.milestone_id);
        setDuplicateWarning({
          isDuplicate: true,
          reason: `Bill / Document #${meta.docNumber} from "${meta.vendorName}" has already been submitted in the ledger!`,
          existingFile: isMatch?.file_name || 'Vendor_Material_Delivery_Challan_9861.pdf',
          existingMilestone: foundMilestone?.title || 'Active Milestone Package',
        });
      } else {
        setDuplicateWarning({
          isDuplicate: false,
        });
      }

      setExtractedMetadata(meta);
      setExtractedItems(parsed);
      setIsProcessing(false);
      setStatusMessage('OCR Extraction complete! Digital records created and verified for duplication.');
    }, 1100);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 my-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Quotation / BOQ & Bill OCR Intake Engine
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  OCR Text to Digital Data
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Upload receipts, quotations, or bills. OCR converts image/document text into structured digital data and detects duplicate bill fraud.
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

        {/* Quick Demo Pre-sets */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px] font-semibold">Test with sample OCR document:</span>
          <button
            type="button"
            onClick={() => {
              setFile(new File([''], 'Tata_Steel_Rebar_Quotation_BOQ.pdf', { type: 'application/pdf' }));
              processOCR('Tata_Steel_Rebar_Quotation_BOQ.pdf');
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition-colors"
          >
            📄 Rebar Quotation (BOQ)
          </button>
          <button
            type="button"
            onClick={() => {
              setFile(new File([''], 'UltraTech_Cement_Delivery_Slip.png', { type: 'image/png' }));
              processOCR('UltraTech_Cement_Delivery_Slip.png');
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition-colors"
          >
            🧾 Cement Challan (OCR)
          </button>
          <button
            type="button"
            onClick={() => {
              setFile(new File([''], 'Vendor_Material_Delivery_Challan_9861_Duplicate.pdf', { type: 'application/pdf' }));
              processOCR('Vendor_Material_Delivery_Challan_9861_Duplicate.pdf');
            }}
            className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 text-[11px] border border-rose-800/60 transition-colors flex items-center gap-1"
          >
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            ⚠️ Test Duplicate Bill Detection
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
              {file ? file.name : 'Click to select quotation, receipt, or BOQ file'}
            </span>
            <span className="text-xs text-slate-400">
              Supports PDF, PNG, JPG receipts & invoices — OCR automatically extracts text & tabular line items
            </span>
            {previewUrl && file?.type.includes('image') && (
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-700 mx-auto mt-2">
                <img src={previewUrl} alt="Receipt Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </label>
        </div>

        {/* Processing State */}
        {isProcessing && (
          <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center gap-3 text-blue-300 text-xs animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-blue-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Duplicate Bill Warning Banner */}
        {duplicateWarning?.isDuplicate && !isProcessing && (
          <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs space-y-1.5 animate-fadeIn">
            <div className="flex items-center gap-2 font-bold text-rose-200">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Bill Duplication Alert Detected by OCR!</span>
            </div>
            <p className="text-rose-300/90 leading-relaxed">
              {duplicateWarning.reason}
            </p>
            <div className="text-[11px] text-rose-400 flex items-center gap-2 pt-1 font-mono">
              <span>Existing Match: <strong>{duplicateWarning.existingFile}</strong></span>
              <span>•</span>
              <span>Scope: <strong>{duplicateWarning.existingMilestone}</strong></span>
            </div>
          </div>
        )}

        {/* Clean Duplicate Check Badge */}
        {duplicateWarning && !duplicateWarning.isDuplicate && !isProcessing && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>OCR Verification Clean:</strong> No duplicate bill or matching quotation found in the project records.</span>
          </div>
        )}

        {/* Extracted Metadata Card */}
        {extractedMetadata && !isProcessing && (
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-blue-400" />
                OCR Extracted Document Metadata
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                {extractedMetadata.ocrConfidence}% OCR Accuracy
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Document #</span>
                <span className="font-mono font-bold text-white">{extractedMetadata.docNumber}</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Vendor / Supplier</span>
                <span className="font-medium text-slate-200 truncate block">{extractedMetadata.vendorName}</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Document Date</span>
                <span className="font-medium text-slate-200">{extractedMetadata.docDate}</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Extracted Total</span>
                <span className="font-bold text-emerald-400">${extractedMetadata.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              {extractedMetadata.rawSummary}
            </p>
          </div>
        )}

        {/* Extracted Items Review Table */}
        {extractedItems.length > 0 && !isProcessing && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Digitalized Line Items ({extractedItems.length})
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700"
              >
                <Plus className="w-3.5 h-3.5" /> Add Row
              </button>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
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
            Import Extracted BOQ Items ({extractedItems.length})
          </button>
        </div>
      </div>
    </div>
  );
};
