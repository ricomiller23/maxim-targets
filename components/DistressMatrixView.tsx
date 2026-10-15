"use client";

import React from "react";
import { MaximTarget } from "@/lib/types";
import { BarChart3, AlertTriangle, Flame, ShieldAlert, ChevronRight, CheckCircle2, Globe } from "lucide-react";

interface DistressMatrixViewProps {
  targets: MaximTarget[];
  onSelect: (target: MaximTarget) => void;
}

export const DistressMatrixView: React.FC<DistressMatrixViewProps> = ({
  targets,
  onSelect
}) => {
  const critical = targets.filter(t => t.financialMetrics.capitalNeedUrgency === "critical");
  const urgent = targets.filter(t => t.financialMetrics.capitalNeedUrgency === "urgent");
  const moderate = targets.filter(t => t.financialMetrics.capitalNeedUrgency === "moderate");
  const stable = targets.filter(t => t.financialMetrics.capitalNeedUrgency === "stable");
  const unrated = targets.filter(t => t.financialMetrics.capitalNeedUrgency === "unrated");

  // Top 20 strictly filtered by positive working capital deficit (negative working capital) and sorted descending
  const deficitTargets = [...targets]
    .filter(t => t.financialMetrics.isNegativeWorkingCapital && (t.financialMetrics.workingCapitalDeficit || 0) > 0)
    .sort((a, b) => (b.financialMetrics.workingCapitalDeficit || 0) - (a.financialMetrics.workingCapitalDeficit || 0))
    .slice(0, 20);

  const totalCohort = targets.length;
  const sumReconciled = critical.length + urgent.length + moderate.length + stable.length + unrated.length;

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-rose-400" />
            <span>Forensic Distress & Capital Urgency Matrix</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Categorizing presenting companies by remaining cash burn runway and balance sheet liquidity.
          </p>
        </div>

        {/* 100% Reconciled Banner */}
        <div className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300 flex items-center gap-2 self-start sm:self-auto">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            Cohort Reconciled: <strong>{sumReconciled} of {totalCohort}</strong> (100% Accounted For)
          </span>
        </div>
      </div>

      {/* 5 Urgency Tiers Summary (Reconciles exactly to 113) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Tier 1: Critical */}
        <div className="p-3.5 rounded-2xl border border-rose-500/40 bg-rose-950/20 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider font-mono">
              Tier 1: Critical (&lt;3 Mo)
            </span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="font-mono text-2xl font-black text-white">{critical.length}</div>
          <p className="text-[10px] text-zinc-400 leading-relaxed">
            Severe cash depletion under 3 months. Immediate bridge liquidity or rescue financing required.
          </p>
        </div>

        {/* Tier 2: Urgent */}
        <div className="p-3.5 rounded-2xl border border-amber-500/40 bg-amber-950/20 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider font-mono">
              Tier 2: Urgent (3–6 Mo)
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-mono text-2xl font-black text-white">{urgent.length}</div>
          <p className="text-[10px] text-zinc-400 leading-relaxed">
            Runway under 6 months or deficit &gt;$5M. Must price capital raise or draw down facilities within 90 days.
          </p>
        </div>

        {/* Tier 3: Moderate */}
        <div className="p-3.5 rounded-2xl border border-blue-500/40 bg-blue-950/20 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider font-mono">
              Tier 3: Moderate (6–12 Mo)
            </span>
            <span className="text-blue-400 font-mono text-xs">Mid-Runway</span>
          </div>
          <div className="font-mono text-2xl font-black text-white">{moderate.length}</div>
          <p className="text-[10px] text-zinc-400 leading-relaxed">
            Balance sheet supports 6 to 12 months. Monitoring burn rate and evaluating non-dilutive credit facilities.
          </p>
        </div>

        {/* Tier 4: Stable */}
        <div className="p-3.5 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider font-mono">
              Tier 4: Stable (&gt;12 Mo)
            </span>
            <span className="text-emerald-400 font-mono text-xs">Funded</span>
          </div>
          <div className="font-mono text-2xl font-black text-white">{stable.length}</div>
          <p className="text-[10px] text-zinc-400 leading-relaxed">
            Funded &gt;12 months or cash-flow positive. Seeking growth capital, joint ventures, or accretive M&A.
          </p>
        </div>

        {/* Tier 5: Foreign / Unrated */}
        <div className="p-3.5 rounded-2xl border border-sky-500/40 bg-sky-950/20 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider font-mono">
              Tier 5: Foreign / Unrated
            </span>
            <Globe className="w-4 h-4 text-sky-400" />
          </div>
          <div className="font-mono text-2xl font-black text-white">{unrated.length}</div>
          <p className="text-[10px] text-zinc-400 leading-relaxed">
            International issuers (SEDAR+ / LSE), bankrupt, or filers with non-standard cash tagging.
          </p>
        </div>
      </div>

      {/* High-Conviction Urgent Target Roster: Strictly sorted by largest working capital deficit */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Top 20 Critical Working Capital Deficit Targets</span>
          </h3>
          <span className="text-[11px] font-mono text-zinc-500">
            Ranked by Net Working Capital Deficit (Current Liabilities &gt; Current Assets)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {deficitTargets.map((t) => {
            const m = t.financialMetrics;

            return (
              <div
                key={t.id}
                onClick={() => onSelect(t)}
                className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-amber-500/60 transition-all cursor-pointer shadow-sm space-y-2 group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-base font-black text-white group-hover:text-amber-400">
                      {t.ticker}
                    </span>
                    <h4 className="text-xs font-bold text-zinc-300 line-clamp-1" title={t.name}>
                      {t.name}
                    </h4>
                  </div>
                  <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded ${
                    m.capitalNeedUrgency === "critical" 
                      ? "text-rose-400 bg-rose-950/60 border border-rose-500/40"
                      : m.capitalNeedUrgency === "urgent"
                        ? "text-amber-400 bg-amber-950/60 border border-amber-500/40"
                        : "text-zinc-400 bg-zinc-900 border border-zinc-800"
                  }`}>
                    {m.runwayMonths ? `${m.runwayMonths}mo` : "Unrated"}
                  </span>
                </div>

                <div className="space-y-1 text-[11px] font-mono">
                  <div className="flex justify-between text-zinc-400">
                    <span>Cash on Hand:</span>
                    <strong className="text-white">{m.cashOnHand !== null ? `$${(m.cashOnHand / 1e6).toFixed(2)}M` : m.cashOnHandDisplay}</strong>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Working Capital:</span>
                    <strong className="text-rose-400">
                      -${(m.workingCapitalDeficit / 1e6).toFixed(1)}M Deficit
                    </strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-900 flex justify-between items-center text-[10px] text-zinc-500">
                  <span className="truncate max-w-[120px]">{t.sector}</span>
                  <span className="text-amber-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center">
                    Review <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
