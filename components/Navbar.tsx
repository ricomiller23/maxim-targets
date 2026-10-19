"use client";

import React from "react";
import { 
  Flame, 
  Search, 
  FileDown, 
  SlidersHorizontal, 
  Briefcase, 
  Layers, 
  BarChart3, 
  Sparkles,
  ShieldAlert,
  FileSpreadsheet,
  Building2,
  FileX
} from "lucide-react";
import { MaximDatasetMetadata } from "@/lib/types";

export type NavTab = "screener" | "crm" | "shelves" | "distress" | "no_reg";

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  metadata?: MaximDatasetMetadata;
  onOpenSearch: () => void;
  onExportReport: () => void;
  isExporting: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  metadata,
  onOpenSearch,
  onExportReport,
  isExporting
}) => {
  const noRegCount = metadata?.noActiveRegStatementsCount ?? 16;
  const totalTargets = metadata?.totalTargets || 113;

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
      {/* Top Telemetry Radar Bar */}
      <div className="border-b border-zinc-900 bg-zinc-900/50 px-4 py-1.5 text-[11px] text-zinc-400 font-mono">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 overflow-x-auto scrollbar-none">
          <div className="flex items-center space-x-2.5 shrink-0">
            <span className="flex items-center space-x-1.5 text-amber-400 font-bold">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span>MAXIM CONFERENCE 2026 FORENSIC RADAR</span>
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400 hidden sm:inline">
              113 Exhibiting & Presenting Companies • Dilution, Stock Quotes & Shelf Telemetry
            </span>
          </div>

          <div className="flex items-center space-x-4 shrink-0 text-[10px] sm:text-[11px]">
            <span>
              TOTAL TARGETS: <strong className="text-white">{totalTargets}</strong>
            </span>
            <span className="text-zinc-700">|</span>
            <span>
              NEG WORKING CAPITAL:{" "}
              <strong className="text-rose-400">
                {metadata?.negativeWorkingCapitalCount ?? 23} (
                {Math.round(((metadata?.negativeWorkingCapitalCount ?? 23) / totalTargets) * 100)}%)
              </strong>
            </span>
            <span className="text-zinc-700 hidden md:inline">|</span>
            <span className="hidden md:inline">
              CRITICAL RUNWAY (&lt;3MO):{" "}
              <strong className="text-amber-400">{metadata?.criticalCount ?? 12}</strong>
            </span>
            <span className="text-zinc-700 hidden lg:inline">|</span>
            <span className="hidden lg:inline">
              NO ACTIVE REG (24M):{" "}
              <strong className="text-rose-400">
                {noRegCount} ({Math.round((noRegCount / totalTargets) * 100)}%)
              </strong>
            </span>
            <span className="text-zinc-700 hidden lg:inline">|</span>
            <span className="hidden lg:inline">
              SEC FILERS:{" "}
              <strong className="text-emerald-400">
                {metadata?.secFilersCount ?? 99} / {totalTargets}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 gap-3">
        {/* Brand */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-zinc-950 font-black shadow-lg shadow-amber-500/20">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-white font-mono">MAXIM TARGETS</span>
              <span className="rounded-md bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 tracking-wider uppercase">
                CAPITAL CRM
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-medium">Conference Diligence, Market Data & Restructuring Engine</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="hidden md:flex items-center space-x-1 rounded-xl bg-zinc-900/80 p-1 border border-zinc-800/80 text-xs font-semibold">
          <button
            type="button"
            onClick={() => onTabChange("screener")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "screener"
                ? "bg-zinc-800 text-white shadow-sm font-bold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>Screener Radar</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("crm")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "crm"
                ? "bg-zinc-800 text-white shadow-sm font-bold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-blue-400" />
            <span>CRM Pipeline</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("shelves")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "shelves"
                ? "bg-zinc-800 text-white shadow-sm font-bold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Registration Filings</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("distress")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "distress"
                ? "bg-zinc-800 text-white shadow-sm font-bold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-rose-400" />
            <span>Distress Matrix</span>
          </button>

          {/* NEW DEDICATED TAB: No Active Reg Statements (24M) */}
          <button
            type="button"
            onClick={() => onTabChange("no_reg")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "no_reg"
                ? "bg-rose-950/80 text-rose-200 border border-rose-500/60 shadow-sm font-bold"
                : "text-rose-400/90 hover:text-rose-200 hover:bg-zinc-800/50"
            }`}
          >
            <FileX className="w-3.5 h-3.5 text-rose-400" />
            <span>No Active Reg (24M)</span>
            <span className="rounded-full bg-rose-500/20 text-rose-300 px-1.5 py-0.2 text-[10px] font-mono font-bold">
              {noRegCount}
            </span>
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Quick Search */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex items-center space-x-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search Targets & Quotes...</span>
            <kbd className="hidden sm:inline-block rounded bg-zinc-800 px-1 py-0.5 text-[10px] text-zinc-500 font-mono">
              ⌘K
            </kbd>
          </button>

          {/* Export CSV */}
          <a
            href="/api/export"
            download
            className="flex items-center space-x-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
            title="Download CSV database export including Stock Price & Avg Monthly Volume"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Export CSV</span>
          </a>

          {/* Export Executive Briefing to ~/Downloads */}
          <button
            type="button"
            onClick={onExportReport}
            disabled={isExporting}
            className="flex items-center space-x-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-3.5 py-1.5 text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            title="Generate comprehensive Markdown dossier to ~/Downloads"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>{isExporting ? "Generating..." : "Download Dossier"}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
