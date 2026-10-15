"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  Loader2, 
  Download, 
  HelpCircle, 
  ShieldCheck, 
  Flame, 
  AlertTriangle, 
  ExternalLink,
  BookOpen
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { FilterBar, FilterState } from "@/components/FilterBar";
import { TargetCard } from "@/components/TargetCard";
import { TargetTable } from "@/components/TargetTable";
import { TargetDrawer } from "@/components/TargetDrawer";
import { CrmPipelineView } from "@/components/CrmPipelineView";
import { RegistrationShelvesView } from "@/components/RegistrationShelvesView";
import { DistressMatrixView } from "@/components/DistressMatrixView";
import { GlobalSearchModal } from "@/components/GlobalSearchModal";
import { MaximTarget, MaximDatasetMetadata } from "@/lib/types";
import seedData from "@/data/maxim-targets.json";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"screener" | "crm" | "shelves" | "distress">("screener");
  
  // Instant Initial State — No Blank Loading Shell (Standing Rule 9)
  const [targets, setTargets] = useState<MaximTarget[]>(seedData.targets as unknown as MaximTarget[]);
  const [metadata, setMetadata] = useState<MaximDatasetMetadata>(seedData.metadata as unknown as MaximDatasetMetadata);
  const [loading, setLoading] = useState<boolean>(false);

  const [selectedTarget, setSelectedTarget] = useState<MaximTarget | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [methodologyModalOpen, setMethodologyModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    sector: "all",
    workingCapital: "all",
    urgency: "all",
    status: "all",
    panelist: "all",
    secStatus: "all",
    hasDeficiency8K: false,
    hasActiveShelves: false,
    sortBy: "runway_asc",
    viewMode: "table" // Default to dense forensic table view per review
  });

  // Revalidate state in background if needed
  useEffect(() => {
    fetch("/api/targets")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.targets) {
          setTargets(data.targets);
          if (data.metadata) setMetadata(data.metadata);
        }
      })
      .catch((err) => console.error("Data refresh error:", err));
  }, []);

  // Filtered & Sorted targets computation
  const filteredTargets = useMemo(() => {
    let list = [...targets];

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(t => 
        t.name.toLowerCase().includes(q) ||
        t.ticker.toLowerCase().includes(q) ||
        t.sector.toLowerCase().includes(q) ||
        t.cik.toLowerCase().includes(q) ||
        t.contacts.some(c => c.name.toLowerCase().includes(q) || (c.firm && c.firm.toLowerCase().includes(q)))
      );
    }

    if (filters.sector !== "all") {
      list = list.filter(t => 
        t.sector.toLowerCase().includes(filters.sector.toLowerCase()) || 
        t.category === filters.sector
      );
    }

    if (filters.workingCapital === "negative") {
      list = list.filter(t => t.financialMetrics.isNegativeWorkingCapital);
    } else if (filters.workingCapital === "positive") {
      list = list.filter(t => !t.financialMetrics.isNegativeWorkingCapital && t.financialMetrics.workingCapital !== null);
    }

    if (filters.urgency !== "all") {
      list = list.filter(t => t.financialMetrics.capitalNeedUrgency === filters.urgency);
    }

    if (filters.status !== "all") {
      list = list.filter(t => t.status === filters.status);
    }

    if (filters.panelist === "yes") {
      list = list.filter(t => t.isPanelist);
    } else if (filters.panelist === "no") {
      list = list.filter(t => !t.isPanelist);
    }

    if (filters.secStatus && filters.secStatus !== "all") {
      list = list.filter(t => t.secStatus === filters.secStatus);
    }

    if (filters.hasDeficiency8K) {
      list = list.filter(t => t.signals8K && t.signals8K.some(s => s.item === "Item 3.01"));
    }

    if (filters.hasActiveShelves) {
      list = list.filter(t => t.registrationStatements2Y.activeShelvesFiled > 0);
    }

    // Sort
    list.sort((a, b) => {
      if (filters.sortBy === "runway_asc") {
        return (a.financialMetrics.runwayMonths ?? 999) - (b.financialMetrics.runwayMonths ?? 999);
      }
      if (filters.sortBy === "cash_desc") {
        return (b.financialMetrics.cashOnHand ?? -1) - (a.financialMetrics.cashOnHand ?? -1);
      }
      if (filters.sortBy === "deficit_desc") {
        return b.financialMetrics.workingCapitalDeficit - a.financialMetrics.workingCapitalDeficit;
      }
      if (filters.sortBy === "financing_desc") {
        return b.financingHistory2Y.totalRaised - a.financingHistory2Y.totalRaised;
      }
      if (filters.sortBy === "ticker_asc") {
        return a.ticker.localeCompare(b.ticker);
      }
      return 0;
    });

    return list;
  }, [targets, filters]);

  // CRM update handlers
  const handleUpdateStage = async (targetId: string, stage: any) => {
    try {
      const res = await fetch("/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, stage })
      });
      const data = await res.json();
      if (data.success && data.target) {
        setTargets(prev => prev.map(t => t.id === targetId ? data.target : t));
        if (selectedTarget?.id === targetId) setSelectedTarget(data.target);
      }
    } catch (e) {
      console.error("Stage update failed:", e);
    }
  };

  const handleAddNote = async (targetId: string, noteText: string) => {
    try {
      const res = await fetch("/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, noteText })
      });
      const data = await res.json();
      if (data.success && data.target) {
        setTargets(prev => prev.map(t => t.id === targetId ? data.target : t));
        if (selectedTarget?.id === targetId) setSelectedTarget(data.target);
      }
    } catch (e) {
      console.error("Note addition failed:", e);
    }
  };

  const handleLogActivity = async (targetId: string, activity: any) => {
    try {
      const res = await fetch("/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, activity })
      });
      const data = await res.json();
      if (data.success && data.target) {
        setTargets(prev => prev.map(t => t.id === targetId ? data.target : t));
        if (selectedTarget?.id === targetId) setSelectedTarget(data.target);
      }
    } catch (e) {
      console.error("Activity log failed:", e);
    }
  };

  // Export Executive Dossier to ~/Downloads
  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/export", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setExportNotice(`✓ Forensic Dossier exported to: ${data.reportPath}`);
        setTimeout(() => setExportNotice(null), 6000);
      }
    } catch (e) {
      console.error("Export failed:", e);
    } finally {
      setIsExporting(false);
    }
  };

  // Export Filtered CSV directly
  const handleExportFilteredCsv = () => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.sector !== "all") params.set("sector", filters.sector);
    if (filters.workingCapital !== "all") params.set("workingCapital", filters.workingCapital);
    if (filters.urgency !== "all") params.set("urgency", filters.urgency);
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.panelist !== "all") params.set("panelist", filters.panelist);
    if (filters.secStatus && filters.secStatus !== "all") params.set("secStatus", filters.secStatus);

    window.open(`/api/export?${params.toString()}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        metadata={metadata}
        onOpenSearch={() => setSearchModalOpen(true)}
        onExportReport={handleExportReport}
        isExporting={isExporting}
      />

      {/* Export Toast Notification */}
      {exportNotice && (
        <div className="bg-emerald-950 border-b border-emerald-500/40 text-emerald-300 px-4 py-2 text-xs font-mono font-bold text-center animate-in fade-in duration-200">
          {exportNotice}
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto pb-12">
        {/* TAB 1: Screener Radar */}
        {activeTab === "screener" && (
          <div>
            <FilterBar
              filters={filters}
              onChange={setFilters}
              totalFiltered={filteredTargets.length}
              totalUniverse={targets.length}
            />

            {/* Quick Actions & Methodology Banner */}
            <div className="px-4 pt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMethodologyModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-850 inline-flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Diligence Methodology & Tier Definitions</span>
                </button>
                <span className="text-[11px] text-zinc-500 font-mono">
                  SEC EDGAR XBRL Live Receipts
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportFilteredCsv}
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-amber-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Export currently filtered targets with accession numbers & source links"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Export Filtered CSV ({filteredTargets.length})</span>
                </button>
              </div>
            </div>

            <div className="p-4">
              {filteredTargets.length === 0 ? (
                <div className="text-center py-20 rounded-2xl border border-zinc-800 bg-zinc-900/40">
                  <p className="text-zinc-400 text-sm font-semibold">No companies match current filter parameters.</p>
                  <button
                    onClick={() => setFilters({
                      search: "",
                      sector: "all",
                      workingCapital: "all",
                      urgency: "all",
                      status: "all",
                      panelist: "all",
                      secStatus: "all",
                      hasDeficiency8K: false,
                      hasActiveShelves: false,
                      sortBy: "runway_asc",
                      viewMode: filters.viewMode
                    })}
                    className="mt-3 px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : filters.viewMode === "cards" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTargets.map((target) => (
                    <TargetCard
                      key={target.id}
                      target={target}
                      onSelect={setSelectedTarget}
                      onQuickStageChange={handleUpdateStage}
                    />
                  ))}
                </div>
              ) : (
                <TargetTable
                  targets={filteredTargets}
                  onSelect={setSelectedTarget}
                />
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CRM Pipeline Kanban */}
        {activeTab === "crm" && (
          <CrmPipelineView
            targets={targets}
            onSelect={setSelectedTarget}
            onUpdateStage={handleUpdateStage}
          />
        )}

        {/* TAB 3: S-3 Shelves & ATM */}
        {activeTab === "shelves" && (
          <RegistrationShelvesView
            targets={targets}
            onSelect={setSelectedTarget}
          />
        )}

        {/* TAB 4: Distress Matrix */}
        {activeTab === "distress" && (
          <DistressMatrixView
            targets={targets}
            onSelect={setSelectedTarget}
          />
        )}
      </main>

      {/* Sliding Diligence Drawer */}
      <TargetDrawer
        target={selectedTarget}
        onClose={() => setSelectedTarget(null)}
        onUpdateStage={handleUpdateStage}
        onAddNote={handleAddNote}
        onLogActivity={handleLogActivity}
      />

      {/* Global Cmd+K Search Modal */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        targets={targets}
        onSelect={setSelectedTarget}
      />

      {/* Methodology & Tier Thresholds Modal (Standing Rule 5) */}
      {methodologyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Diligence Scoring & Urgency Methodology
                </h3>
              </div>
              <button
                onClick={() => setMethodologyModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg bg-zinc-900 border border-zinc-800"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-zinc-300 space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-850 space-y-1">
                <h4 className="font-bold text-rose-400 uppercase">🔴 CRITICAL URGENCY TIER</h4>
                <p className="text-zinc-300 leading-relaxed">
                  Triggered if: (1) Estimated Cash Runway &lt; 3 Months, OR (2) Form 8-K Item 3.01 Exchange Listing Deficiency notice active (bid price &lt; $1.00 or stockholders equity deficit), OR (3) Negative Working Capital Deficit &gt; $20M with runway &lt; 6 months. Requires immediate structured bridge or reverse split.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-850 space-y-1">
                <h4 className="font-bold text-amber-400 uppercase">🟡 URGENT URGENCY TIER</h4>
                <p className="text-zinc-300 leading-relaxed">
                  Triggered if: Estimated Cash Runway is between 3 and 6 Months, OR Negative Working Capital Deficit &gt; $5M. Imminent refinancing, ATM drawdown, or shelf sale required within two fiscal quarters.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-850 space-y-1">
                <h4 className="font-bold text-blue-400 uppercase">🔵 MODERATE URGENCY TIER</h4>
                <p className="text-zinc-300 leading-relaxed">
                  Triggered if: Estimated Cash Runway is 6 to 12 Months, or active continuous ATM shelf usage is maintaining liquidity.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-850 space-y-1">
                <h4 className="font-bold text-emerald-400 uppercase">🟢 STABLE / CASH FLOW POSITIVE</h4>
                <p className="text-zinc-300 leading-relaxed">
                  Triggered if: Runway &gt; 12 Months, or company is cash flow positive from operations.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-850 space-y-1">
                <h4 className="font-bold text-sky-400 uppercase">🌐 FOREIGN & EXEMPT ISSUERS (UNRATED)</h4>
                <p className="text-zinc-300 leading-relaxed">
                  Canadian issuers file under SEDAR+; UK issuers file on London Stock Exchange RNS; closed-end funds file Form N-CSR. Not screenable via Form 10-Q XBRL.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-1">
                <h4 className="font-bold text-amber-300 uppercase">BABY SHELF LIMITATION (INSTRUCTION I.B.6)</h4>
                <p className="text-zinc-300 leading-relaxed">
                  Under SEC Form S-3 General Instruction I.B.6, an issuer with a public float under $75 million cannot sell more than one-third (33.3%) of its aggregate market value in any rolling 12-month period, creating a hard regulatory barrier to continuous dilution.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800 text-right">
              <button
                onClick={() => setMethodologyModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs"
              >
                Close & Return to Screener
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
