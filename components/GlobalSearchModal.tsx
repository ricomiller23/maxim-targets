"use client";

import React, { useState, useEffect } from "react";
import { Search, X, ChevronRight, Mic, Flame, Building2, FileX } from "lucide-react";
import { MaximTarget } from "@/lib/types";
import { matchTargetSearch } from "@/lib/search";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  targets: MaximTarget[];
  onSelect: (target: MaximTarget) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  targets,
  onSelect
}) => {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();
  const results = q === "" 
    ? targets.slice(0, 8) 
    : targets.filter(t => matchTargetSearch(t, query)).slice(0, 15);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 p-4 border-b border-zinc-800 bg-zinc-900/50">
          <Search className="w-5 h-5 text-amber-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search by ticker (e.g. ONDS, RCAT, NMG), stock price, monthly vol, or 'no reg'..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
          />
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[420px] overflow-y-auto divide-y divide-zinc-850 p-2">
          {results.map((t) => {
            const m = t.financialMetrics;
            const mk = t.marketData;
            const ceo = t.contacts.find(c => c.id.includes("ceo"));

            return (
              <div
                key={t.id}
                onClick={() => {
                  onSelect(t);
                  onClose();
                }}
                className="p-3 rounded-xl hover:bg-zinc-850/60 transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-amber-400 text-sm">{t.ticker}</span>
                    <span className="text-xs font-bold text-white">{t.name}</span>
                    {t.isPanelist && (
                      <span className="text-[9px] font-bold text-purple-300 bg-purple-500/10 border border-purple-500/30 px-1.5 py-0.2 rounded">
                        Panel
                      </span>
                    )}
                    {t.noActiveRegStatements24M && (
                      <span className="text-[9px] font-bold text-rose-300 bg-rose-950/80 border border-rose-500/40 px-1.5 py-0.2 rounded font-mono inline-flex items-center gap-0.5">
                        <FileX className="w-2.5 h-2.5 text-rose-400" />
                        No Reg (24M)
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-400 flex items-center gap-2 flex-wrap">
                    <span className="text-white font-mono font-bold">
                      Price: {mk?.priceDisplay || "N/A"}
                    </span>
                    <span>•</span>
                    <span className="text-amber-400 font-mono font-semibold">
                      Vol: {mk?.avgMonthlyVolumeDisplay || "N/A"}
                    </span>
                    <span>•</span>
                    <span className="text-zinc-500">{t.sector}</span>
                    <span>•</span>
                    <span className="font-mono text-zinc-500">Runway: {m.runwayDisplay}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono ${
                    m.capitalNeedUrgency === "critical" ? "bg-rose-950 text-rose-300 border border-rose-500/40" : "bg-zinc-800 text-zinc-300"
                  }`}>
                    {m.capitalNeedUrgency}
                  </span>
                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })}

          {results.length === 0 && (
            <div className="text-center py-12 text-zinc-500 text-xs font-mono">
              No matching Maxim conference targets found for "{query}".
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="p-3 bg-zinc-950 border-t border-zinc-850 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <span>Navigate with arrow keys • Enter to select</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};
