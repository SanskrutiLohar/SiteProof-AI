import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useProjects } from '../../context/ProjectContext.tsx';
import { extractDocumentOCR } from '../../lib/geminiApi.ts';
import { BOQItem } from '../../types/index.ts';
import { 
  X, 
  Building2, 
  MapPin, 
  IndianRupee, 
  HardHat, 
  Plus, 
  Trash2,
  Layers,
  Sparkles,
  UploadCloud,
  FileCheck2,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MilestoneInput {
  title: string;
  description: string;
  target_date: string;
  weight_percentage: number;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose }) => {
  const { profile } = useAuth();
  const { contractors, createProject } = useProjects();

  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [location, setLocation] = useState('');
  const [clientName, setClientName] = useState('');
  // Quotation/Budget is initialized strictly to 0 as requested
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [contractorId, setContractorId] = useState(contractors[0]?.id || '');
  const [description, setDescription] = useState('');

  // Quotation Document / Receipt scanning state
  const [isScanningQuotation, setIsScanningQuotation] = useState(false);
  const [quotationExtractedInfo, setQuotationExtractedInfo] = useState<{
    fileName: string;
    vendorName?: string;
    documentNumber?: string;
    totalAmount: number;
    itemCount: number;
  } | null>(null);
  const [extractedBOQItems, setExtractedBOQItems] = useState<Array<Omit<BOQItem, 'id' | 'milestone_id'>>>([]);

  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    {
      title: 'Milestone 1: Substructure Excavation & Rebar Piling',
      description: 'Excavation to bedrock and pile foundation cage alignment.',
      target_date: '2026-11-30',
      weight_percentage: 40,
    },
    {
      title: 'Milestone 2: Concrete Superstructure Pour & Curing',
      description: 'Main deck slab casting and structural strength testing.',
      target_date: '2027-02-28',
      weight_percentage: 60,
    },
  ]);

  React.useEffect(() => {
    if (!contractorId && contractors.length > 0) {
      setContractorId(contractors[0].id);
    }
  }, [contractors, contractorId]);

  if (!isOpen) return null;

  const handleQuotationFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsScanningQuotation(true);

      try {
        const ocrResult = await extractDocumentOCR(file, 'quotation');
        const extractedAmount = Number(ocrResult.totalAmount) || 0;

        // Auto-update total quotation amount to the fetched document's amount
        setTotalBudget(extractedAmount);

        if (ocrResult.vendorName && !clientName) {
          setClientName(ocrResult.vendorName);
        }

        const items: Array<Omit<BOQItem, 'id' | 'milestone_id'>> = (ocrResult.extractedItems || []).map((item, idx) => ({
          item_code: item.matchedBOQItemCode || `BOQ-ITM-${(idx + 1).toString().padStart(2, '0')}`,
          description: item.description,
          unit: item.unit || 'Unit',
          quantity_ordered: item.quantity || 0,
          quantity_delivered: 0,
          quantity_billed: 0,
          quantity_paid: 0,
          quantity_consumed: 0,
          unit_rate: item.unitRate || 0,
          notes: `Extracted from quotation receipt ${file.name}`,
        }));

        setExtractedBOQItems(items);
        setQuotationExtractedInfo({
          fileName: file.name,
          vendorName: ocrResult.vendorName,
          documentNumber: ocrResult.documentNumber,
          totalAmount: extractedAmount,
          itemCount: items.length,
        });
      } catch (err) {
        console.error('Failed to extract quotation document:', err);
      } finally {
        setIsScanningQuotation(false);
      }
    }
  };

  const handleAddMilestone = () => {
    setMilestones([
      ...milestones,
      {
        title: `Milestone ${milestones.length + 1}: `,
        description: '',
        target_date: new Date(Date.now() + (milestones.length + 1) * 30 * 86400000).toISOString().split('T')[0],
        weight_percentage: 20,
      },
    ]);
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleMilestoneChange = (index: number, field: keyof MilestoneInput, value: string | number) => {
    setMilestones(
      milestones.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProject(
      {
        title,
        code: code || `PROJ-${Date.now().toString().slice(-4)}`,
        location,
        client_name: clientName,
        total_budget: Number(totalBudget),
        assigned_contractor_id: contractorId,
        description,
        created_by: profile?.id || 'demo-inspector-01',
      },
      milestones.map((m, idx) => ({
        title: m.title,
        description: m.description,
        sequence_order: idx + 1,
        weight_percentage: Number(m.weight_percentage),
        target_date: m.target_date,
        status: 'pending',
      })),
      extractedBOQItems
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl glass-panel border border-slate-700/80 shadow-2xl p-6 relative my-8">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Create New Construction Project</h2>
            <p className="text-xs text-slate-400">Define project boundaries, baseline budget in INR (₹), and upload quotation receipt</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1: Upload Quotation Document / Receipt Dropzone */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/70 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                Upload Tender Quotation Document / Receipt
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                Auto-fetches total amount & BOQ
              </span>
            </div>

            <div className="relative border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-xl p-4 text-center transition-all bg-slate-950/50 group">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx,.xls"
                onChange={handleQuotationFileUpload}
                disabled={isScanningQuotation}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
              />
              
              {isScanningQuotation ? (
                <div className="flex flex-col items-center justify-center py-2 space-y-2">
                  <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                  <p className="text-xs font-semibold text-amber-300">
                    Scanning quotation document with Gemini Multimodal OCR...
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Extracting total contract value in INR (₹) and contractual line items
                  </p>
                </div>
              ) : quotationExtractedInfo ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{quotationExtractedInfo.fileName}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-medium">
                          Quotation Fetched
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {quotationExtractedInfo.vendorName ? `Vendor: ${quotationExtractedInfo.vendorName} • ` : ''}
                        {quotationExtractedInfo.itemCount} BOQ items extracted
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Fetched Quotation Amount</span>
                    <span className="text-sm font-black text-emerald-400">
                      ₹{quotationExtractedInfo.totalAmount.toLocaleString('en-IN')} INR
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-2 space-y-1">
                  <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-amber-400 transition-colors" />
                  <p className="text-xs font-semibold text-slate-300">
                    Drop tender quotation receipt or click to upload
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Supports PDF, Invoices, Receipts, Excel, CSV • Amount defaults to ₹0 until uploaded or typed
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Project Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Metro Line 5 Overpass Pier Construction"
                className="w-full px-3 py-2 rounded-lg glass-input text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Project Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. METRO-L5-P08"
                className="w-full px-3 py-2 rounded-lg glass-input text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Quotation / Baseline Budget (₹ INR) *
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-emerald-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  required
                  min="0"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(Number(e.target.value))}
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-2 rounded-lg glass-input text-xs text-white font-bold focus:outline-none focus:border-blue-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {totalBudget === 0 
                  ? 'Uninitialized (₹0) — upload receipt or enter quotation manually' 
                  : `Total: ₹${totalBudget.toLocaleString('en-IN')} INR`}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Location / Site Address *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Sector 18, Expressway Zone, Nashik"
                  className="w-full pl-9 pr-3 py-2 rounded-lg glass-input text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Client / Authority *
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. National Highways Authority of India"
                className="w-full px-3 py-2 rounded-lg glass-input text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Assigned Contractor *
              </label>
              <div className="relative">
                <HardHat className="w-4 h-4 text-amber-500 absolute left-3 top-2.5" />
                <select
                  value={contractorId}
                  onChange={(e) => setContractorId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg glass-input text-xs text-white bg-slate-900 focus:outline-none focus:border-blue-500"
                >
                  {contractors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.organization || c.full_name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Project Scope Summary
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief technical description of construction scope..."
                className="w-full px-3 py-2 rounded-lg glass-input text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Initial Milestones Setup */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Initial Milestone Stages ({milestones.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={handleAddMilestone}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Milestone
              </button>
            </div>

            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {milestones.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 relative"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-blue-400">Stage #{idx + 1}</span>
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMilestone(idx)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    required
                    value={m.title}
                    onChange={(e) => handleMilestoneChange(idx, 'title', e.target.value)}
                    placeholder="Milestone title..."
                    className="w-full px-2.5 py-1.5 rounded-lg glass-input text-xs text-white focus:outline-none focus:border-blue-500"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Target Date</label>
                      <input
                        type="date"
                        required
                        value={m.target_date}
                        onChange={(e) => handleMilestoneChange(idx, 'target_date', e.target.value)}
                        className="w-full px-2.5 py-1 rounded-lg glass-input text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Weight %</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={m.weight_percentage}
                        onChange={(e) => handleMilestoneChange(idx, 'weight_percentage', Number(e.target.value))}
                        className="w-full px-2.5 py-1 rounded-lg glass-input text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-glow-brand transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Create Project & Baseline
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
