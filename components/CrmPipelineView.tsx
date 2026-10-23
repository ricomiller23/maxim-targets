"use client";

import React from "react";
import { MaximTarget } from "@/lib/types";
import { Briefcase, ChevronRight, Mail, Phone, Flame, AlertTriangle } from "lucide-react";

interface CrmPipelineViewProps {
  targets: MaximTarget[];
  onSelect: (target: MaximTarget) => void;
  onUpdateStage: (targetId: string, stage: any) => void;
}

const STAGES: { id: MaximTarget["crm"]["stage"]; label: string; color: string }[] = [
  { id: "screened", label: "Screened (Uncontacted)", color: "border-zinc-700 bg-zinc-900/60" },
  { id: "outreach_ready", label: "Outreach Ready", color: "border-amber-600/40 bg-amber-950/20" },
  { id: "contacted", label: "Contacted / Pitch Sent", color: "border-blue-600/40 bg-blue-950/20" },
  { id: "nda_signed", label: "NDA In Diligence", color: "border-purple-600/40 bg-purple-950/20" },
  { id: "term_sheet", label: "Term Sheet / IOI", color: "border-emerald-600/40 bg-emerald-950/20" },
  { id: "passed", label: "Passed / Ineligible", color: "border-zinc-800 bg-zinc-950/40" }
];

export const CrmPipelineView: React.FC<CrmPipelineViewProps> = ({
  targets,
  onSelect,
  onUpdateStage
}) => {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-amber-400" />
            <span>Maxim Conference Outreach Pipeline</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Kanban workflow tracking executive outreach, NDA exchange, and term sheet execution across presenting and screened targets.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto pb-4">
        {STAGES.map((col) => {
          const colTargets = targets.filter(t => t.crm.stage === col.id);

          return (
            <div 
              key={col.id} 
              className={`rounded-2xl border p-3 flex flex-col min-w-[220px] ${col.color}`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800">
                <span className="text-xs font-bold text-zinc-200">{col.label}</span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-amber-400">
                  {colTargets.length}
                </span>
              </div>

              {/* Targets List */}
              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
                {colTargets.map((t) => {
                  const m = t.financialMetrics;
                  const ceo = t.contacts.find(c => c.id.includes("ceo"));

                  return (
                    <div
                      key={t.id}
                      onClick={() => onSelect(t)}
                      className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer shadow-sm hover:shadow-md space-y-2 group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono font-black text-sm text-white group-hover:text-amber-400">
                            {t.ticker}
                          </span>
                          <h4 className="text-[11px] font-bold text-zinc-300 line-clamp-1" title={t.name}>
                            {t.name}
                          </h4>
                        </div>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded font-mono ${
                          m.capitalNeedUrgency === "critical"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                            : m.capitalNeedUrgency === "urgent"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : "bg-zinc-800 text-zinc-300"
                        }`}>
                          {m.runwayMonths ? `${m.runwayMonths}mo` : "Unrated"}
                        </span>
                      </div>

                      <div className="text-[10px] text-zinc-400 flex justify-between font-mono">
                        <span>Cash: {m.cashOnHand !== null ? `$${(m.cashOnHand / 1e6).toFixed(1)}M` : m.cashOnHandDisplay}</span>
                        <span className={m.isNegativeWorkingCapital ? "text-rose-400" : "text-emerald-400"}>
                          {m.isNegativeWorkingCapital
                            ? `-$${(m.workingCapitalDeficit / 1e6).toFixed(1)}M`
                            : m.workingCapital !== null
                              ? `+$${((m.workingCapital) / 1e6).toFixed(1)}M`
                              : "N/A"}
                        </span>
                      </div>

                      <div className="text-[10px] text-zinc-400 truncate pt-1 border-t border-zinc-900 flex justify-between items-center">
                        <span className="truncate">CEO: {ceo?.name || "Corporate Leadership"}</span>
                      </div>
                    </div>
                  );
                })}

                {colTargets.length === 0 && (
                  <div className="text-center py-8 text-zinc-600 text-xs font-mono">
                    Empty Stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
