/**
 * MUNAFA Mandatory Core Legal Disclaimer
 */

import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-amber-50/90 border-b border-amber-200/80 text-amber-950 text-xs py-2 px-4 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-snug">
            <strong className="font-semibold text-amber-900">Munafa Core Disclaimer:</strong> Munafa does not own, store, transport, or sell any goods. Munafa is not responsible for any item loss, theft, missing goods, damage in transit, non-payment, or any tax not paid to the Government of Pakistan. All businesses are solely responsible for their own goods, their own delivery, their own insurance, and their own tax collection and remittance. Munafa provides connecting services only.
          </p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-amber-800 hover:text-amber-950 font-medium underline inline-flex items-center gap-1 shrink-0 cursor-pointer self-end md:self-auto"
        >
          {isExpanded ? 'Hide Details' : 'Legal Rules'}
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-amber-200/60 grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-amber-900 leading-relaxed">
          <div className="bg-white/60 p-2.5 rounded border border-amber-200/50">
            <span className="font-semibold block text-amber-950 mb-1">1. Cash on Delivery & Insured Freight</span>
            All businesses (Factories, Wholesalers, Farmers, Miners) must dispatch Cash on Delivery orders strictly via an insured delivery service. Handover payment is collected in cash.
          </div>
          <div className="bg-white/60 p-2.5 rounded border border-amber-200/50">
            <span className="font-semibold block text-amber-950 mb-1">2. FBR Tax Collection Responsibility</span>
            GST and provincial sales taxes are set by the seller and remitted directly by the seller to the Federal Board of Revenue (FBR). Munafa never touches tax money.
          </div>
          <div className="bg-white/60 p-2.5 rounded border border-amber-200/50">
            <span className="font-semibold block text-amber-950 mb-1">3. Pickup Safety Protocol</span>
            Pickups from fields, mines, or factories are arranged at buyer risk and cost. Always meet in daylight or certified premises and call in the presence of others.
          </div>
        </div>
      )}
    </div>
  );
};
