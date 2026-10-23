"use client";

import React, { useState, useMemo } from "react";
import { 
  FileX, 
  ShieldAlert, 
  AlertTriangle, 
  ExternalLink, 
  ChevronRight, 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  HelpCircle,
  Building2,
  DollarSign,
  TrendingDown,
  Layers,
  Sparkles,
  Mail
} from "lucide-react";
import { MaximTarget } from "@/lib/types";
import { matchTargetSearch } from "@/lib/search";

interface NoActiveRegViewProps {
  targets: MaximTarget[];
  onSelect: (target: MaximTarget) => void;
}

type SortField = "ticker" | "name" | "price" | "volume" | "cash" | "deficit" | "runway";

export const NoActiveRegView: React.FC<NoActiveRegViewProps> = ({ targets, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "sec_reporting" | "foreign" | "critical">("all");
  const [sortField, setSortField] = useState<SortField>("deficit");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Filter cohort strictly to targets with NO active registration statements (no S-1, S-3, S-8, F-1, F-3 in 24M)
  const noRegTargets = useMemo(() => {
    return targets.filter(t => t.noActiveRegStatements24M);
  }, [targets]);

  const secReportingCount = noRegTargets.filter(t => t.secStatus === "sec_verified_filer").length;
  const foreignCount = noRegTargets.filter(t => t.secStatus === "non_sec_foreign_or_private").length;
  const bankruptCount = noRegTargets.filter(t => t.secStatus === "bankrupt_defunct").length;
  const deficitTotal = noRegTargets.reduce((acc, t) => acc + (t.financialMetrics.workingCapitalDeficit || 0), 0);

  const filteredTargets = useMemo(() => {
    let list = [...noRegTargets];

    if (searchTerm) {
      list = list.filter(t => matchTargetSearch(t, searchTerm));
    }

    if (categoryFilter === "sec_reporting") {
      list = list.filter(t => t.secStatus === "sec_verified_filer");
    } else if (categoryFilter === "foreign") {
      list = list.filter(t => t.secStatus === "non_sec_foreign_or_private");
    } else if (categoryFilter === "critical") {
      list = list.filter(t => t.financialMetrics.capitalNeedUrgency === "critical" || t.financialMetrics.capitalNeedUrgency === "urgent");
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
      }

      if (typeof valA === "string") {
        return sortDirection === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDirection === "asc" ? valA - valB : valB - valA;
    });

    return list;
  }, [noRegTargets, searchTerm, categoryFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "price" || field === "volume" || field === "deficit" || field === "cash" ? "desc" : "asc");
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-zinc-600 inline ml-1 opacity-60" />;
    return sortDirection === "asc" 
      ? <ArrowUp className="w-3 h-3 text-rose-400 inline ml-1" />
      : <ArrowDown className="w-3 h-3 text-rose-400 inline ml-1" />;
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header & Mission Briefing */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileX className="w-5 h-5 text-rose-400" />
            <span>Issuers with No Active Registration Statements (24-Month Window)</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Strict regulatory audit: Issuers with <strong>zero Form S-1, S-3, S-8, F-1, or F-3 filings</strong> in the past 24 months.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-[11px] font-mono text-rose-300 flex items-center gap-2 self-start md:self-auto">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>
            {noRegTargets.length} of {targets.length} Issuers Sourced (100% Shelf-Depleted or Unregistered)
          </span>
        </div>
      </div>

      {/* Strategic Intelligence Thesis Card */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 space-y-2">
        <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-[11px] font-mono">
          <Sparkles className="w-4 h-4" />
          <span>Strategic Banker & Direct Lender Rationale</span>
        </div>
        <p className="leading-relaxed text-zinc-300">
          Companies without active registration statements have <strong>no standing shelf capacity</strong> to sell equity directly into the market via ATM facilities or universal takedowns. When capital is required, they cannot execute immediate overnight dilution without filing a new Form S-1/S-3 subject to SEC review. Consequently, these issuers represent <strong>high-conviction opportunities</strong> for non-dilutive credit bridges, senior debt, structured PIPEs, or new underwritten registration mandates.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-950/20 space-y-1">
          <span className="text-[11px] font-mono text-rose-400 font-bold uppercase">Total Zero-Reg Issuers</span>
          <div className="font-mono text-2xl font-black text-white">{noRegTargets.length}</div>
          <p className="text-[10px] text-zinc-400">Zero S-1/S-3/S-8/F-1/F-3 filed across 24 rolling months</p>
        </div>

        <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-1">
          <span className="text-[11px] font-mono text-amber-400 font-bold uppercase">SEC Domestic Filers</span>
          <div className="font-mono text-2xl font-black text-white">{secReportingCount}</div>
          <p className="text-[10px] text-zinc-400">Nouveau Monde Graphite (NMG) & ConsumerDirect (CNDR)</p>
        </div>

        <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-1">
          <span className="text-[11px] font-mono text-sky-400 font-bold uppercase">Foreign / Cross-Border</span>
          <div className="font-mono text-2xl font-black text-white">{foreignCount}</div>
          <p className="text-[10px] text-zinc-400">Presenters trading on TSX, TSXV, CSE, LSE & Euronext</p>
        </div>

        <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-1">
          <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase">Cumulative Balance Deficit</span>
          <div className="font-mono text-2xl font-black text-white">
            -${(deficitTotal / 1e6).toFixed(1)}M
          </div>
          <p className="text-[10px] text-zinc-400">Total negative working capital across unregistered roster</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ticker, name, price..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center rounded-xl bg-zinc-900 p-0.5 border border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => setCategoryFilter("all")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                categoryFilter === "all" ? "bg-zinc-800 text-white font-bold" : "text-zinc-400 hover:text-white"
              }`}
            >
              All ({noRegTargets.length})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter("sec_reporting")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                categoryFilter === "sec_reporting" ? "bg-zinc-800 text-amber-300 font-bold" : "text-zinc-400 hover:text-white"
              }`}
            >
              SEC EDGAR ({secReportingCount})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter("foreign")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                categoryFilter === "foreign" ? "bg-zinc-800 text-sky-300 font-bold" : "text-zinc-400 hover:text-white"
              }`}
            >
              Foreign / Cross-Border ({foreignCount})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter("critical")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                categoryFilter === "critical" ? "bg-zinc-800 text-rose-300 font-bold" : "text-zinc-400 hover:text-white"
              }`}
            >
              Critical / Urgent
            </button>
          </div>
        </div>

        <span className="text-xs font-mono text-zinc-400 self-end sm:self-auto">
          Displaying <strong className="text-white">{filteredTargets.length}</strong> targets
        </span>
      </div>

      {/* Dense Audited Table */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-xl">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="bg-zinc-950/80 border-b border-zinc-800 text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wider">
            <tr>
              <th className="py-3 px-3 cursor-pointer hover:text-white" onClick={() => handleSort("ticker")}>
                Issuer / Ticker {renderSortIcon("ticker")}
              </th>
              <th className="py-3 px-3">
                Venue & Regulatory Status
              </th>
              <th className="py-3 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort("price")}>
                Current Stock Price {renderSortIcon("price")}
              </th>
              <th className="py-3 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort("volume")}>
                Avg Monthly Vol {renderSortIcon("volume")}
              </th>
              <th className="py-3 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort("cash")}>
                Cash on Hand {renderSortIcon("cash")}
              </th>
              <th className="py-3 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort("deficit")}>
                Working Capital {renderSortIcon("deficit")}
              </th>
              <th className="py-3 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort("runway")}>
                Runway {renderSortIcon("runway")}
              </th>
              <th className="py-3 px-3 text-center">
                Registration Statement Audit
              </th>
              <th className="py-3 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-850">
            {filteredTargets.map((t) => {
              const m = t.financialMetrics;
              const mk = t.marketData;

              return (
                <tr
                  key={t.id}
                  onClick={() => onSelect(t)}
                  className="hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                >
                  {/* Ticker / Company */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-black text-white group-hover:text-rose-400 text-sm">
                        {t.ticker}
                      </span>
                      {t.isPanelist && (
                        <span className="rounded bg-purple-500/20 border border-purple-500/40 px-1 py-0.2 text-[9px] font-bold text-purple-300">
                          Panelist
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-300 font-semibold truncate max-w-[190px]" title={t.name}>
                      {t.name}
                    </div>
                    <div className="text-[9px] font-mono text-zinc-500 truncate max-w-[190px]">
                      {t.sector}
                    </div>
                  </td>

                  {/* Regulatory Venue */}
                  <td className="py-3 px-3 font-mono text-[11px]">
                    {t.secStatus === "sec_verified_filer" ? (
                      <div>
                        <span className="text-amber-400 font-bold">SEC Verified</span>
                        <div className="text-[9px] text-zinc-500">CIK: {t.cik}</div>
                      </div>
                    ) : t.secStatus === "bankrupt_defunct" ? (
                      <div>
                        <span className="text-rose-400 font-bold">Defunct / Ch. 11</span>
                        <div className="text-[9px] text-zinc-500">Liquidating Trust</div>
                      </div>
                    ) : (
                      <div>
                        <span className="text-sky-400 font-bold">{t.regulatoryPortal || t.exchange}</span>
                        <div className="text-[9px] text-zinc-500">{t.headquarters}</div>
                      </div>
                    )}
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
                  <td className="py-3 px-3 text-right font-mono font-bold">
                    {m.cashOnHand !== null ? (
                      <span className="text-white text-xs">{m.cashOnHandDisplay}</span>
                    ) : (
                      <span className="text-zinc-500 text-[10px] italic">
                        {m.cashOnHandDisplay}
                      </span>
                    )}
                  </td>

                  {/* Working Capital Deficit */}
                  <td className="py-3 px-3 text-right font-mono">
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

                  {/* Runway */}
                  <td className="py-3 px-3 text-right font-mono">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                      m.capitalNeedUrgency === "critical"
                        ? "text-rose-400 bg-rose-950/60 border border-rose-500/40"
                        : m.capitalNeedUrgency === "urgent"
                          ? "text-amber-400 bg-amber-950/60 border border-amber-500/40"
                          : "text-zinc-400 bg-zinc-900 border border-zinc-800"
                    }`}>
                      {m.runwayDisplay}
                    </span>
                  </td>

                  {/* Registration Audit Badge */}
                  <td className="py-3 px-3 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/50 text-rose-300 text-[9px] font-mono font-bold">
                        ZERO ACTIVE REG (24M)
                      </span>
                      <span className="text-[8px] text-zinc-500 mt-0.5 font-mono">
                        No S-1 / S-3 / S-8 / F-1 / F-3
                      </span>
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
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-500 hover:text-zinc-950 text-zinc-300 transition-colors cursor-pointer"
                      title="Inspect full filings and balance sheet"
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
    </div>
  );
};
