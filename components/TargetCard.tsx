"use client";

import React from "react";
import { 
  Flame, 
  AlertTriangle, 
  TrendingDown, 
  Layers, 
  ExternalLink, 
  Mail, 
  Phone, 
  Mic, 
  ChevronRight, 
  ShieldCheck,
  Building2,
  DollarSign
} from "lucide-react";
import { MaximTarget } from "@/lib/types";

interface TargetCardProps {
  target: MaximTarget;
  onSelect: (target: MaximTarget) => void;
  onQuickStageChange?: (targetId: string, stage: any) => void;
}

export const TargetCard: React.FC<TargetCardProps> = ({
  target,
  onSelect,
  onQuickStageChange
}) => {
  const m = target.financialMetrics;
  const f = target.financingHistory2Y;
  const r = target.registrationStatements2Y;

  const ceo = target.contacts.find(c => c.id.includes("ceo"));
  const cfo = target.contacts.find(c => c.id.includes("cfo"));

  // Urgency styling
  const urgencyColors = {
    critical: "bg-rose-500/10 border-rose-500/30 text-rose-400",
    urgent: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    moderate: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    stable: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
  };

  const stageBadgeColors = {
    screened: "bg-zinc-800 text-zinc-400 border-zinc-700",
    outreach_ready: "bg-amber-950/60 text-amber-300 border-amber-600/40",
    contacted: "bg-blue-950/60 text-blue-300 border-blue-600/40",
    nda_signed: "bg-purple-950/60 text-purple-300 border-purple-600/40",
    term_sheet: "bg-emerald-950/60 text-emerald-300 border-emerald-600/40",
    passed: "bg-zinc-900 text-zinc-600 border-zinc-800"
  };

  return (
    <div className="group rounded-2xl border border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-900/90 hover:border-zinc-700/80 transition-all shadow-md hover:shadow-xl flex flex-col justify-between overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 border-b border-zinc-800/60">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-black text-white tracking-tight group-hover:text-amber-400 transition-colors">
                {target.ticker}
              </span>
              <span className="text-[10px] font-mono text-zinc-500 border border-zinc-800 px-1.5 py-0.2 rounded">
                {target.exchange}
              </span>
              {target.isPanelist && (
                <span className="flex items-center gap-1 rounded bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.5 text-[9px] font-bold text-purple-300">
                  <Mic className="w-2.5 h-2.5" />
                  Panelist
                </span>
              )}
            </div>
            <h3 className="text-xs font-bold text-zinc-200 line-clamp-1 mt-0.5" title={target.name}>
              {target.name}
            </h3>
          </div>

          {/* Urgency Pill */}
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${urgencyColors[m.capitalNeedUrgency]}`}>
            {m.capitalNeedUrgency === "critical" ? "🔥 Critical" : m.capitalNeedUrgency === "urgent" ? "⚠️ Urgent" : m.capitalNeedUrgency}
          </span>
        </div>

        {/* Sector Tag & Status */}
        <div className="flex items-center justify-between text-[11px] text-zinc-400">
          <span className="truncate pr-2 font-medium">{target.sector}</span>
          <span className="shrink-0 text-[10px] text-zinc-500 font-mono">
            CIK: {target.cik}
          </span>
        </div>
      </div>

      {/* Middle: Forensic Solvency & Financial Telemetry */}
      <div className="p-4 space-y-3.5 flex-1">
        {/* Metric 1 & 2: Cash & Working Capital */}
        <div className="grid grid-cols-2 gap-2 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-850">
          <div>
            <span className="text-[10px] font-medium text-zinc-500 block">Cash on Hand</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-mono text-sm font-bold text-white">
                ${(m.cashOnHand / 1e6).toFixed(2)}M
              </span>
              <span className="text-[10px] font-mono text-rose-400">
                ({m.changeInCashPct}%)
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-medium text-zinc-500 block">Working Capital</span>
            <div className="mt-0.5">
              {m.isNegativeWorkingCapital ? (
                <span className="font-mono text-xs font-black text-rose-400 block truncate" title={`-$${(m.workingCapitalDeficit/1e6).toFixed(2)}M deficit`}>
                  -${(m.workingCapitalDeficit / 1e6).toFixed(1)}M (Deficit)
                </span>
              ) : (
                <span className="font-mono text-xs font-bold text-emerald-400 block truncate">
                  +${(m.workingCapital / 1e6).toFixed(1)}M Surplus
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Metric 3: Runway & Burn Rate Gauge */}
        <div>
          <div className="flex justify-between items-center text-[11px] mb-1">
            <span className="text-zinc-400 font-medium flex items-center gap-1">
              <span>Runway:</span>
              <strong className={m.runwayMonths < 3 ? "text-rose-400 font-mono" : m.runwayMonths < 6 ? "text-amber-400 font-mono" : "text-white font-mono"}>
                {m.runwayMonths} Months
              </strong>
            </span>
            <span className="text-zinc-500 text-[10px] font-mono">
              Burn: ${(m.monthlyBurnRate / 1e3).toFixed(0)}k/mo
            </span>
          </div>

          {/* Runway Progress Bar */}
          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                m.runwayMonths < 3 ? "bg-rose-500" : m.runwayMonths < 6 ? "bg-amber-500" : "bg-blue-500"
              }`}
              style={{ width: `${Math.min(100, (m.runwayMonths / 12) * 100)}%` }}
            />
          </div>
        </div>

        {/* Metric 4: 2Y Financing & S-3 Shelf Badges */}
        <div className="pt-1 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-400">
          <div className="flex items-center gap-1">
            <Layers className="w-3 h-3 text-purple-400" />
            <span>2Y Raised: <strong className="text-zinc-200 font-mono">${(f.totalRaised / 1e6).toFixed(1)}M</strong></span>
          </div>

          <div className="flex items-center gap-1 font-mono">
            <span className="text-zinc-500">S-3 Shelf:</span>
            <span className="text-amber-400 font-bold">${(r.activeShelfCapacity / 1e6).toFixed(0)}M</span>
          </div>
        </div>

        {/* Decision Makers Preview */}
        <div className="bg-zinc-950/40 p-2 rounded-lg border border-zinc-850/60 text-[11px] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 font-medium truncate max-w-[150px]">
              {ceo?.name} <span className="text-zinc-600 text-[10px]">CEO</span>
            </span>
            <a 
              href={`mailto:${ceo?.email}`} 
              className="text-zinc-500 hover:text-amber-400 font-mono text-[10px] flex items-center gap-1"
              title={ceo?.email}
              onClick={(e) => e.stopPropagation()}
            >
              <Mail className="w-2.5 h-2.5" />
              <span>Email</span>
            </a>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400 font-medium truncate max-w-[150px]">
              {cfo?.name} <span className="text-zinc-600 text-[10px]">CFO</span>
            </span>
            <a 
              href={`mailto:${cfo?.email}`} 
              className="text-zinc-500 hover:text-amber-400 font-mono text-[10px] flex items-center gap-1"
              title={cfo?.email}
              onClick={(e) => e.stopPropagation()}
            >
              <Mail className="w-2.5 h-2.5" />
              <span>Email</span>
            </a>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 bg-zinc-950/80 border-t border-zinc-800/80 flex items-center justify-between gap-2">
        {/* Stage Pill */}
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${stageBadgeColors[target.crm.stage]}`}>
          {target.crm.stage.replace(/_/g, " ")}
        </span>

        {/* Open Drawer Button */}
        <button
          type="button"
          onClick={() => onSelect(target)}
          className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-zinc-200 text-xs font-bold inline-flex items-center gap-1 transition-all cursor-pointer shadow-sm"
        >
          <span>Diligence & Outreach</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
