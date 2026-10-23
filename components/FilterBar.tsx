"use client";

import React from "react";
import { 
  Search, 
  X, 
  SlidersHorizontal, 
  LayoutGrid, 
  Table as TableIcon, 
  ArrowUpDown, 
  ShieldAlert, 
  Layers, 
  Flame,
  Globe,
  FileX,
  DollarSign,
  BarChart2
} from "lucide-react";

export interface FilterState {
  search: string;
  sector: string;
  workingCapital: "all" | "negative" | "positive";
  urgency: string;
  status: "all" | "confirmed" | "invited";
  panelist: "all" | "yes" | "no";
  secStatus?: "all" | "sec_verified_filer" | "non_sec_foreign_or_private";
  hasDeficiency8K: boolean;
  hasActiveShelves: boolean;
  noActiveRegStatements?: boolean;
  priceRange?: "all" | "penny_under_1" | "sub_5" | "mid_5_20" | "above_20";
  volumeRange?: "all" | "low_under_500k" | "mid_500k_5m" | "high_above_5m";
  sortBy: "runway_asc" | "cash_desc" | "deficit_desc" | "financing_desc" | "ticker_asc" | "price_desc" | "price_asc" | "volume_desc" | "volume_asc";
  viewMode: "cards" | "table";
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  totalFiltered: number;
  totalUniverse: number;
  noActiveRegCount?: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChange,
  totalFiltered,
  totalUniverse,
  noActiveRegCount = 16
}) => {
  const update = (partial: Partial<FilterState>) => {
    onChange({ ...filters, ...partial });
  };

  const clearFilters = () => {
    onChange({
      search: "",
      sector: "all",
      workingCapital: "all",
      urgency: "all",
      status: "all",
      panelist: "all",
      secStatus: "all",
      hasDeficiency8K: false,
      hasActiveShelves: false,
      noActiveRegStatements: false,
      priceRange: "all",
      volumeRange: "all",
      sortBy: "runway_asc",
      viewMode: filters.viewMode
    });
  };

  const isFiltered = 
    filters.search !== "" ||
    filters.sector !== "all" ||
    filters.workingCapital !== "all" ||
    filters.urgency !== "all" ||
    filters.status !== "all" ||
    filters.panelist !== "all" ||
    (filters.secStatus && filters.secStatus !== "all") ||
    filters.hasDeficiency8K ||
    filters.hasActiveShelves ||
    filters.noActiveRegStatements ||
    (filters.priceRange && filters.priceRange !== "all") ||
    (filters.volumeRange && filters.volumeRange !== "all");

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3 sm:p-4 space-y-3 shadow-lg backdrop-blur-sm">
      {/* Row 1: Search & Quick Toggle Chips */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search issuers by ticker, CIK, name, price, or legal counsel..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="w-full rounded-xl bg-zinc-900 border border-zinc-800 pl-10 pr-9 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => update({ search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs">
          {/* Quick Filter: NO ACTIVE REG STATEMENTS (24M) */}
          <button
            type="button"
            onClick={() => update({ noActiveRegStatements: !filters.noActiveRegStatements })}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0 ${
              filters.noActiveRegStatements
                ? "bg-rose-950/90 border-rose-500/70 text-rose-200 font-bold shadow-md shadow-rose-950/50"
                : "bg-zinc-900/60 border-zinc-800 text-rose-400/90 hover:text-rose-200 hover:bg-zinc-800"
            }`}
            title="List issuers with zero S-1, S-3, S-8, F-1, or F-3 filings in the past 24 months"
          >
            <FileX className="w-3.5 h-3.5 text-rose-400" />
            <span>No Active Reg (24M)</span>
            <span className="rounded-full bg-rose-500/20 text-rose-300 px-1 py-0.2 text-[10px] font-mono font-bold">
              {noActiveRegCount}
            </span>
          </button>

          {/* Critical Runway (<3 Months) */}
          <button
            type="button"
            onClick={() => update({ urgency: filters.urgency === "critical" ? "all" : "critical" })}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0 ${
              filters.urgency === "critical"
                ? "bg-rose-950/80 border-rose-500/60 text-rose-300 font-bold"
                : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>Critical Runway (&lt;3 Mo)</span>
          </button>

          {/* Negative Working Capital */}
          <button
            type="button"
            onClick={() => update({ workingCapital: filters.workingCapital === "negative" ? "all" : "negative" })}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0 ${
              filters.workingCapital === "negative"
                ? "bg-amber-950/80 border-amber-500/60 text-amber-300 font-bold"
                : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Working Capital Deficit</span>
          </button>

          {/* Active S-3 Shelves */}
          <button
            type="button"
            onClick={() => update({ hasActiveShelves: !filters.hasActiveShelves })}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0 ${
              filters.hasActiveShelves
                ? "bg-purple-950/80 border-purple-500/60 text-purple-300 font-bold"
                : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Active S-3 Shelves</span>
          </button>

          {isFiltered && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold inline-flex items-center gap-1 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* View Mode Toggle & Results Count */}
        <div className="flex items-center space-x-3 shrink-0">
          <span className="text-[11px] text-zinc-400 font-mono">
            Showing <strong className="text-white">{totalFiltered}</strong> of {totalUniverse}
          </span>

          <div className="flex items-center rounded-lg bg-zinc-900 border border-zinc-800 p-0.5">
            <button
              type="button"
              onClick={() => update({ viewMode: "cards" })}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                filters.viewMode === "cards" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => update({ viewMode: "table" })}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                filters.viewMode === "table" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Dense Forensic Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Detailed Dropdown Filters (Stock Price, Volume, Sector, Runway, Sort) */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-800/40 text-xs">
        {/* Stock Price Filter */}
        <div className="flex items-center space-x-1">
          <DollarSign className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-zinc-500 text-[11px] font-semibold">Price:</span>
          <select
            value={filters.priceRange || "all"}
            onChange={(e) => update({ priceRange: e.target.value as any })}
            className="rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Prices</option>
            <option value="penny_under_1">Penny Stock (&lt; $1.00)</option>
            <option value="sub_5">Sub-$5.00 ($1.00 – $5.00)</option>
            <option value="mid_5_20">Mid-Range ($5.00 – $20.00)</option>
            <option value="above_20">Above $20.00</option>
          </select>
        </div>

        {/* Volume Filter */}
        <div className="flex items-center space-x-1">
          <BarChart2 className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-zinc-500 text-[11px] font-semibold">Monthly Vol:</span>
          <select
            value={filters.volumeRange || "all"}
            onChange={(e) => update({ volumeRange: e.target.value as any })}
            className="rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Volumes</option>
            <option value="high_above_5m">High (&gt; 5M/mo)</option>
            <option value="mid_500k_5m">Moderate (500K – 5M/mo)</option>
            <option value="low_under_500k">Thinly Traded (&lt; 500K/mo)</option>
          </select>
        </div>

        {/* Sector */}
        <div className="flex items-center space-x-1">
          <span className="text-zinc-500 text-[11px] font-semibold">Sector:</span>
          <select
            value={filters.sector}
            onChange={(e) => update({ sector: e.target.value })}
            className="rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Sectors</option>
            <option value="healthcare">Healthcare & Biotech</option>
            <option value="multi_sector">Multi-Sector Technology</option>
            <option value="Mining">Mining & Critical Minerals</option>
            <option value="Defense">Defense & Aerospace</option>
            <option value="AI">AI, Cloud & Quantum</option>
            <option value="Energy">Energy & CleanTech</option>
            <option value="REIT">Real Estate REITs</option>
          </select>
        </div>

        {/* Working Capital */}
        <div className="flex items-center space-x-1">
          <span className="text-zinc-500 text-[11px] font-semibold">Balance Sheet:</span>
          <select
            value={filters.workingCapital}
            onChange={(e) => update({ workingCapital: e.target.value as any })}
            className="rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Balance Sheets</option>
            <option value="negative">Working Capital Deficit</option>
            <option value="positive">Capital Surplus</option>
          </select>
        </div>

        {/* Cash Runway */}
        <div className="flex items-center space-x-1">
          <span className="text-zinc-500 text-[11px] font-semibold">Runway:</span>
          <select
            value={filters.urgency}
            onChange={(e) => update({ urgency: e.target.value })}
            className="rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Runways</option>
            <option value="critical">Critical (&lt;3 Months Remaining)</option>
            <option value="urgent">Urgent (3 to 6 Months Remaining)</option>
            <option value="moderate">Moderate (6 to 12 Months)</option>
            <option value="stable">Stable (&gt;12 Months)</option>
            <option value="unrated">Foreign / Unrated</option>
          </select>
        </div>

        {/* Sort By (Includes Price and Monthly Volume) */}
        <div className="flex items-center space-x-1 ml-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-zinc-500 text-[11px] font-semibold">Sort By:</span>
          <select
            value={filters.sortBy}
            onChange={(e) => update({ sortBy: e.target.value as any })}
            className="rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            <option value="runway_asc">Cash Runway (Shortest First)</option>
            <option value="price_desc">Stock Price (Highest First)</option>
            <option value="price_asc">Stock Price (Lowest First)</option>
            <option value="volume_desc">Avg Monthly Volume (Highest First)</option>
            <option value="volume_asc">Avg Monthly Volume (Lowest First)</option>
            <option value="cash_desc">Cash On Hand (Highest First)</option>
            <option value="deficit_desc">Working Capital Deficit (Highest First)</option>
            <option value="financing_desc">2Y Capital Injected (Highest First)</option>
            <option value="ticker_asc">Ticker (A to Z)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
