"use client";

import React from "react";
import { 
  Flame, 
  AlertTriangle, 
  ExternalLink, 
  ChevronRight, 
  Mic, 
  Mail, 
  Layers 
} from "lucide-react";
import { MaximTarget } from "@/lib/types";

interface TargetTableProps {
  targets: MaximTarget[];
  onSelect: (target: MaximTarget) => void;
}

export const TargetTable: React.FC<TargetTableProps> = ({ targets, onSelect }) => {
  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-md">
      <table className="w-full text-left text-xs text-zinc-300">
        <thead className="bg-zinc-950/80 border-b border-zinc-800 text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wider">
          <tr>
            <th className="py-3 px-3">Ticker / Company</th>
            <th className="py-3 px-3">Sector</th>
            <th className="py-3 px-3">Attendance</th>
            <th className="py-3 px-3 text-right">Cash ($M)</th>
            <th className="py-3 px-3 text-right">Working Capital</th>
            <th className="py-3 px-3 text-right">Burn / Mo</th>
            <th className="py-3 px-3 text-right">Runway</th>
            <th className="py-3 px-3 text-right">2Y Dilution</th>
            <th className="py-3 px-3 text-right">Active S-3</th>
            <th className="py-3 px-3">Key Contacts</th>
            <th className="py-3 px-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-850">
          {targets.map((t) => {
            const m = t.financialMetrics;
            const f = t.financingHistory2Y;
            const r = t.registrationStatements2Y;
            const ceo = t.contacts.find((c) => c.id.includes("ceo"));
            const cfo = t.contacts.find((c) => c.id.includes("cfo"));

            return (
              <tr 
                key={t.id} 
                onClick={() => onSelect(t)}
                className="hover:bg-zinc-800/50 transition-colors cursor-pointer group"
              >
                {/* Ticker & Name */}
                <td className="py-3 px-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-white group-hover:text-amber-400">
                      {t.ticker}
                    </span>
                    {t.isPanelist && (
                      <span className="rounded bg-purple-500/10 border border-purple-500/30 px-1 text-[9px] font-bold text-purple-300">
                        Panel
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-400 truncate max-w-[180px]" title={t.name}>
                    {t.name}
                  </div>
                </td>

                {/* Sector */}
                <td className="py-3 px-3">
                  <span className="text-[11px] text-zinc-400 truncate max-w-[140px] block" title={t.sector}>
                    {t.sector}
                  </span>
                </td>

                {/* Attendance */}
                <td className="py-3 px-3">
                  <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                    t.status === "confirmed" ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-400"
                  }`}>
                    {t.status === "confirmed" ? "Confirmed" : "Invited"}
                  </span>
                </td>

                {/* Cash on Hand */}
                <td className="py-3 px-3 text-right font-mono font-bold text-white">
                  ${(m.cashOnHand / 1e6).toFixed(2)}M
                  <span className="block text-[10px] text-rose-400 font-normal">
                    {m.changeInCashPct}%
                  </span>
                </td>

                {/* Working Capital */}
                <td className="py-3 px-3 text-right font-mono">
                  {m.isNegativeWorkingCapital ? (
                    <span className="text-rose-400 font-bold block">
                      -${(m.workingCapitalDeficit / 1e6).toFixed(1)}M
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-bold block">
                      +${(m.workingCapital / 1e6).toFixed(1)}M
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-500">
                    {m.currentRatio}x Ratio
                  </span>
                </td>

                {/* Burn / Mo */}
                <td className="py-3 px-3 text-right font-mono text-zinc-400">
                  ${(m.monthlyBurnRate / 1e3).toFixed(0)}k
                </td>

                {/* Runway */}
                <td className="py-3 px-3 text-right font-mono font-black">
                  <span className={m.runwayMonths < 3 ? "text-rose-400" : m.runwayMonths < 6 ? "text-amber-400" : "text-white"}>
                    {m.runwayMonths} Mo
                  </span>
                </td>

                {/* 2Y Financing */}
                <td className="py-3 px-3 text-right font-mono text-zinc-200">
                  ${(f.totalRaised / 1e6).toFixed(1)}M
                </td>

                {/* Active S-3 */}
                <td className="py-3 px-3 text-right font-mono text-amber-400 font-bold">
                  ${(r.activeShelfCapacity / 1e6).toFixed(0)}M
                </td>

                {/* Key Contacts */}
                <td className="py-3 px-3">
                  <div className="text-[11px] text-zinc-300 truncate max-w-[160px]">
                    {ceo?.name}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono truncate max-w-[160px]">
                    {ceo?.email}
                  </div>
                </td>

                {/* Action */}
                <td className="py-3 px-3 text-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(t);
                    }}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-zinc-300 transition-colors"
                    title="Open Diligence Drawer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
