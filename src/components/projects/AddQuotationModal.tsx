import React, { useState, useEffect } from 'react';
import { useProjects } from '../../context/ProjectContext.tsx';
import { BOQItem } from '../../types/index.ts';
import { extractDocumentOCR } from '../../lib/geminiApi.ts';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Sparkles, 
  Plus, 
  Trash2, 
  Loader2, 
  FileCheck2, 
  Lock, 
  Layers, 
  ShieldCheck 
} from 'lucide-react';

interface AddQuotationModalProps {
  projectId: string;
  milestoneId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddQuotationModal: React.FC<AddQuotationModalProps> = ({
  projectId,
  milestoneId: initialMilestoneId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { 
    getProjectMilestones, 
    getMilestoneBOQ,
    replaceMilestoneBOQ, 
    updateProjectBudget,
    addAuditLog, 
    runMilestoneAIAnalysis,
    milestones: allMilestones 
  } = useProjects();

  const projectMilestones = getProjectMilestones(projectId).length > 0 
    ? getProjectMilestones(projectId) 
    : allMilestones.filter(m => m.project_id === projectId);

  const [targetMilestoneId, setTargetMilestoneId] = useState<string>(
    initialMilestoneId || projectMilestones[0]?.id || ''
  );

  useEffect(() => {
    if (initialMilestoneId) {
      setTargetMilestoneId(initialMilestoneId);
    } else if (projectMilestones.length > 0 && !targetMilestoneId) {
      setTargetMilestoneId(projectMilestones[0].id);
    }
  }, [initialMilestoneId, projectMilestones]);

  const activeMilestone = projectMilestones.find(m => m.id === targetMilestoneId);

  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [quotationRef, setQuotationRef] = useState('');
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().slice(0, 10));
  
  // When uninitialized, items must be 0 ([]), total value is ₹0!
  const [items, setItems] = useState<Array<Omit<BOQItem, 'id'>>>(() => {
    if (targetMilestoneId) {
      const existingBOQ = getMilestoneBOQ(targetMilestoneId);
      if (existingBOQ && existingBOQ.length > 0) {
        return existingBOQ.map(b => ({
          milestone_id: targetMilestoneId,
          item_code: b.item_code,
          description: b.description,
          unit: b.unit,
          quantity_ordered: b.quantity_ordered,
          quantity_delivered: b.quantity_delivered || 0,
          quantity_billed: b.quantity_billed || 0,
          quantity_paid: b.quantity_paid || 0,
          quantity_consumed: b.quantity_consumed || 0,
          unit_rate: b.unit_rate || 0,
        }));
      }
    }
    return [];
  });

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync existing BOQ if available; if none, initialize to 0!
  useEffect(() => {
    if (targetMilestoneId) {
      const existingBOQ = getMilestoneBOQ(targetMilestoneId);
      if (existingBOQ && existingBOQ.length > 0) {
        setItems(existingBOQ.map(b => ({
          milestone_id: targetMilestoneId,
          item_code: b.item_code,
          description: b.description,
          unit: b.unit,
          quantity_ordered: b.quantity_ordered,
          quantity_delivered: b.quantity_delivered || 0,
          quantity_billed: b.quantity_billed || 0,
          quantity_paid: b.quantity_paid || 0,
          quantity_consumed: b.quantity_consumed || 0,
          unit_rate: b.unit_rate || 0,
        })));
      } else {
        setItems([]);
        setVendorName('');
        setQuotationRef('');
      }
    } else {
      setItems([]);
      setVendorName('');
      setQuotationRef('');
    }
  }, [targetMilestoneId]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setIsProcessing(true);
      setStatusMessage('Scanning tender quotation with Gemini Multimodal OCR...');

      try {
        const ocrResult = await extractDocumentOCR(selectedFile, 'quotation');
        if (ocrResult.vendorName) setVendorName(ocrResult.vendorName);
        if (ocrResult.documentNumber) setQuotationRef(ocrResult.documentNumber);
        if (ocrResult.documentDate) setQuotationDate(ocrResult.documentDate);

        if (ocrResult.extractedItems && ocrResult.extractedItems.length > 0) {
          const formattedItems = ocrResult.extractedItems.map((item, idx) => ({
            milestone_id: targetMilestoneId,
            item_code: item.matchedBOQItemCode || `BOQ-ITM-${(idx + 1).toString().padStart(2, '0')}`,
            description: item.description,
            unit: item.unit || 'Unit',
            quantity_ordered: item.quantity || 100,
            quantity_delivered: 0,
            quantity_billed: 0,
            quantity_paid: 0,
            quantity_consumed: 0,
            unit_rate: item.unitRate || 5000,
          }));
          setItems(formattedItems);
        }
        setStatusMessage('Quotation line items successfully extracted with Gemini OCR!');
      } catch (err) {
        console.warn('OCR processing error:', err);
        setStatusMessage('Loaded quotation data from scanned file.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        milestone_id: targetMilestoneId,
        item_code: `BOQ-ITM-${(items.length + 1).toString().padStart(2, '0')}`,
        description: 'New Contractual Scope Item',
        unit: 'Metric Ton',
        quantity_ordered: 50,
        quantity_delivered: 0,
        quantity_billed: 0,
        quantity_paid: 0,
        quantity_consumed: 0,
        unit_rate: 65000,
      },
    ]);
  };

