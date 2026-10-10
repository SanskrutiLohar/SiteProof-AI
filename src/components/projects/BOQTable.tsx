import React from 'react';
import { BOQItem } from '../../types/index.ts';
import { Layers, AlertCircle, CheckCircle2 } from 'lucide-react';

interface BOQTableProps {
  items: BOQItem[];
  showReconciliation?: boolean;
}

export const BOQTable: React.FC<BOQTableProps> = ({ items, showReconciliation = false }) => {
  if (items.length === 0) {
    return (
      <div className="p-8 text-center glass-panel rounded-xl border border-slate-800">
        <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-xs text-slate-400">No Bill of Quantities (BOQ) line items defined for this milestone.</p>
      </div>
    );
  }

  const totalValue = items.reduce((acc, item) => acc + (item.quantity_ordered * item.unit_rate), 0);

  return (
    <div className="overflow-hidden rounded-xl glass-panel border border-slate-800">
      <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Bill of Quantities (BOQ) Baseline
          </h3>
        </div>
        <div className="text-xs text-slate-400">
          Target Value: <span className="font-bold text-white">₹{totalValue.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-4 py-3 font-semibold">Item Code</th>
              <th className="px-4 py-3 font-semibold">Description</th>
              <th className="px-4 py-3 font-semibold text-right">Unit Rate</th>
              <th className="px-4 py-3 font-semibold text-right">Ordered Qty</th>
              {showReconciliation && (
                <>
                  <th className="px-4 py-3 font-semibold text-right text-emerald-400">Delivered</th>
                  <th className="px-4 py-3 font-semibold text-right text-blue-400">Billed</th>
                  <th className="px-4 py-3 font-semibold text-right text-amber-400">Consumed</th>
                  <th className="px-4 py-3 font-semibold text-center">Status</th>
                </>
              )}
              <th className="px-4 py-3 font-semibold text-right">Total (INR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {items.map((item) => {
              const itemTotal = item.quantity_ordered * item.unit_rate;
              const hasDelivered = (item.quantity_delivered || 0) > 0;
              const isOverBilled = (item.quantity_billed || 0) > (item.quantity_delivered || 0);

              return (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-[11px] text-blue-400">
                    {item.item_code}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-200 max-w-xs truncate">
                    {item.description}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-400">
                    ₹{item.unit_rate.toLocaleString('en-IN')} / {item.unit}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-white">
                    {item.quantity_ordered.toLocaleString('en-IN')} <span className="text-[10px] font-normal text-slate-400">{item.unit}</span>
                  </td>
                  {showReconciliation && (
                    <>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-400">
                        {(item.quantity_delivered || 0).toLocaleString('en-IN')} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-blue-400">
                        {(item.quantity_billed || 0).toLocaleString('en-IN')} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-amber-400">
                        {(item.quantity_consumed || 0).toLocaleString('en-IN')} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isOverBilled ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <AlertCircle className="w-3 h-3" /> Flagged
                          </span>
                        ) : hasDelivered ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Aligned
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">Pending</span>
                        )}
                      </td>
                    </>
                  )}
                  <td className="px-4 py-3 text-right font-semibold text-slate-100">
                    ₹{itemTotal.toLocaleString('en-IN')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
