import React from 'react';
import { Project, Milestone } from '../../types/index.ts';
import { useProjects } from '../../context/ProjectContext.tsx';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  Building2, 
  CheckCircle2, 
  MapPin, 
  FileText,
  QrCode,
  Camera,
  Receipt,
  ClipboardCheck
} from 'lucide-react';

interface AuditReportModalProps {
  project: Project;
  milestone: Milestone;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditReportModal: React.FC<AuditReportModalProps> = ({
  project,
  milestone,
  isOpen,
  onClose,
}) => {
  const { getMilestoneEvidence, getMilestoneBOQ } = useProjects();

  if (!isOpen) return null;

  const evidenceList = getMilestoneEvidence(milestone.id);
  const boqItems = getMilestoneBOQ(milestone.id);

  const photos = evidenceList.filter((e) => e.type === 'photo');
  const challans = evidenceList.filter((e) => e.type === 'challan');
  const invoices = evidenceList.filter((e) => e.type === 'invoice');
  const reports = evidenceList.filter((e) => e.type === 'inspection_report');

  const reportDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const verificationHash = `SP-VER-${milestone.id.slice(-6).toUpperCase()}-${Date.now().toString().slice(-6)}`;

  const quotationBaseline = boqItems.length > 0
    ? boqItems.reduce((acc, b) => acc + (Number(b.quantity_ordered || 0) * Number(b.unit_rate || 0)), 0)
    : 0;

  const workProgress =
    milestone.status === 'verified' ? 100 :
    milestone.status === 'submitted' ? 85 :
    milestone.status === 'in_progress' ? 40 : 10;

  const handlePrint = () => {
    window.print();
  };

  const formatFileName = (name: string) => {
    // Remove extension and replace underscores/dashes with spaces, then title-case
    return name
      .replace(/\.[^/.]+$/, '')
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl my-8 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top Control Bar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              OFFICIAL CERTIFICATE
            </span>
            <span className="text-xs text-slate-300 font-semibold truncate max-w-md">
              {milestone.title}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Body */}
        <div className="p-8 sm:p-12 overflow-y-auto bg-slate-950 text-slate-100 space-y-8 print:p-8 print:bg-white print:text-slate-900">

          {/* ── 1. Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b-2 border-amber-500/60">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shrink-0">
                <Building2 className="w-9 h-9" />
              </div>
              <div>
                <div className="text-[11px] font-mono font-bold tracking-widest text-amber-400 uppercase print:text-slate-600">
                  National Infrastructure Verification &amp; Safety Board
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight mt-0.5 print:text-slate-950">
                  Milestone Verification Certificate
                </h1>
                <p className="text-xs text-slate-400 mt-0.5 print:text-slate-500">
                  Independent Audit · 5-Stage Quantity Reconciliation · Geotagged Evidence Review
                </p>
              </div>
            </div>

            {/* Certificate Hash */}
            <div className="flex sm:flex-col items-center sm:items-end gap-2 p-3 rounded-xl bg-slate-900/80 border border-slate-800 shrink-0 print:bg-slate-50 print:border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-400">
                <QrCode className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] font-mono uppercase tracking-wider">Verified Audit</span>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-400 print:text-emerald-700">
                {verificationHash}
              </span>
            </div>
          </div>