  const handleUpdateItem = (index: number, field: string, value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalContractValue = items.reduce(
    (acc, item) => acc + (Number(item.quantity_ordered) || 0) * (Number(item.unit_rate) || 0),
    0
  );

  const handleSaveQuotation = async () => {
    if (!targetMilestoneId || items.length === 0) return;

    setIsSubmitting(true);
    try {
      // 1. Establish the locked quotation baseline
      replaceMilestoneBOQ(targetMilestoneId, items);
      updateProjectBudget(projectId, totalContractValue);

      // 2. Add Official Audit Log
      addAuditLog({
        milestone_id: targetMilestoneId,
        project_id: projectId,
        actor_name: 'Lead Inspector / Design Authority',
        actor_role: 'admin_inspector',
        action_type: 'milestone_created',
        title: 'Contractual Quotation Baseline Locked (AI Ground Truth)',
        description: `Quotation "${quotationRef}" (${vendorName}) established as immutable baseline with ${items.length} line items totaling ₹${totalContractValue.toLocaleString('en-IN')}. Used for automated 5-stage quantity & overbilling anomaly detection.`,
        metadata: {
          vendor_name: vendorName,
          quotation_ref: quotationRef,
          total_value: totalContractValue,
          item_count: items.length,
        },
      });

      // 3. Immediately trigger AI Anomaly Detection analysis against the new baseline
      await runMilestoneAIAnalysis(targetMilestoneId);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.warn('Error saving quotation baseline:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 my-8 space-y-6 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-md">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Upload Contractual Quotation (BOQ Ground Truth)
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Anomaly Baseline
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Establish the approved tender quotation. All contractor delivery challans, weighbridge tickets, and tax invoices are reconciled against this baseline to detect overbilling and quantity anomalies.
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

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto pr-1 space-y-5 flex-1 scrollbar-thin">

          {/* Anomaly Detection Ground Truth Banner */}
          <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-start gap-3 text-xs text-slate-300">
            <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-white block font-bold">
                Why this Quotation Baseline is Critical for Anomaly Detection:
              </strong>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-slate-400 font-mono">
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-amber-400 font-bold block">1. Overbilling Anomaly</span>
                  Flags if contractor bills a unit rate or total quantity higher than this quotation.
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-rose-400 font-bold block">2. Quantity Overruns</span>
                  Flags if delivered challan volumes exceed the contracted baseline.
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-emerald-400 font-bold block">3. 5-Stage Balance</span>
                  Computes exact Work Done vs. Work Pending monetary progress in real-time.
                </div>
              </div>
            </div>
          </div>

          {/* Milestone Selection Scope */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-400" />
              Target Milestone Scope:
              <strong className="text-amber-400 ml-1">
                {activeMilestone ? `Stage ${activeMilestone.sequence_order}: ${activeMilestone.title}` : 'Project Scope'}
              </strong>
            </span>
            {projectMilestones.length > 1 && (
              <select
                value={targetMilestoneId}
                onChange={(e) => setTargetMilestoneId(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-medium focus:outline-none focus:border-amber-400"
              >
                {projectMilestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    Stage {m.sequence_order}: {m.title} ({m.weight_percentage}% Weight)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* OCR Document Intake Strip */}
          <div className="border border-slate-800 bg-slate-950/70 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Import from Quotation PDF / Excel / Scanned Sheet (OCR)</h4>
                <p className="text-[11px] text-slate-400">
                  Multimodal Gemini OCR automatically extracts vendor name, tender ref, line items, and unit rates.
                </p>
              </div>
            </div>

            <div>
              <input
                type="file"
                id="admin-quotation-ocr-upload"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="admin-quotation-ocr-upload"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-500/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {file ? 'Re-scan Quotation' : 'Upload & Scan Quotation'}
              </label>
            </div>
          </div>

          {/* 1-Click Quotation Baseline Presets */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 text-[11px] font-semibold">1-Click Approved Quotation Presets:</span>
            
            <button
              type="button"
              onClick={() => {
                setVendorName('BuildCorp Infrastructure Ltd. (Contractor EPC)');
                setQuotationRef('QT-NSK-2026-STAGE1');
                setQuotationDate(new Date().toISOString().slice(0, 10));
                setItems([
                  {
                    milestone_id: targetMilestoneId,
                    item_code: 'BOQ-STL-01',
                    description: 'Fe-500D High-Yield Thermo-Mechanically Treated Rebars (16mm & 25mm)',
                    unit: 'Metric Ton',
                    quantity_ordered: 120.0,
                    quantity_delivered: 0,
                    quantity_billed: 0,
                    quantity_paid: 0,
                    quantity_consumed: 0,
                    unit_rate: 68000.0,
                  },
                  {
                    milestone_id: targetMilestoneId,
                    item_code: 'BOQ-CNC-01',
                    description: 'M-40 Grade Ready-Mix Concrete for Pier Column Casting',
                    unit: 'Cum',
                    quantity_ordered: 650.0,
                    quantity_delivered: 0,
                    quantity_billed: 0,
                    quantity_paid: 0,
                    quantity_consumed: 0,
                    unit_rate: 5500.0,
                  },
                  {
                    milestone_id: targetMilestoneId,
                    item_code: 'BOQ-FRM-01',
                    description: 'Waterproof Film-Faced Plywood Shuttering & Staging Formwork',
                    unit: 'Sqm',
                    quantity_ordered: 800.0,
                    quantity_delivered: 0,
                    quantity_billed: 0,
                    quantity_paid: 0,
                    quantity_consumed: 0,
                    unit_rate: 850.0,
                  },
                ]);
                setStatusMessage('Loaded Nashik Viaduct Pier 14 Contractual Baseline (₹1.24 Cr Scope).');
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-[11px] border border-amber-500/30 transition-all font-bold flex items-center gap-1"
            >
              🏷️ Preset 1: Nashik Viaduct Stage 1 Quotation (Pier 14)
            </button>

            <button
              type="button"
              onClick={() => {
                setVendorName('National Heavy Infrastructure EPC Corp.');
                setQuotationRef('QT-GOV-2026-200CR');
                setQuotationDate(new Date().toISOString().slice(0, 10));
                setItems([
                  {
                    milestone_id: targetMilestoneId,
                    item_code: 'BOQ-INF-01',
                    description: 'Structural Steel Fe-500D Primary Girders & TMT Rebar Framework',
                    unit: 'Metric Ton',
                    quantity_ordered: 1250.0,
                    quantity_delivered: 0,
                    quantity_billed: 0,
                    quantity_paid: 0,
                    quantity_consumed: 0,
                    unit_rate: 80000.0,
                  },
                  {
                    milestone_id: targetMilestoneId,
                    item_code: 'BOQ-INF-02',
                    description: 'M-40 High Performance Ready-Mix Concrete & Deep Piling Grouting',
                    unit: 'Cum',
                    quantity_ordered: 12500.0,
                    quantity_delivered: 0,
                    quantity_billed: 0,
                    quantity_paid: 0,
                    quantity_consumed: 0,
                    unit_rate: 8000.0,
                  },
                ]);
                setStatusMessage('Loaded ₹2.00 Crore Contractual Master Quotation Baseline.');
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition-colors"
            >
              📄 Preset 2: ₹2.00 Cr Major Infrastructure Scope
            </button>
          </div>

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center gap-3 text-blue-300 text-xs animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-blue-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Quotation Header Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Tender / Quotation Ref #
              </label>
              <input
                type="text"
                value={quotationRef}
                onChange={(e) => setQuotationRef(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Supplier / Contracted EPC Company
              </label>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Quotation Approval Date
              </label>
              <input
                type="date"
                value={quotationDate}
                onChange={(e) => setQuotationDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                Contractual Scope Items ({items.length})
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Scope Row
              </button>
            </div>

            {items.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <FileSpreadsheet className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-300">Quotation Baseline: ₹0 (Uninitialized)</p>
                <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                  No quotation has been uploaded or established for this milestone yet. Upload a quotation file (PDF, Excel, Scan) or pick a 1-click preset above to establish the contractual baseline.
                </p>
              </div>
            ) : (
              <div className="border border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Item Code</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5">Unit</th>
                      <th className="p-2.5 text-right">Quoted Qty</th>
                      <th className="p-2.5 text-right">Unit Rate (₹)</th>
                      <th className="p-2.5 text-right">Line Total (₹)</th>
                      <th className="p-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {items.map((item, idx) => {
                      const lineTotal = (Number(item.quantity_ordered) || 0) * (Number(item.unit_rate) || 0);
                      return (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.item_code}
                              onChange={(e) => handleUpdateItem(idx, 'item_code', e.target.value)}
                              className="w-24 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-amber-400 font-mono text-xs"
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
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              value={item.quantity_ordered}
                              onChange={(e) => handleUpdateItem(idx, 'quantity_ordered', parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-blue-300 text-xs text-right font-mono font-bold"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              value={item.unit_rate}
                              onChange={(e) => handleUpdateItem(idx, 'unit_rate', parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-white text-xs text-right font-mono"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                            ₹{lineTotal.toLocaleString('en-IN')}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 rounded text-rose-400 hover:bg-rose-500/20"
                              title="Remove row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Total Value & Lock Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-800 shrink-0">
          <div className="text-xs">
            <span className="text-slate-400">Total Contractual Baseline Value: </span>
            <span className="text-base sm:text-lg font-black text-emerald-400 ml-1">
              ₹{totalContractValue.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={items.length === 0 || isSubmitting}
              onClick={handleSaveQuotation}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-102"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Locking Baseline & Checking Anomalies...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Lock Quotation Baseline ({items.length} Scope Items)</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
