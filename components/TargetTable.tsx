"use client";

import React, { useState, useMemo } from "react";
import { 
  ChevronRight, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  ExternalLink, 
  AlertTriangle, 
  FileText, 
  ShieldAlert, 
  HelpCircle,
  Globe,
  Clock,
  FileX,
  Layers
} from "lucide-react";
import { MaximTarget } from "@/lib/types";

interface TargetTableProps {
  targets: MaximTarget[];
  onSelect: (target: MaximTarget) => void;
}

type SortField = "ticker" | "name" | "sector" | "price" | "volume" | "cash" | "workingCapital" | "burn" | "runway" | "urgency" | "filings";
type SortDirection = "asc" | "desc";

export const TargetTable: React.FC<TargetTableProps> = ({ targets, onSelect }) => {
  const [sortField, setSortField] = useState<SortField>("runway");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "cash" || field === "workingCapital" || field === "filings" || field === "price" || field === "volume" ? "desc" : "asc");
    }
  };

  const sortedTargets = useMemo(() => {
    return [...targets].sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      switch (sortField) {
        case "ticker":
          valA = a.ticker.toLowerCase();
          valB = b.ticker.toLowerCase();
          break;
        case "name":
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case "sector":
          valA = (a.sector || "").toLowerCase();
          valB = (b.sector || "").toLowerCase();
          break;
        case "price":
          valA = a.marketData?.price ?? -999;
          valB = b.marketData?.price ?? -999;
          break;
        case "volume":
          valA = a.marketData?.avgMonthlyVolume ?? -999;
          valB = b.marketData?.avgMonthlyVolume ?? -999;
          break;
        case "cash":
          valA = a.financialMetrics.cashOnHand ?? -1;
          valB = b.financialMetrics.cashOnHand ?? -1;
          break;
        case "workingCapital":
          valA = a.financialMetrics.workingCapital ?? -999999999;
          valB = b.financialMetrics.workingCapital ?? -999999999;
          break;
        case "burn":
          valA = a.financialMetrics.monthlyBurnRate ?? 0;
          valB = b.financialMetrics.monthlyBurnRate ?? 0;
          break;
        case "runway":
          valA = a.financialMetrics.runwayMonths ?? 999;
          valB = b.financialMetrics.runwayMonths ?? 999;
          break;
        case "urgency": {
          const tierWeight: Record<string, number> = { critical: 4, urgent: 3, moderate: 2, stable: 1, unrated: 0 };
          valA = tierWeight[a.financialMetrics.capitalNeedUrgency] || 0;
          valB = tierWeight[b.financialMetrics.capitalNeedUrgency] || 0;
          break;
        }
        case "filings":
          valA = a.registrationStatements2Y.filingCount ?? 0;
          valB = b.registrationStatements2Y.filingCount ?? 0;
          break;
      }

      if (typeof valA === "string") {
        return sortDirection === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDirection === "asc" ? valA - valB : valB - valA;
    });
  }, [targets, sortField, sortDirection]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-zinc-600 inline ml-1 opacity-60" />;
    return sortDirection === "asc" 
      ? <ArrowUp className="w-3 h-3 text-amber-400 inline ml-1" />
      : <ArrowDown className="w-3 h-3 text-amber-400 inline ml-1" />;
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-xl">
      <table className="w-full text-left text-xs text-zinc-300">
        <thead className="bg-zinc-950/80 border-b border-zinc-800 text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wider">
          <tr>
            <th className="py-3 px-3 cursor-pointer hover:text-white" onClick={() => handleSort("ticker")}>
              Issuer / CIK {renderSortIcon("ticker")}
            </th>
            <th className="py-3 px-3 cursor-pointer hover:text-white" onClick={() => handleSort("sector")}>
              Sector {renderSortIcon("sector")}
            </th>
            {/* New Stock Price Column */}
            <th className="py-3 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort("price")}>
              Stock Price {renderSortIcon("price")}
            </th>
            {/* New Monthly Volume Column */}
            <th className="py-3 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort("volume")}>
              Avg Mo. Vol {renderSortIcon("volume")}
            </th>
            <th className="py-3 px-3">
              Latest SEC Filing & Date
            </th>
            <th className="py-3 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort("cash")}>
              Cash on Hand {renderSortIcon("cash")}
            </th>
            <th className="py-3 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort("workingCapital")}>
              Working Capital {renderSortIcon("workingCapital")}
            </th>
            <th className="py-3 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort("runway")}>
              Runway {renderSortIcon("runway")}
            </th>
            <th className="py-3 px-3 text-center cursor-pointer hover:text-white" onClick={() => handleSort("urgency")}>
              Urgency Tier {renderSortIcon("urgency")}
            </th>
            <th className="py-3 px-3 text-center cursor-pointer hover:text-white" onClick={() => handleSort("filings")}>
              Reg Status (24M) {renderSortIcon("filings")}
            </th>
            <th className="py-3 px-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-850">
          {sortedTargets.map((t) => {
            const m = t.financialMetrics;
            const reg = t.registrationStatements2Y;
            const mk = t.marketData;
            const sigs = t.signals8K || [];
            const isRealReit = (t.sector || "").toLowerCase().includes("reit") || (t.sector || "").toLowerCase().includes("real estate");

            return (
              <tr
                key={t.id}
                onClick={() => onSelect(t)}
                className="hover:bg-zinc-800/40 transition-colors cursor-pointer group"
              >
                {/* Issuer */}
                <td className="py-3 px-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-black text-white group-hover:text-amber-400 text-sm">
                      {t.ticker}
                    </span>
                    {t.isPanelist && (
                      <span className="rounded bg-purple-500/20 border border-purple-500/40 px-1 py-0.2 text-[9px] font-bold text-purple-300">
                        Panelist
                      </span>
                    )}
                    {t.secStatus !== "sec_verified_filer" && (
                      <span className="rounded bg-sky-500/10 border border-sky-500/30 px-1 py-0.2 text-[9px] font-semibold text-sky-300">
                        {t.secStatus === "bankrupt_defunct" ? "Bankrupt" : t.regulatoryPortal?.split(" ")[0] || "Foreign"}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-400 truncate max-w-[160px]" title={t.name}>
                    {t.name}
                  </div>
                  <div className="text-[9px] font-mono text-zinc-500">
                    {t.secStatus === "sec_verified_filer" ? `CIK: ${t.cik}` : t.regulatoryPortal}
                  </div>
                </td>

                {/* Sector */}
                <td className="py-3 px-3">
                  <span className="text-[11px] text-zinc-300 truncate max-w-[120px] block" title={t.sector}>
                    {t.sector}
                  </span>
                  <span className="text-[10px] text-zinc-500 block">
                    {t.headquarters?.split(",")[0] || "US"}
                  </span>
                </td>

                {/* Stock Price */}
                <td className="py-3 px-3 text-right font-mono">
                  {mk && mk.price !== null ? (
                    <div>
                      <span className="text-white font-bold text-xs">{mk.priceDisplay}</span>
                      <span className="block text-[9px] text-zinc-500">{mk.currency}</span>
                    </div>
                  ) : (
                    <span className="text-zinc-500 text-[10px] italic">
                      {mk?.priceDisplay || "Not yet sourced"}
                    </span>
                  )}
                </td>

                {/* Avg Monthly Volume */}
                <td className="py-3 px-3 text-right font-mono">
                  {mk && mk.avgMonthlyVolume !== null ? (
                    <div>
                      <span className="text-white font-bold text-xs">{mk.avgMonthlyVolumeDisplay}</span>
                      <span className="block text-[9px] text-zinc-500">
                        {mk.avgDailyVolume ? `${(mk.avgDailyVolume / 1e3).toFixed(0)}K/day` : "30d"}
                      </span>
                    </div>
                  ) : (
                    <span className="text-zinc-500 text-[10px] italic">
                      {mk?.avgMonthlyVolumeDisplay || "N/A"}
                    </span>
                  )}
                </td>

                {/* Filing Receipt & Form & Stale Badge */}
                <td className="py-3 px-3">
                  {t.secStatus === "sec_verified_filer" && m.accessionNumber && m.accessionNumber !== "N/A" ? (
                    <div className="space-y-1" title={`Form ${m.filingForm} ended ${m.asOfDate}\nAccn: ${m.accessionNumber}`}>
                      <div className="flex items-center gap-1 font-mono text-[10px] flex-wrap">
                        <span className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold border border-zinc-700">
                          {m.filingForm}
                        </span>
                        <span className="text-zinc-400">{m.asOfDate}</span>
                        {m.isStaleFiling && (
                          <span className="px-1 py-0.2 rounded bg-amber-950/80 border border-amber-500/40 text-[9px] text-amber-300 font-bold flex items-center gap-0.5" title={`Filing period ended ${m.asOfDate} (>135 days ago)`}>
                            <Clock className="w-2.5 h-2.5" />
                            STALE
                          </span>
                        )}
                      </div>
                      <a
                        href={m.secViewerUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[9px] font-mono text-amber-400/80 hover:text-amber-300 hover:underline inline-flex items-center gap-0.5"
                      >
                        {(m.accessionNumber || "").slice(0, 15)}...
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  ) : (
                    <div className="text-[10px] text-zinc-500 italic">
                      {t.regulatoryPortal || "Non-SEC Filer"}
                    </div>
                  )}
                </td>

                {/* Cash On Hand */}
                <td className="py-3 px-3 text-right font-mono font-bold">
                  {m.cashOnHand !== null ? (
                    <div title={m.calculationMethodology}>
                      <span className="text-white text-xs">{m.cashOnHandDisplay}</span>
                      {m.changeInCashDisplay !== "N/A" && (
                        <span className={`block text-[9px] font-normal ${
                          (m.changeInCashPct || 0) < 0 ? "text-rose-400" : "text-emerald-400"
                        }`}>
                          {m.changeInCashDisplay}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-zinc-500 text-[10px] italic">
                      {m.cashOnHandDisplay}
                    </span>
                  )}
                </td>

                {/* Working Capital */}
                <td className="py-3 px-3 text-right font-mono">
                  {m.isUnclassifiedBalanceSheet ? (
                    <span 
                      className="text-[10px] text-amber-300/90 font-medium block" 
                      title={isRealReit ? "REIT Balance Sheet: Properties and mortgage notes classified as long-term under GAAP." : "Unclassified balance sheet format."}
                    >
                      {isRealReit ? "Unclassified (REIT)" : "Unclassified"}
                    </span>
                  ) : m.workingCapital !== null ? (
                    <div title={`Current Assets: $${((m.currentAssets || 0)/1e6).toFixed(1)}M\nCurrent Liabs: $${((m.currentLiabilities || 0)/1e6).toFixed(1)}M`}>
                      {m.isNegativeWorkingCapital ? (
                        <span className="text-rose-400 font-bold block text-xs">
                          {m.workingCapitalDisplay}
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-bold block text-xs">
                          {m.workingCapitalDisplay}
                        </span>
                      )}
                      <span className="text-[9px] text-zinc-500">
                        {m.currentRatioDisplay} Ratio
                      </span>
                    </div>
                  ) : (
                    <span className="text-zinc-500 text-[10px] italic">
                      {m.workingCapitalDisplay}
                    </span>
                  )}
                </td>

                {/* Runway */}
                <td className="py-3 px-3 text-right font-mono">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                    m.capitalNeedUrgency === "critical"
                      ? "text-rose-400 bg-rose-950/60 border border-rose-500/40"
                      : m.capitalNeedUrgency === "urgent"
                        ? "text-amber-400 bg-amber-950/60 border border-amber-500/40"
                        : m.capitalNeedUrgency === "moderate"
                          ? "text-blue-400 bg-blue-950/60 border border-blue-500/40"
                          : m.capitalNeedUrgency === "stable"
                            ? "text-emerald-400 bg-emerald-950/60 border border-emerald-500/40"
                            : "text-zinc-400 bg-zinc-900 border border-zinc-800"
                  }`}>
                    {m.runwayDisplay}
                  </span>
                </td>

                {/* Urgency Tier */}
                <td className="py-3 px-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    m.capitalNeedUrgency === "critical"
                      ? "bg-rose-950/80 text-rose-300 border border-rose-500/50"
                      : m.capitalNeedUrgency === "urgent"
                        ? "bg-amber-950/80 text-amber-300 border border-amber-500/50"
                        : m.capitalNeedUrgency === "moderate"
                          ? "bg-blue-950/80 text-blue-300 border border-blue-500/50"
                          : m.capitalNeedUrgency === "stable"
                            ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/50"
                            : "bg-zinc-800 text-zinc-400"
                  }`}>
                    {m.capitalNeedUrgency}
                  </span>
                </td>

                {/* 24M Reg Statement Status / Shelves */}
                <td className="py-3 px-3 text-center">
                  {t.noActiveRegStatements24M ? (
                    <span 
                      className="px-2 py-0.5 rounded-full bg-rose-950/90 border border-rose-500/50 text-rose-300 text-[9px] font-mono font-bold inline-flex items-center gap-1"
                      title="No S-1, S-3, S-8, F-1, or F-3 filed in the last 24 months"
                    >
                      <FileX className="w-2.5 h-2.5 text-rose-400" />
                      <span>No Reg (24M)</span>
                    </span>
                  ) : (
                    <div className="flex items-center justify-center gap-1 font-mono text-[10px]">
                      {reg.activeShelvesFiled > 0 ? (
                        <span className="px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-500/40 text-purple-300 font-bold" title={`${reg.activeShelvesFiled} Universal S-3/F-3 Shelves`}>
                          S-3 ({reg.activeShelvesFiled})
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400" title={`${reg.filingCount} SEC registration filings`}>
                          {reg.filingCount} Filings
                        </span>
                      )}
                    </div>
                  )}
                </td>

                {/* Action */}
                <td className="py-3 px-3 text-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(t);
                    }}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-zinc-300 transition-colors cursor-pointer"
                    title="Open company diligence drawer"
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
