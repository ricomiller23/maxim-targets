"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Navbar, NavTab } from "@/components/Navbar";
import { FilterBar, FilterState } from "@/components/FilterBar";
import { TargetCard } from "@/components/TargetCard";
import { TargetTable } from "@/components/TargetTable";
import { TargetDrawer } from "@/components/TargetDrawer";
import { CrmPipelineView } from "@/components/CrmPipelineView";
import { RegistrationShelvesView } from "@/components/RegistrationShelvesView";
import { DistressMatrixView } from "@/components/DistressMatrixView";
import { GlobalSearchModal } from "@/components/GlobalSearchModal";
import { MaximTarget, MaximDatasetMetadata } from "@/lib/types";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [targets, setTargets] = useState<MaximTarget[]>([]);
  const [metadata, setMetadata] = useState<MaximDatasetMetadata | undefined>();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab>("screener");
  const [selectedTarget, setSelectedTarget] = useState<MaximTarget | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    sector: "all",
    workingCapital: "all",
    urgency: "all",
    status: "all",
    panelist: "all",
    sortBy: "runway_asc",
    viewMode: "cards"
  });

  // Fetch targets from API
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/targets");
      const data = await res.json();
      if (data.success) {
        setTargets(data.targets);
        setMetadata(data.metadata);
      }
    } catch (e) {
      console.error("Failed to load targets:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter and sort targets client-side
  const filteredTargets = useMemo(() => {
    let list = [...targets];

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(t => 
        t.ticker.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.sector.toLowerCase().includes(q) ||
        t.contacts.some(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
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
      list = list.filter(t => !t.financialMetrics.isNegativeWorkingCapital);
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

    // Sort
    list.sort((a, b) => {
      if (filters.sortBy === "runway_asc") {
        return a.financialMetrics.runwayMonths - b.financialMetrics.runwayMonths;
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

  // CRM update handler
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
        setExportNotice(`✓ Executive Dossier saved to: ${data.reportPath}`);
        setTimeout(() => setExportNotice(null), 5000);
      }
    } catch (e) {
      console.error("Export failed:", e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
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
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            <p className="text-xs font-mono text-zinc-400">Loading 113 Maxim Conference Targets & Solvency Screens...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: Screener Radar */}
            {activeTab === "screener" && (
              <div>
                <FilterBar
                  filters={filters}
                  onChange={setFilters}
                  totalFiltered={filteredTargets.length}
                  totalUniverse={targets.length}
                />

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
          </>
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
    </div>
  );
}
