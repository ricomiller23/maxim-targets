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
import { Navbar, NavTab } from "@/components/Navbar";
import { FilterBar, FilterState } from "@/components/FilterBar";
import { TargetCard } from "@/components/TargetCard";
import { TargetTable } from "@/components/TargetTable";
import { TargetDrawer } from "@/components/TargetDrawer";
import { CrmPipelineView } from "@/components/CrmPipelineView";
import { RegistrationShelvesView } from "@/components/RegistrationShelvesView";
import { DistressMatrixView } from "@/components/DistressMatrixView";
import { NoActiveRegView } from "@/components/NoActiveRegView";
import { GlobalSearchModal } from "@/components/GlobalSearchModal";
import { MaximTarget, MaximDatasetMetadata } from "@/lib/types";
import { matchTargetSearch } from "@/lib/search";
import seedData from "@/data/maxim-targets.json";

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>("screener");
  
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
    noActiveRegStatements: false,
    priceRange: "all",
    volumeRange: "all",
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
      list = list.filter(t => matchTargetSearch(t, filters.search));
    }

    if (filters.sector !== "all") {
      list = list.filter(t => 
        (t.sector && t.sector.toLowerCase().includes(filters.sector.toLowerCase())) || 
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
      list = list.filter(t => t.financialMetrics.hasItem301Notice || (t.signals8K && t.signals8K.some(s => s.item === "Item 3.01")));
    }

    if (filters.hasActiveShelves) {
      list = list.filter(t => t.registrationStatements2Y.activeShelvesFiled > 0);
    }

    // Filter: No Active Registration Statements (24M)
    if (filters.noActiveRegStatements) {
      list = list.filter(t => t.noActiveRegStatements24M);
    }

    // Filter: Price Range
    if (filters.priceRange && filters.priceRange !== "all") {
      if (filters.priceRange === "penny_under_1") {
        list = list.filter(t => t.marketData?.price !== null && t.marketData.price < 1.0);
      } else if (filters.priceRange === "sub_5") {
        list = list.filter(t => t.marketData?.price !== null && t.marketData.price >= 1.0 && t.marketData.price <= 5.0);
      } else if (filters.priceRange === "mid_5_20") {
        list = list.filter(t => t.marketData?.price !== null && t.marketData.price > 5.0 && t.marketData.price <= 20.0);
      } else if (filters.priceRange === "above_20") {
        list = list.filter(t => t.marketData?.price !== null && t.marketData.price > 20.0);
      }
    }

    // Filter: Volume Range
    if (filters.volumeRange && filters.volumeRange !== "all") {
      if (filters.volumeRange === "high_above_5m") {
        list = list.filter(t => t.marketData?.avgMonthlyVolume !== null && t.marketData.avgMonthlyVolume >= 5000000);
      } else if (filters.volumeRange === "mid_500k_5m") {
        list = list.filter(t => t.marketData?.avgMonthlyVolume !== null && t.marketData.avgMonthlyVolume >= 500000 && t.marketData.avgMonthlyVolume < 5000000);
      } else if (filters.volumeRange === "low_under_500k") {
        list = list.filter(t => t.marketData?.avgMonthlyVolume !== null && t.marketData.avgMonthlyVolume < 500000);
      }
    }

    // Sort
    list.sort((a, b) => {
      if (filters.sortBy === "runway_asc") {
        return (a.financialMetrics.runwayMonths ?? 999) - (b.financialMetrics.runwayMonths ?? 999);
      }
      if (filters.sortBy === "price_desc") {
        return (b.marketData?.price ?? -999) - (a.marketData?.price ?? -999);
      }
      if (filters.sortBy === "price_asc") {
        return (a.marketData?.price ?? 999999) - (b.marketData?.price ?? 999999);
      }
      if (filters.sortBy === "volume_desc") {
        return (b.marketData?.avgMonthlyVolume ?? -1) - (a.marketData?.avgMonthlyVolume ?? -1);
      }
      if (filters.sortBy === "volume_asc") {
        return (a.marketData?.avgMonthlyVolume ?? 9999999999) - (b.marketData?.avgMonthlyVolume ?? 9999999999);
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
        setExportNotice(`Executive Dossier exported to ~/Downloads (${data.path})`);
        setTimeout(() => setExportNotice(null), 6000);
      } else {
        setExportNotice("Export error: " + data.error);
        setTimeout(() => setExportNotice(null), 5000);
      }
    } catch (err: any) {
      setExportNotice("Export request failed: " + err.message);
      setTimeout(() => setExportNotice(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        metadata={metadata}
        onOpenSearch={() => setSearchModalOpen(true)}
        onExportReport={handleExportReport}
        isExporting={isExporting}
      />

      {/* Export Notification Toast */}
      {exportNotice && (
        <div className="fixed bottom-4 right-4 z-50 rounded-2xl bg-zinc-900 border border-amber-500/50 p-4 shadow-2xl text-xs text-zinc-200 flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
          <Download className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-mono">{exportNotice}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto pb-16">
        {/* TAB 1: Screener Radar (Cards or Dense Table) */}
        {activeTab === "screener" && (
          <div className="space-y-4">
            <div className="p-4 pb-0 space-y-4">
              <FilterBar
                filters={filters}
                onChange={setFilters}
                totalFiltered={filteredTargets.length}
                totalUniverse={targets.length}
                noActiveRegCount={targets.filter(t => t.noActiveRegStatements24M).length}
              />

              {/* Forensic Metric Strip & Methodology Link */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs">
                <div className="flex items-center gap-2 text-zinc-400 font-mono text-[11px]">
                  <span>Showing <strong className="text-white">{filteredTargets.length}</strong> of {targets.length} companies</span>
                  <span>•</span>
                  <button
                    onClick={() => setMethodologyModalOpen(true)}
                    className="text-amber-400 hover:text-amber-300 underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Diligence & Tier Methodology</span>
                    <HelpCircle className="w-3 h-3" />
                  </button>
                </div>

                <button
                  onClick={() => {
                    const csvRows = [
                      ["Ticker", "Company", "CIK", "Sector", "Stock Price", "Avg Monthly Vol", "No Active Reg 24M", "Cash ($)", "Working Capital Deficit ($)", "Runway (Months)", "Urgency Tier", "Latest Form", "Period End", "SEC Accession", "SEC Receipt URL"].join(",")
                    ];
                    filteredTargets.forEach(t => {
                      csvRows.push([
                        `"${t.ticker}"`,
                        `"${t.name.replace(/"/g, '""')}"`,
                        `"${t.cik}"`,
                        `"${t.sector}"`,
                        `"${t.marketData?.priceDisplay || 'N/A'}"`,
                        `"${t.marketData?.avgMonthlyVolumeDisplay || 'N/A'}"`,
                        `"${t.noActiveRegStatements24M ? 'YES' : 'NO'}"`,
                        t.financialMetrics.cashOnHand ?? "N/A",
                        t.financialMetrics.workingCapitalDeficit,
                        t.financialMetrics.runwayMonths,
                        t.financialMetrics.capitalNeedUrgency,
                        t.financialMetrics.filingForm,
                        t.financialMetrics.asOfDate,
                        t.financialMetrics.accessionNumber,
                        t.financialMetrics.secViewerUrl || t.secEdgarUrl
                      ].join(","));
                    });
                    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `maxim-targets-filtered-${new Date().toISOString().slice(0, 10)}.csv`;
                    a.click();
                  }}
                  className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Export currently filtered targets with stock prices, volumes, and accession numbers"
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
                      noActiveRegStatements: false,
                      priceRange: "all",
                      volumeRange: "all",
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

        {/* TAB 5: No Active Reg Statements (24M) Dedicated Tab */}
        {activeTab === "no_reg" && (
          <NoActiveRegView
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

              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-1">
                <h4 className="font-bold text-rose-300 uppercase">ZERO ACTIVE REGISTRATION STATEMENTS (24-MONTH RULE)</h4>
                <p className="text-zinc-300 leading-relaxed">
                  Issuers with no Form S-1, S-3, S-8, F-1, or F-3 filings in the past 24 rolling months. These companies have zero active public shelf capacity, cannot issue shares via continuous ATM facilities without new registration, and represent key targets for private placements, debt bridges, or new underwritten public registrations.
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
