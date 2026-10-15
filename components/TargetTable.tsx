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
  Globe
} from "lucide-react";
import { MaximTarget } from "@/lib/types";

interface TargetTableProps {
  targets: MaximTarget[];
  onSelect: (target: MaximTarget) => void;
}

type SortField = "ticker" | "name" | "sector" | "cash" | "workingCapital" | "burn" | "runway" | "urgency" | "filings";
type SortDirection = "asc" | "desc";

export const TargetTable: React.FC<TargetTableProps> = ({ targets, onSelect }) => {
  const [sortField, setSortField] = useState<SortField>("runway");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "cash" || field === "workingCapital" || field === "filings" ? "desc" : "asc");
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
          valA = a.sector.toLowerCase();
          valB = b.sector.toLowerCase();
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
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-zinc-600 inline ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-3 h-3 text-amber-400 inline ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-amber-400 inline ml-1" />
    );
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-xl backdrop-blur-sm">
      <table className="w-full text-left text-xs text-zinc-300">
        <thead className="bg-zinc-950/90 border-b border-zinc-800 text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wider sticky top-0 z-10 backdrop-blur-md">
          <tr>
            <th 
              onClick={() => handleSort("ticker")}
              className="py-3 px-3 cursor-pointer hover:text-white transition-colors group select-none"
            >
              Ticker / Company {renderSortIcon("ticker")}
            </th>
            <th 
              onClick={() => handleSort("sector")}
              className="py-3 px-3 cursor-pointer hover:text-white transition-colors group select-none"
            >
              Sector {renderSortIcon("sector")}
            </th>
            <th className="py-3 px-3">Filing Receipt</th>
            <th 
              onClick={() => handleSort("cash")}
              className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors group select-none"
            >
              Cash On Hand {renderSortIcon("cash")}
            </th>
            <th 
              onClick={() => handleSort("workingCapital")}
              className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors group select-none"
            >
              Working Capital {renderSortIcon("workingCapital")}
            </th>
            <th 
              onClick={() => handleSort("burn")}
              className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors group select-none"
            >
              Burn / Mo {renderSortIcon("burn")}
            </th>
            <th 
              onClick={() => handleSort("runway")}
              className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors group select-none"
            >
              Runway {renderSortIcon("runway")}
            </th>
            <th 
              onClick={() => handleSort("urgency")}
              className="py-3 px-3 text-center cursor-pointer hover:text-white transition-colors group select-none"
            >
              Urgency {renderSortIcon("urgency")}
            </th>
            <th className="py-3 px-3">8-K Signals</th>
            <th className="py-3 px-3">Key Contacts</th>
            <th className="py-3 px-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-850">
          {sortedTargets.map((t) => {
            const m = t.financialMetrics;
            const r = t.registrationStatements2Y;
            const ceo = t.contacts.find((c) => c.id.includes("ceo"));
            const sigs = t.signals8K || [];
            const hasItem301 = sigs.some(s => s.item === "Item 3.01");

            return (
              <tr 
                key={t.id} 
                onClick={() => onSelect(t)}
                className="hover:bg-zinc-800/60 transition-colors cursor-pointer group"
              >
                {/* Ticker & Name */}
                <td className="py-3 px-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-white group-hover:text-amber-400 transition-colors text-sm">
                      {t.ticker}
                    </span>
                    {t.isPanelist && (
                      <span className="rounded bg-purple-500/10 border border-purple-500/30 px-1 py-0.2 text-[9px] font-bold text-purple-300">
                        Panel
                      </span>
                    )}
                    {t.secStatus !== "sec_verified_filer" && (
                      <span className="rounded bg-sky-500/10 border border-sky-500/30 px-1 py-0.2 text-[9px] font-semibold text-sky-300">
                        {t.secStatus === "bankrupt_defunct" ? "Bankrupt" : t.regulatoryPortal?.split(" ")[0] || "Foreign"}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-400 truncate max-w-[170px]" title={t.name}>
                    {t.name}
                  </div>
                  <div className="text-[9px] font-mono text-zinc-500">
                    {t.secStatus === "sec_verified_filer" ? `CIK: ${t.cik}` : t.regulatoryPortal}
                  </div>
                </td>

                {/* Sector */}
                <td className="py-3 px-3">
                  <span className="text-[11px] text-zinc-300 truncate max-w-[130px] block" title={t.sector}>
                    {t.sector}
                  </span>
                  <span className="text-[10px] text-zinc-500 block">
                    {t.headquarters?.split(",")[0] || "US"}
                  </span>
                </td>

                {/* Filing Receipt & Form */}
                <td className="py-3 px-3">
                  {t.secStatus === "sec_verified_filer" && m.accessionNumber !== "N/A" ? (
                    <div className="space-y-0.5" title={`Form ${m.filingForm} ended ${m.asOfDate}
Accn: ${m.accessionNumber}`}>
                      <div className="flex items-center gap-1 font-mono text-[10px]">
                        <span className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold border border-zinc-700">
                          {m.filingForm}
                        </span>
                        <span className="text-zinc-400">{m.asOfDate}</span>
                      </div>
                      <a
                        href={m.secViewerUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[9px] font-mono text-amber-400/80 hover:text-amber-300 hover:underline inline-flex items-center gap-0.5"
                      >
                        {m.accessionNumber.slice(0, 15)}...
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
                      title="REIT Balance Sheet: Properties and mortgage notes classified as long-term under GAAP."
                    >
                      Unclassified (REIT)
                    </span>
                  ) : m.workingCapital !== null ? (
                    <div title={`Current Assets: $${((m.currentAssets || 0)/1e6).toFixed(1)}M
Current Liabs: $${((m.currentLiabilities || 0)/1e6).toFixed(1)}M`}>
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

                {/* Monthly Burn */}
                <td className="py-3 px-3 text-right font-mono text-zinc-300">
                  {m.monthlyBurnRate > 0 ? (
                    <span title="Computed from Operating Cash Flow + Capex in latest SEC reporting period">
                      ${(m.monthlyBurnRate / 1e3).toFixed(0)}k/mo
                    </span>
                  ) : (
                    <span className="text-emerald-400/90 text-[10px] font-medium">
                      Cash Flow +
                    </span>
                  )}
                </td>

                {/* Runway */}
                <td className="py-3 px-3 text-right font-mono font-black">
                  <span 
                    title={m.calculationMethodology}
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      m.capitalNeedUrgency === "critical"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : m.capitalNeedUrgency === "urgent"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "text-zinc-300"
                    }`}
                  >
                    {m.runwayDisplay}
                  </span>
                </td>

                {/* Urgency Tier */}
                <td className="py-3 px-3 text-center">
                  <span 
                    title={m.urgencyRationale}
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border ${
                      m.capitalNeedUrgency === "critical"
                        ? "bg-rose-950/60 text-rose-300 border-rose-500/40"
                        : m.capitalNeedUrgency === "urgent"
                          ? "bg-amber-950/60 text-amber-300 border-amber-500/40"
                          : m.capitalNeedUrgency === "moderate"
                            ? "bg-blue-950/60 text-blue-300 border-blue-500/40"
                            : "bg-zinc-800 text-zinc-400 border-zinc-700"
                    }`}
                  >
                    {m.capitalNeedUrgency}
                  </span>
                </td>

                {/* 8-K Signals */}
                <td className="py-3 px-3">
                  {sigs.length > 0 ? (
                    <div className="space-y-0.5">
                      {sigs.slice(0, 2).map((s, idx) => (
                        <span 
                          key={idx}
                          title={`${s.title} (Filed: ${s.date})
Accn: ${s.accessionNumber}`}
                          className={`inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded font-bold mr-1 ${
                            s.item === "Item 3.01" 
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/30" 
                              : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                          }`}
                        >
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {s.item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-zinc-600 font-mono">None</span>
                  )}
                </td>

                {/* Key Contacts */}
                <td className="py-3 px-3">
                  <div className="text-[11px] text-zinc-200 font-medium truncate max-w-[150px]" title={ceo?.name}>
                    {ceo?.name}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    {t.telephone !== "Not yet sourced" ? t.telephone : "Phone: See SEC"}
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
                    title="Open Forensic Diligence Drawer"
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
