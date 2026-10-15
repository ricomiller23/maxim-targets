"use client";

import React from "react";
import { 
  AlertTriangle, 
  ChevronRight, 
  Mic, 
  Phone, 
  Layers, 
  ExternalLink,
  ShieldAlert
} from "lucide-react";
import { MaximTarget } from "@/lib/types";

interface TargetCardProps {
  target: MaximTarget;
  onSelect: (target: MaximTarget) => void;
  onQuickStageChange?: (targetId: string, stage: string) => void;
}

export const TargetCard: React.FC<TargetCardProps> = ({ 
  target, 
  onSelect 
}) => {
  const m = target.financialMetrics;
  const f = target.financingHistory2Y;
  const r = target.registrationStatements2Y;
  const ceo = target.contacts.find((c) => c.id.includes("ceo"));
  const cfo = target.contacts.find((c) => c.id.includes("cfo"));
  const sigs = target.signals8K || [];

  const urgencyColors = {
    critical: "bg-rose-950/70 text-rose-300 border-rose-500/50 shadow-rose-950/40",
    urgent: "bg-amber-950/70 text-amber-300 border-amber-500/50 shadow-amber-950/40",
    moderate: "bg-blue-950/70 text-blue-300 border-blue-500/50",
    stable: "bg-emerald-950/70 text-emerald-300 border-emerald-500/50",
    unrated: "bg-zinc-800 text-zinc-400 border-zinc-700"
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
                {target.secStatus === "sec_verified_filer" ? "SEC" : target.regulatoryPortal?.split(" ")[0] || "Foreign"}
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
          <span 
            title={m.urgencyRationale}
            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${urgencyColors[m.capitalNeedUrgency]}`}
          >
            {m.capitalNeedUrgency === "critical" ? "🔥 Critical" : m.capitalNeedUrgency === "urgent" ? "⚠️ Urgent" : m.capitalNeedUrgency}
          </span>
        </div>

        {/* Sector Tag & Provenance */}
        <div className="flex items-center justify-between text-[11px] text-zinc-400">
          <span className="truncate pr-2 font-medium">{target.sector}</span>
          <span className="shrink-0 text-[10px] text-zinc-500 font-mono">
            {target.secStatus === "sec_verified_filer" ? `CIK: ${target.cik}` : target.regulatoryPortal}
          </span>
        </div>
      </div>

      {/* Middle: Forensic Solvency & Financial Telemetry */}
      <div className="p-4 space-y-3.5 flex-1">
        {/* Metric 1 & 2: Cash & Working Capital */}
        <div className="grid grid-cols-2 gap-2 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-850">
          <div title={m.calculationMethodology}>
            <span className="text-[10px] font-medium text-zinc-500 block">Cash on Hand</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-mono text-sm font-bold text-white">
                {m.cashOnHandDisplay}
              </span>
            </div>
            {m.asOfDate !== "Not applicable" && (
              <span className="text-[9px] font-mono text-zinc-500 block">
                {m.filingForm} • {m.asOfDate}
              </span>
            )}
          </div>

          <div>
            <span className="text-[10px] font-medium text-zinc-500 block">Working Capital</span>
            <div className="mt-0.5">
              {m.isUnclassifiedBalanceSheet ? (
                <span className="font-mono text-xs font-medium text-amber-300 block truncate" title="REIT Unclassified Balance Sheet">
                  Unclassified (REIT)
                </span>
              ) : m.isNegativeWorkingCapital ? (
                <span className="font-mono text-xs font-black text-rose-400 block truncate" title={m.workingCapitalDisplay}>
                  {m.workingCapitalDisplay}
                </span>
              ) : (
                <span className="font-mono text-xs font-bold text-emerald-400 block truncate" title={m.workingCapitalDisplay}>
                  {m.workingCapitalDisplay}
                </span>
              )}
            </div>
            <span className="text-[9px] font-mono text-zinc-500 block">
              {m.currentRatioDisplay !== "N/A" ? `${m.currentRatioDisplay} Ratio` : "GAAP Line"}
            </span>
          </div>
        </div>

        {/* Metric 3: Runway & Burn Rate Gauge */}
        <div title={m.calculationMethodology}>
          <div className="flex justify-between items-center text-[11px] mb-1">
            <span className="text-zinc-400 font-medium flex items-center gap-1">
              <span>Runway:</span>
              <strong className={m.capitalNeedUrgency === "critical" ? "text-rose-400 font-mono" : m.capitalNeedUrgency === "urgent" ? "text-amber-400 font-mono" : "text-white font-mono"}>
                {m.runwayDisplay}
              </strong>
            </span>
            <span className="text-zinc-500 text-[10px] font-mono">
              Burn: {m.monthlyBurnRate > 0 ? `$${(m.monthlyBurnRate / 1e3).toFixed(0)}k/mo` : "Self-Funded"}
            </span>
          </div>

          {/* Runway Progress Bar */}
          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                m.capitalNeedUrgency === "critical" ? "bg-rose-500" : m.capitalNeedUrgency === "urgent" ? "bg-amber-500" : "bg-blue-500"
              }`}
              style={{ width: `${Math.min(100, (m.runwayMonths / 18) * 100)}%` }}
            />
          </div>
        </div>

        {/* 8-K Disclosure Signals Alert */}
        {sigs.length > 0 && (
          <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-500/30 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <div className="text-[10px] text-rose-300 font-mono leading-tight truncate">
              <strong>{sigs[0].item}:</strong> {sigs[0].title}
            </div>
          </div>
        )}

        {/* Primary Receipt Accession Link */}
        {target.secStatus === "sec_verified_filer" && m.accessionNumber !== "N/A" && (
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 border-t border-zinc-800/60 pt-1">
            <span>SEC Accession:</span>
            <a 
              href={m.secViewerUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-amber-400/80 hover:text-amber-300 flex items-center gap-0.5"
            >
              <span>{m.accessionNumber}</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        )}

        {/* Decision Makers Preview */}
        <div className="bg-zinc-950/40 p-2 rounded-lg border border-zinc-850/60 text-[11px] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 font-medium truncate max-w-[170px]" title={ceo?.name}>
              {ceo?.name} <span className="text-zinc-600 text-[10px] font-mono">{ceo?.title}</span>
            </span>
            <span className="text-zinc-400 font-mono text-[10px] flex items-center gap-1">
              <Phone className="w-2.5 h-2.5 text-zinc-500" />
              <span>{target.telephone !== "Not yet sourced" ? target.telephone : "See SEC"}</span>
            </span>
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
          <span>Forensic Diligence</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
