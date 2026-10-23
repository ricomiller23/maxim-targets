"use client";

import React, { useState, useMemo } from "react";
import { MaximTarget } from "@/lib/types";
import { matchTargetSearch } from "@/lib/search";
import { 
  BarChart3, 
  AlertTriangle, 
  Flame, 
  ShieldAlert, 
  ChevronRight, 
  CheckCircle2, 
  Globe, 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  FileX, 
  Layers,
  DollarSign,
  TrendingDown
} from "lucide-react";

interface DistressMatrixViewProps {
  targets: MaximTarget[];
  onSelect: (target: MaximTarget) => void;
}

type MatrixSortField = "ticker" | "name" | "price" | "volume" | "cash" | "deficit" | "runway" | "urgency" | "regStatus";

export const DistressMatrixView: React.FC<DistressMatrixViewProps> = ({
  targets,
  onSelect
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [matrixFilter, setMatrixFilter] = useState<"all" | "no_reg" | "critical" | "urgent" | "deficit">("all");
  const [sortField, setSortField] = useState<MatrixSortField>("runway");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const critical = targets.filter(t => t.financialMetrics.capitalNeedUrgency === "critical");
  const urgent = targets.filter(t => t.financialMetrics.capitalNeedUrgency === "urgent");
  const moderate = targets.filter(t => t.financialMetrics.capitalNeedUrgency === "moderate");
  const stable = targets.filter(t => t.financialMetrics.capitalNeedUrgency === "stable");
  const unrated = targets.filter(t => t.financialMetrics.capitalNeedUrgency === "unrated");
  const noRegCohort = targets.filter(t => t.noActiveRegStatements24M);

  // Top 20 strictly filtered by positive working capital deficit (negative working capital) and sorted descending
  const deficitTargets = [...targets]
    .filter(t => t.financialMetrics.isNegativeWorkingCapital && (t.financialMetrics.workingCapitalDeficit || 0) > 0)
    .sort((a, b) => (b.financialMetrics.workingCapitalDeficit || 0) - (a.financialMetrics.workingCapitalDeficit || 0))
    .slice(0, 20);

  const totalCohort = targets.length;
  const sumReconciled = critical.length + urgent.length + moderate.length + stable.length + unrated.length;

  const filteredMatrixTargets = useMemo(() => {
    let list = [...targets];

    if (searchTerm) {
      list = list.filter(t => matchTargetSearch(t, searchTerm));
    }

    if (matrixFilter === "no_reg") {
      list = list.filter(t => t.noActiveRegStatements24M);
    } else if (matrixFilter === "critical") {
      list = list.filter(t => t.financialMetrics.capitalNeedUrgency === "critical");
    } else if (matrixFilter === "urgent") {
      list = list.filter(t => t.financialMetrics.capitalNeedUrgency === "urgent");
    } else if (matrixFilter === "deficit") {
      list = list.filter(t => t.financialMetrics.isNegativeWorkingCapital);
    }

    list.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      switch (sortField) {
        case "ticker":
          valA = (a.ticker || "").toLowerCase();
          valB = (b.ticker || "").toLowerCase();
          break;
        case "name":
          valA = (a.name || "").toLowerCase();
          valB = (b.name || "").toLowerCase();
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
        case "deficit":
          valA = a.financialMetrics.workingCapitalDeficit ?? 0;
          valB = b.financialMetrics.workingCapitalDeficit ?? 0;
          break;
        case "runway":
          valA = a.financialMetrics.runwayMonths ?? 999;
          valB = b.financialMetrics.runwayMonths ?? 999;
          break;
        case "urgency": {
          const weights: Record<string, number> = { critical: 4, urgent: 3, moderate: 2, stable: 1, unrated: 0 };
          valA = weights[a.financialMetrics.capitalNeedUrgency] || 0;
          valB = weights[b.financialMetrics.capitalNeedUrgency] || 0;
          break;
        }
        case "regStatus":
          valA = a.noActiveRegStatements24M ? 1 : 0;
          valB = b.noActiveRegStatements24M ? 1 : 0;
          break;
      }

      if (typeof valA === "string") {
        return sortDirection === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDirection === "asc" ? valA - valB : valB - valA;
    });

    return list;
  }, [targets, searchTerm, matrixFilter, sortField, sortDirection]);

  const handleSort = (field: MatrixSortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "price" || field === "volume" || field === "deficit" || field === "cash" ? "desc" : "asc");
    }
  };

  const renderSortIcon = (field: MatrixSortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-zinc-600 inline ml-1 opacity-60" />;
    return sortDirection === "asc" 
      ? <ArrowUp className="w-3 h-3 text-amber-400 inline ml-1" />
      : <ArrowDown className="w-3 h-3 text-amber-400 inline ml-1" />;
  };

  return (
    <div className="p-4 space-y-6">
      {/* Top Header & Reconciled Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-rose-400" />
            <span>Forensic Distress, Market Quotes & Capital Urgency Matrix</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Categorizing presenting companies by stock price, 30-day trading volume, remaining cash runway, and 24-month registration statement status.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300 flex items-center gap-2 self-start sm:self-auto">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            Cohort Reconciled: <strong>{sumReconciled} of {totalCohort}</strong> (100% Accounted For)
          </span>
        </div>
      </div>

      {/* 5 Urgency Tiers Summary (Reconciles exactly to total targets) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Tier 1: Critical */}
        <div 
          onClick={() => setMatrixFilter(matrixFilter === "critical" ? "all" : "critical")}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
            matrixFilter === "critical" ? "bg-rose-950/60 border-rose-500 shadow-md" : "border-rose-500/40 bg-rose-950/20 hover:border-rose-500"
          }`}
        >
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
        <div 
          onClick={() => setMatrixFilter(matrixFilter === "urgent" ? "all" : "urgent")}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
            matrixFilter === "urgent" ? "bg-amber-950/60 border-amber-500 shadow-md" : "border-amber-500/40 bg-amber-950/20 hover:border-amber-500"
          }`}
        >
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

      {/* MATRIX TABLE SECTION: With Stock Price, Monthly Volume & No Active Reg Filter */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span>Full Dilution & Valuation Matrix Roster</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Live market quotes, monthly trading liquidity, balance sheet deficits & 24-month registration statement verification.
            </p>
          </div>

          {/* Quick Filter Buttons & Search */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Matrix..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center rounded-xl bg-zinc-950 p-0.5 border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setMatrixFilter("all")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  matrixFilter === "all" ? "bg-zinc-800 text-white font-bold" : "text-zinc-400 hover:text-white"
                }`}
              >
                All ({totalCohort})
              </button>

              {/* DEDICATED MATRIX FILTER FOR NO ACTIVE REG STATEMENTS */}
              <button
                type="button"
                onClick={() => setMatrixFilter(matrixFilter === "no_reg" ? "all" : "no_reg")}
                className={`px-2.5 py-1 rounded-lg transition-all inline-flex items-center gap-1.5 ${
                  matrixFilter === "no_reg" ? "bg-rose-950 text-rose-200 border border-rose-500 font-bold" : "text-rose-400 hover:text-white"
                }`}
              >
                <FileX className="w-3.5 h-3.5 text-rose-400" />
                <span>No Active Reg ({noRegCohort.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setMatrixFilter(matrixFilter === "critical" ? "all" : "critical")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  matrixFilter === "critical" ? "bg-zinc-800 text-rose-400 font-bold" : "text-zinc-400 hover:text-white"
                }`}
              >
                Critical ({critical.length})
              </button>

              <button
                type="button"
                onClick={() => setMatrixFilter(matrixFilter === "deficit" ? "all" : "deficit")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  matrixFilter === "deficit" ? "bg-zinc-800 text-amber-400 font-bold" : "text-zinc-400 hover:text-white"
                }`}
              >
                Working Capital Deficit
              </button>
            </div>
          </div>
        </div>

        {/* Dense Matrix Table */}
        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/70">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950 border-b border-zinc-800 text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wider">
              <tr>
                <th className="py-2.5 px-3 cursor-pointer hover:text-white" onClick={() => handleSort("ticker")}>
                  Ticker / Entity {renderSortIcon("ticker")}
                </th>
                <th className="py-2.5 px-3 cursor-pointer hover:text-white" onClick={() => handleSort("urgency")}>
                  Tier / Runway {renderSortIcon("urgency")}
                </th>
                {/* 1 or 2 columns within matrix: Stock Price and Monthly Volume */}
                <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort("price")}>
                  Current Stock Price {renderSortIcon("price")}
                </th>
                <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort("volume")}>
                  Avg Monthly Vol {renderSortIcon("volume")}
                </th>
                <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort("cash")}>
                  Cash on Hand {renderSortIcon("cash")}
                </th>
                <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort("deficit")}>
                  Working Capital {renderSortIcon("deficit")}
                </th>
                <th className="py-2.5 px-3 text-center cursor-pointer hover:text-white" onClick={() => handleSort("regStatus")}>
                  24M Reg Statement Status {renderSortIcon("regStatus")}
                </th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {filteredMatrixTargets.map((t) => {
                const m = t.financialMetrics;
                const mk = t.marketData;
                const r = t.registrationStatements2Y;

                return (
                  <tr
                    key={t.id}
                    onClick={() => onSelect(t)}
                    className="hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                  >
                    {/* Ticker / Entity */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-black text-white group-hover:text-amber-400 text-sm">
                          {t.ticker}
                        </span>
                        {t.isPanelist && (
                          <span className="rounded bg-purple-500/20 border border-purple-500/40 px-1 py-0.2 text-[9px] font-bold text-purple-300">
                            Panelist
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-400 truncate max-w-[170px]" title={t.name}>
                        {t.name}
                      </div>
                    </td>

                    {/* Tier / Runway */}
                    <td className="py-2.5 px-3 font-mono">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
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
                        {m.capitalNeedUrgency.toUpperCase()} • {m.runwayDisplay}
                      </span>
                    </td>

                    {/* Stock Price Column within Matrix */}
                    <td className="py-2.5 px-3 text-right font-mono">
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

                    {/* Avg Monthly Volume Column within Matrix */}
                    <td className="py-2.5 px-3 text-right font-mono">
                      {mk && mk.avgMonthlyVolume !== null ? (
                        <div>
                          <span className="text-white font-bold text-xs">{mk.avgMonthlyVolumeDisplay}</span>
                          <span className="block text-[9px] text-zinc-500">
                            {mk.avgDailyVolume ? `${(mk.avgDailyVolume / 1e3).toFixed(0)}K/day` : "30d avg"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-500 text-[10px] italic">
                          {mk?.avgMonthlyVolumeDisplay || "N/A"}
                        </span>
                      )}
                    </td>

                    {/* Cash on Hand */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      {m.cashOnHand !== null ? (
                        <span className="text-white text-xs">{m.cashOnHandDisplay}</span>
                      ) : (
                        <span className="text-zinc-500 text-[10px] italic">
                          {m.cashOnHandDisplay}
                        </span>
                      )}
                    </td>

                    {/* Working Capital */}
                    <td className="py-2.5 px-3 text-right font-mono">
                      {m.isNegativeWorkingCapital ? (
                        <span className="text-rose-400 font-bold text-xs">
                          {m.workingCapitalDisplay}
                        </span>
                      ) : m.workingCapital !== null ? (
                        <span className="text-emerald-400 font-bold text-xs">
                          {m.workingCapitalDisplay}
                        </span>
                      ) : (
                        <span className="text-zinc-500 text-[10px] italic">
                          {m.workingCapitalDisplay}
                        </span>
                      )}
                    </td>

                    {/* 24M Registration Statement Status Column */}
                    <td className="py-2.5 px-3 text-center">
                      {t.noActiveRegStatements24M ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 text-[9px] font-mono font-bold inline-flex items-center gap-1">
                          <FileX className="w-2.5 h-2.5 text-rose-400" />
                          <span>No Active Reg (24M)</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[9px] font-mono inline-flex items-center gap-1">
                          <Layers className="w-2.5 h-2.5 text-purple-400" />
                          <span>
                            {r.activeShelvesFiled > 0 ? "Active S-3/F-3" : r.filingCount > 0 ? `${r.filingCount} Filings` : "Active Reg"}
                          </span>
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(t);
                        }}
                        className="p-1 rounded bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-zinc-300 transition-colors"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
            const mk = t.marketData;

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

                {/* Stock Price & Monthly Volume in Matrix Card */}
                <div className="py-1 px-2 rounded-lg bg-zinc-900/80 border border-zinc-850 flex justify-between items-center text-[10px] font-mono">
                  <span className="text-zinc-400">
                    Price: <strong className="text-white">{mk?.priceDisplay || "N/A"}</strong>
                  </span>
                  <span className="text-zinc-400">
                    Vol: <strong className="text-amber-400">{mk?.avgMonthlyVolumeDisplay || "N/A"}</strong>
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
                  <span className="truncate max-w-[120px]">
                    {t.noActiveRegStatements24M ? (
                      <span className="text-rose-400 font-semibold">No Reg (24M)</span>
                    ) : (
                      t.sector
                    )}
                  </span>
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
