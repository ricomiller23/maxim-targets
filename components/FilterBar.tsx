"use client";

import React from "react";
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  LayoutGrid, 
  Table as TableIcon, 
  Flame, 
  Mic, 
  CheckCircle2, 
  AlertTriangle,
  X
} from "lucide-react";

export interface FilterState {
  search: string;
  sector: string;
  workingCapital: "all" | "negative" | "positive";
  urgency: string;
  status: "all" | "confirmed" | "invited";
  panelist: "all" | "yes" | "no";
  sortBy: "runway_asc" | "deficit_desc" | "financing_desc" | "ticker_asc";
  viewMode: "cards" | "table";
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  totalFiltered: number;
  totalUniverse: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChange,
  totalFiltered,
  totalUniverse
}) => {
  const update = (partial: Partial<FilterState>) => {
    onChange({ ...filters, ...partial });
  };

  const isFiltered = 
    filters.search !== "" ||
    filters.sector !== "all" ||
    filters.workingCapital !== "all" ||
    filters.urgency !== "all" ||
    filters.status !== "all" ||
    filters.panelist !== "all";

  const clearFilters = () => {
    onChange({
      search: "",
      sector: "all",
      workingCapital: "all",
      urgency: "all",
      status: "all",
      panelist: "all",
      sortBy: "runway_asc",
      viewMode: filters.viewMode
    });
  };

  return (
    <div className="border-b border-zinc-800/80 bg-zinc-900/40 p-4 space-y-3">
      {/* Row 1: Search, Quick Filter Pills, View Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search company, ticker, CIK, CEO, CFO, outside counsel..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="w-full rounded-xl bg-zinc-900 border border-zinc-800 pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60"
          />
          {filters.search && (
            <button
              onClick={() => update({ search: "" })}
              className="absolute right-3 top-2.5 text-zinc-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Macro Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => update({ workingCapital: filters.workingCapital === "negative" ? "all" : "negative" })}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer inline-flex items-center gap-1.5 ${
              filters.workingCapital === "negative"
                ? "bg-rose-950/80 border-rose-500/60 text-rose-300 font-bold"
                : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Negative Working Capital</span>
          </button>

          <button
            type="button"
            onClick={() => update({ urgency: filters.urgency === "critical" ? "all" : "critical" })}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer inline-flex items-center gap-1.5 ${
              filters.urgency === "critical"
                ? "bg-amber-950/80 border-amber-500/60 text-amber-300 font-bold"
                : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Critical Runway (&lt;3Mo)</span>
          </button>

          <button
            type="button"
            onClick={() => update({ panelist: filters.panelist === "yes" ? "all" : "yes" })}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer inline-flex items-center gap-1.5 ${
              filters.panelist === "yes"
                ? "bg-purple-950/80 border-purple-500/60 text-purple-300 font-bold"
                : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-purple-400" />
            <span>Panel Speakers</span>
          </button>

          {isFiltered && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold inline-flex items-center gap-1"
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
              className={`p-1.5 rounded-md transition-all ${
                filters.viewMode === "cards" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => update({ viewMode: "table" })}
              className={`p-1.5 rounded-md transition-all ${
                filters.viewMode === "table" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Dense Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Detailed Dropdown Filters */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-800/40 text-xs">
        {/* Sector */}
        <div className="flex items-center space-x-1">
          <span className="text-zinc-500 text-[11px] font-semibold">Sector:</span>
          <select
            value={filters.sector}
            onChange={(e) => update({ sector: e.target.value })}
            className="rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Sectors (Multi + Healthcare)</option>
            <option value="healthcare">Healthcare & Biotech Only</option>
            <option value="multi_sector">Multi-Sector Technology Only</option>
            <option value="Mining">Mining & Critical Minerals</option>
            <option value="Defense">Defense, Space & Drones</option>
            <option value="AI">AI, Cloud & Quantum</option>
            <option value="Energy">Energy & CleanTech</option>
            <option value="REIT">Real Estate & Healthcare REITs</option>
          </select>
        </div>

        {/* Working Capital */}
        <div className="flex items-center space-x-1">
          <span className="text-zinc-500 text-[11px] font-semibold">Working Capital:</span>
          <select
            value={filters.workingCapital}
            onChange={(e) => update({ workingCapital: e.target.value as any })}
            className="rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Positions</option>
            <option value="negative">Negative Deficit (Current Assets &lt; Current Liabs)</option>
            <option value="positive">Positive Working Capital Surplus</option>
          </select>
        </div>

        {/* Cash Runway */}
        <div className="flex items-center space-x-1">
          <span className="text-zinc-500 text-[11px] font-semibold">Cash Runway:</span>
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
          </select>
        </div>

        {/* Conference Status */}
        <div className="flex items-center space-x-1">
          <span className="text-zinc-500 text-[11px] font-semibold">Attendance:</span>
          <select
            value={filters.status}
            onChange={(e) => update({ status: e.target.value as any })}
            className="rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Attendees</option>
            <option value="confirmed">Confirmed Exhibitors</option>
            <option value="invited">Invited Exhibitors</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="flex items-center space-x-1 ml-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-zinc-500 text-[11px] font-semibold">Sort By:</span>
          <select
            value={filters.sortBy}
            onChange={(e) => update({ sortBy: e.target.value as any })}
            className="rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            <option value="runway_asc">Cash Runway (Shortest First)</option>
            <option value="deficit_desc">Working Capital Deficit (Highest First)</option>
            <option value="financing_desc">2Y Dilutive Capital Raised (Highest First)</option>
            <option value="ticker_asc">Ticker (A to Z)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
