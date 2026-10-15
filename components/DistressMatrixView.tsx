"use client";

import React from "react";
import { MaximTarget } from "@/lib/types";
import { BarChart3, AlertTriangle, Flame, ShieldAlert, ChevronRight } from "lucide-react";

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

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-rose-400" />
            <span>Forensic Distress & Capital Urgency Matrix</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Categorizing presenting companies by negative working capital deficit severity and remaining cash burn runway.
          </p>
        </div>
      </div>

      {/* 4 Quadrants Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tier 1: Critical */}
        <div className="p-4 rounded-2xl border border-rose-500/40 bg-rose-950/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider font-mono">
              Tier 1: Critical (&lt;3 Mo)
            </span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="font-mono text-3xl font-black text-white">{critical.length}</div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Immediate solvency crisis. Working capital deficit exceeding current assets. Imminent PIPE, bridge loan, or delisting.
          </p>
        </div>

        {/* Tier 2: Urgent */}
        <div className="p-4 rounded-2xl border border-amber-500/40 bg-amber-950/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
              Tier 2: Urgent (3–6 Mo)
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-mono text-3xl font-black text-white">{urgent.length}</div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Must price capital raise inside 90 days. Aggressively tapping Maxim ATM facilities to cover monthly operating payroll.
          </p>
        </div>

        {/* Tier 3: Moderate */}
        <div className="p-4 rounded-2xl border border-blue-500/40 bg-blue-950/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider font-mono">
              Tier 3: Moderate (6–12 Mo)
            </span>
            <span className="text-blue-400 font-mono text-xs">Mid-Runway</span>
          </div>
          <div className="font-mono text-3xl font-black text-white">{moderate.length}</div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Sufficient liquidity through early 2027. Evaluating strategic partnerships, spin-offs, and non-dilutive licensing.
          </p>
        </div>

        {/* Tier 4: Stable */}
        <div className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
              Tier 4: Stable (&gt;12 Mo)
            </span>
            <span className="text-emerald-400 font-mono text-xs">Funded</span>
          </div>
          <div className="font-mono text-3xl font-black text-white">{stable.length}</div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Comfortable cash cushion. Looking for accretive M&A targets or commercial scale-up capital at the conference.
          </p>
        </div>
      </div>

      {/* High-Conviction Urgent Target Roster */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>Top 20 Critical Working Capital Deficit Targets</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {critical.slice(0, 20).map((t) => {
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
                  <span className="text-[10px] font-mono font-black text-rose-400 bg-rose-950/60 border border-rose-500/40 px-1.5 py-0.5 rounded">
                    {m.runwayMonths}mo
                  </span>
                </div>

                <div className="space-y-1 text-[11px] font-mono">
                  <div className="flex justify-between text-zinc-400">
                    <span>Cash on Hand:</span>
                    <strong className="text-white">{m.cashOnHand !== null ? `$${(m.cashOnHand / 1e6).toFixed(2)}M` : m.cashOnHandDisplay}</strong>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Deficit:</span>
                    <strong className="text-rose-400">-${(m.workingCapitalDeficit / 1e6).toFixed(1)}M</strong>
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