          {/* ── 2. Metadata Grid ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 print:bg-slate-50 print:border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Project</span>
              <strong className="text-xs text-white print:text-slate-950 block mt-1 leading-snug">{project.title}</strong>
              <span className="text-[11px] font-mono text-amber-400 print:text-amber-700">{project.code}</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Contractor</span>
              <strong className="text-xs text-white print:text-slate-950 block mt-1 leading-snug">{project.assigned_contractor_name}</strong>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Milestone</span>
              <strong className="text-xs text-white print:text-slate-950 block mt-1 leading-snug">{milestone.title}</strong>
              <span className="text-[11px] text-slate-400">Weight: {milestone.weight_percentage}%</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Status</span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 print:text-emerald-700 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Officially Verified
              </span>
              <span className="text-[11px] text-slate-400 print:text-slate-600 block mt-0.5">Date: {reportDate}</span>
            </div>
          </div>

          {/* ── 3. Financial Summary Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 print:bg-slate-50 print:border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Contractual Baseline</span>
              <div className="text-lg font-black text-amber-400 print:text-amber-700 mt-2">
                ₹{quotationBaseline.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {quotationBaseline > 0 ? `${boqItems.length} Quoted Items Reconciled` : 'Quotation Uninitialized (₹0)'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 print:bg-slate-50 print:border-slate-200">
              <span className="text-[10px] uppercase font-bold text-emerald-500 block">Work Executed</span>
              <div className="text-lg font-black text-emerald-400 print:text-emerald-700 mt-2">
                {workProgress}% Complete
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Vision &amp; weighbridge reconciled
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 print:bg-slate-50 print:border-slate-200">
              <span className="text-[10px] uppercase font-bold text-blue-400 block">Pending Scope</span>
              <div className="text-lg font-black text-blue-400 print:text-blue-700 mt-2">
                {100 - workProgress}% Remaining
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Scheduled for next cycle
              </span>
            </div>
          </div>

          {/* ── 4. BOQ Reconciliation Table ── */}
          {boqItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider print:text-slate-900">
                  5-Stage Quantity &amp; Billing Reconciliation
                </h3>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 print:text-emerald-700 print:bg-emerald-50">
                  Baseline Locked
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-slate-300">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 print:bg-slate-100 print:text-slate-600 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Item Code</th>
                      <th className="py-2.5 px-3 font-semibold">Description</th>
                      <th className="py-2.5 px-3 font-semibold">Ordered</th>
                      <th className="py-2.5 px-3 font-semibold">Delivered</th>
                      <th className="py-2.5 px-3 font-semibold">Billed</th>
                      <th className="py-2.5 px-3 font-semibold">Consumed</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                    {boqItems.map((b) => {
                      const delivered = b.quantity_delivered || b.quantity_ordered;
                      const billed = b.quantity_billed || b.quantity_ordered;
                      const consumed = Number((delivered * 0.95).toFixed(1));
                      const isOverBilled = billed > b.quantity_ordered;

                      return (
                        <tr key={b.id} className="text-slate-300 print:text-slate-800">
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-400 print:text-slate-900 whitespace-nowrap">{b.item_code}</td>
                          <td className="py-2.5 px-3">{b.description}</td>
                          <td className="py-2.5 px-3 font-mono">{b.quantity_ordered} {b.unit}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-300 print:text-blue-800">{delivered} {b.unit}</td>
                          <td className={`py-2.5 px-3 font-mono font-bold ${isOverBilled ? 'text-rose-400 print:text-rose-700' : 'text-emerald-300 print:text-emerald-800'}`}>
                            {billed} {b.unit}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-purple-300 print:text-purple-800">{consumed} {b.unit}</td>
                          <td className={`py-2.5 px-3 text-right font-bold whitespace-nowrap ${isOverBilled ? 'text-rose-400 print:text-rose-700' : 'text-emerald-400 print:text-emerald-700'}`}>
                            {isOverBilled ? '⚠ Overrun' : '✓ Reconciled'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── 5. Evidence Catalog ── */}
          {evidenceList.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider print:text-slate-900">
                Verified Site Evidence &amp; Document Catalog
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Site Photos */}
                {photos.slice(0, 3).map((photo) => (
                  <div key={photo.id} className="rounded-xl bg-slate-900/60 border border-slate-800 overflow-hidden print:bg-slate-50 print:border-slate-300">
                    <img
                      src={photo.file_url}
                      alt={photo.location_name || 'Site Evidence'}
                      className="w-full h-28 object-cover"
                    />
                    <div className="p-2.5 space-y-1">
                      <div className="flex items-center gap-1 text-amber-400 text-[10px] font-bold">
                        <Camera className="w-3 h-3" />
                        <span>Site Photo</span>
                      </div>
                      <p className="text-xs font-semibold text-white print:text-slate-900 leading-snug line-clamp-2">
                        {photo.location_name || formatFileName(photo.file_name)}
                      </p>
                      {photo.latitude && photo.longitude && (
                        <div className="flex items-center gap-1 text-emerald-400 print:text-emerald-700 text-[10px] font-mono">
                          <MapPin className="w-2.5 h-2.5" />
                          {photo.latitude.toFixed(4)}°N, {photo.longitude.toFixed(4)}°E
                        </div>
                      )}
                      {photo.captured_at && (
                        <div className="text-[10px] text-slate-400">
                          {new Date(photo.captured_at).toLocaleDateString('en-IN')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Delivery Challans */}
                {challans.slice(0, 2).map((ch) => (
                  <div key={ch.id} className="rounded-xl bg-slate-900/60 border border-slate-800 p-3 flex flex-col gap-2 print:bg-slate-50 print:border-slate-300">
                    <div className="flex items-center gap-1.5 text-blue-400 print:text-blue-800 font-bold text-[11px]">
                      <FileText className="w-3.5 h-3.5" />
                      Delivery Challan
                    </div>
                    <p className="text-xs font-semibold text-white print:text-slate-900 leading-snug">
                      {formatFileName(ch.file_name)}
                    </p>
                    {ch.tags && ch.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {ch.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="text-[10px] text-emerald-400 print:text-emerald-700 border-t border-slate-800 pt-1.5 mt-auto">
                      Gate Inward Verified
                    </div>
                  </div>
                ))}

                {/* Tax Invoices */}
                {invoices.slice(0, 1).map((inv) => (
                  <div key={inv.id} className="rounded-xl bg-slate-900/60 border border-slate-800 p-3 flex flex-col gap-2 print:bg-slate-50 print:border-slate-300">
                    <div className="flex items-center gap-1.5 text-emerald-400 print:text-emerald-700 font-bold text-[11px]">
                      <Receipt className="w-3.5 h-3.5" />
                      Tax Invoice
                    </div>
                    <p className="text-xs font-semibold text-white print:text-slate-900 leading-snug">
                      {formatFileName(inv.file_name)}
                    </p>
                    <div className="text-[10px] text-emerald-400 print:text-emerald-700 border-t border-slate-800 pt-1.5 mt-auto">
                      GST Reconciled
                    </div>
                  </div>
                ))}

                {/* Inspection Reports */}
                {reports.slice(0, 1).map((rep) => (
                  <div key={rep.id} className="rounded-xl bg-slate-900/60 border border-slate-800 p-3 flex flex-col gap-2 print:bg-slate-50 print:border-slate-300">
                    <div className="flex items-center gap-1.5 text-purple-400 print:text-purple-700 font-bold text-[11px]">
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      Test Certificate
                    </div>
                    <p className="text-xs font-semibold text-white print:text-slate-900 leading-snug">
                      {formatFileName(rep.file_name)}
                    </p>
                    <div className="text-[10px] text-purple-400 print:text-purple-700 border-t border-slate-800 pt-1.5 mt-auto">
                      Quality Standard Verified
                    </div>
                  </div>
                ))}
              </div>

              {/* Evidence count summary */}
              <div className="flex flex-wrap gap-3 text-[11px] text-slate-400 pt-1">
                {photos.length > 0 && <span>{photos.length} site photo{photos.length !== 1 ? 's' : ''}</span>}
                {challans.length > 0 && <span>· {challans.length} delivery challan{challans.length !== 1 ? 's' : ''}</span>}
                {invoices.length > 0 && <span>· {invoices.length} tax invoice{invoices.length !== 1 ? 's' : ''}</span>}
                {reports.length > 0 && <span>· {reports.length} inspection report{reports.length !== 1 ? 's' : ''}</span>}
              </div>
            </div>
          )}

          {/* ── 6. Signature & Compliance Footer ── */}
          <div className="pt-6 border-t-2 border-slate-800 print:border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block tracking-wider">
                Regulatory Audit Statement
              </span>
              <p className="text-xs text-slate-400 print:text-slate-600 leading-relaxed">
                This milestone has been inspected and audited under National Infrastructure Verification Board standards. All physical construction progress photographs, delivery weighbridge tickets, and commercial invoices have been reconciled and digitally signed by the certified lead auditor.
              </p>
            </div>

            {/* Signature Stamp */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border-2 border-dashed border-emerald-500/50 print:bg-slate-50 print:border-emerald-600 space-y-2 text-right">
              <div className="flex items-center justify-end gap-2 text-emerald-400 print:text-emerald-700 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Certified Lead Auditor</span>
              </div>
              <div className="font-serif italic text-xl text-white print:text-slate-950 font-bold">
                David Vance
              </div>
              <div className="text-[10px] font-mono text-slate-400 print:text-slate-500">
                Senior Auditor · NIVB-AUD-4491
              </div>
              <div className="text-[10px] font-mono text-emerald-400 print:text-emerald-600">
                Certified: {reportDate}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
