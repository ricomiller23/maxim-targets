"use client";

import React, { useState } from "react";
import { MaximTarget } from "@/lib/types";
import { Layers, ExternalLink, ArrowUpDown, ChevronRight, AlertTriangle, FileText, CheckCircle2, FileX } from "lucide-react";

interface RegistrationShelvesViewProps {
  targets: MaximTarget[];
  onSelect: (target: MaximTarget) => void;
}

export const RegistrationShelvesView: React.FC<RegistrationShelvesViewProps> = ({
  targets,
  onSelect
}) => {
  const [filterRisk, setFilterRisk] = useState<string>("all");

  const filtered = filterRisk === "all" 
    ? targets 
    : filterRisk === "no_reg"
      ? targets.filter(t => t.noActiveRegStatements24M)
      : targets.filter(t => (t.registrationStatements2Y?.dilutionRisk || "").toLowerCase() === filterRisk.toLowerCase());

  // Factual, audited counts from SEC EDGAR submissions
  const totalUniversalShelves = targets.filter(t => t.registrationStatements2Y.activeShelvesFiled > 0).length;
  const totalAtmFilers = targets.filter(t => (t.registrationStatements2Y.atmProspectusCount || 0) > 0).length;
  const totalBabyShelfConstrained = targets.filter(t => t.registrationStatements2Y.babyShelfConstrained).length;
  const totalInitialRegs = targets.filter(t => (t.registrationStatements2Y.initialRegistrationsCount || 0) > 0).length;
  const totalNoReg = targets.filter(t => t.noActiveRegStatements24M).length;

  return (
    <div className="p-4 space-y-5">
      {/* Overview Cards: Sourced Factual Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-1">
          <span className="text-xs text-zinc-400 font-medium">Universal S-3/F-3 Shelves</span>
          <div className="font-mono text-2xl font-black text-amber-400">
            {totalUniversalShelves} Issuers
          </div>
          <p className="text-[11px] text-zinc-500">Active universal shelf registrations on file with SEC</p>
        </div>

        <div className="p-3.5 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-1">
          <span className="text-xs text-zinc-400 font-medium">ATM Prospectus Filers</span>
          <div className="font-mono text-2xl font-black text-blue-400">
            {totalAtmFilers} Issuers
          </div>
          <p className="text-[11px] text-zinc-500">At-The-Market continuous 424B5 supplements</p>
        </div>

        <div className="p-3.5 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-1">
          <span className="text-xs text-zinc-400 font-medium">Baby Shelf Constrained</span>
          <div className="font-mono text-2xl font-black text-rose-400">
            {totalBabyShelfConstrained} Issuers
          </div>
          <p className="text-[11px] text-zinc-500">Form S-3 Instruction I.B.6 (1/3 public float cap)</p>
        </div>

        <div className="p-3.5 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-1">
          <span className="text-xs text-zinc-400 font-medium">Initial / Direct Regs</span>
          <div className="font-mono text-2xl font-black text-purple-400">
            {totalInitialRegs} Issuers
          </div>
          <p className="text-[11px] text-zinc-500">Form S-1 / F-1 secondary or IPO registrations</p>
        </div>

        {/* 5th Card: No Active Reg Statements */}
        <div 
          onClick={() => setFilterRisk(filterRisk === "no_reg" ? "all" : "no_reg")}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1 ${
            filterRisk === "no_reg" 
              ? "bg-rose-950/80 border-rose-500 shadow-md" 
              : "border-rose-500/30 bg-rose-950/20 hover:border-rose-500/60"
          }`}
        >
          <span className="text-xs text-rose-300 font-medium flex items-center justify-between">
            <span>No Active Reg (24M)</span>
            <FileX className="w-3.5 h-3.5 text-rose-400" />
          </span>
          <div className="font-mono text-2xl font-black text-white">
            {totalNoReg} Issuers
          </div>
          <p className="text-[11px] text-rose-300/80">Zero S-1/S-3/S-8/F-1/F-3 filed in last 24 months</p>
        </div>
      </div>

      {/* Table Header & Risk Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>SEC Registration Statements & Filings Monitor</span>
          </h3>
          <p className="text-xs text-zinc-400">
            Verified SEC EDGAR registration filings (Universal Form S-3/F-3, Continuous 424B5 supplements, and Form S-1/F-1 initial offerings). Capacities governed by respective SEC prospectuses.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500 font-semibold">Filter Shelf Overhang:</span>
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Issuers ({targets.length})</option>
            <option value="no_reg">⚠️ No Active Reg Statements ({totalNoReg})</option>
            <option value="severe">Severe Overhang Only</option>
            <option value="high">High Overhang Only</option>
            <option value="moderate">Moderate Overhang Only</option>
          </select>
        </div>
      </div>

      {/* Dense Table */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-md">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="bg-zinc-950/80 border-b border-zinc-800 text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wider">
            <tr>
              <th className="py-3 px-3">Ticker / Company</th>
              <th className="py-3 px-3 text-right">Price</th>
              <th className="py-3 px-3 text-right">Avg Mo. Vol</th>
              <th className="py-3 px-3">Registration Category</th>
              <th className="py-3 px-3 text-center">Universal S-3 Shelves</th>
              <th className="py-3 px-3 text-center">424B5 Prospectuses</th>
              <th className="py-3 px-3 text-center">Baby Shelf Rule</th>
              <th className="py-3 px-3 text-center">Overhang Risk</th>
              <th className="py-3 px-3">Verified SEC Filings</th>
              <th className="py-3 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-850">
            {filtered.map((t) => {
              const r = t.registrationStatements2Y;
              const mk = t.marketData;

              return (
                <tr 
                  key={t.id} 
                  onClick={() => onSelect(t)}
                  className="hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-3">
                    <span className="font-mono font-black text-white group-hover:text-amber-400 text-sm">
                      {t.ticker}
                    </span>
                    <span className="block text-[11px] text-zinc-400 truncate max-w-[180px]">
                      {t.name}
                    </span>
                  </td>

                  {/* Stock Price */}
                  <td className="py-3 px-3 text-right font-mono font-bold text-white">
                    {mk?.priceDisplay || "N/A"}
                  </td>

                  {/* Monthly Volume */}
                  <td className="py-3 px-3 text-right font-mono text-zinc-300">
                    {mk?.avgMonthlyVolumeDisplay || "N/A"}
                  </td>

                  <td className="py-3 px-3 font-mono text-[11px]">
                    {t.noActiveRegStatements24M ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold inline-flex items-center gap-1">
                        <FileX className="w-2.5 h-2.5" />
                        <span>No Active Reg (24M)</span>
                      </span>
                    ) : r.activeShelvesFiled > 0 ? (
                      <span className="text-amber-400 font-semibold">Universal Shelf (S-3/F-3)</span>
                    ) : (r.atmProspectusCount || 0) > 0 ? (
                      <span className="text-blue-400 font-semibold">Continuous ATM (424B5)</span>
                    ) : (r.initialRegistrationsCount || 0) > 0 ? (
                      <span className="text-purple-400 font-semibold">Initial Reg (S-1/F-1)</span>
                    ) : (
                      <span className="text-zinc-500">Exempt / Non-Shelf</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-center font-mono font-bold text-amber-400">
                    {r.activeShelvesFiled > 0 ? (
                      <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-300">
                        {r.activeShelvesFiled} Active
                      </span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-center font-mono text-white">
                    {(r.atmProspectusCount || 0) > 0 ? (
                      <span className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-500/30 text-blue-300">
                        {r.atmProspectusCount} Supplements
                      </span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-center font-mono">
                    {r.babyShelfConstrained ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-950 text-rose-300 border border-rose-500/40" title={r.babyShelfNote}>
                        Constrained (1/3 Float)
                      </span>
                    ) : (
                      <span className="text-zinc-500 text-[10px]">Unconstrained</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      t.noActiveRegStatements24M
                        ? "bg-rose-950 text-rose-300 border border-rose-500/40"
                        : r.dilutionRisk === "Severe" 
                          ? "bg-rose-950 text-rose-300 border border-rose-500/40" 
                          : r.dilutionRisk === "High"
                            ? "bg-amber-950 text-amber-300 border border-amber-500/40"
                            : "bg-zinc-800 text-zinc-300"
                    }`}>
                      {t.noActiveRegStatements24M ? "ZERO OVERHANG" : r.dilutionRisk}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 flex-wrap max-w-[280px]">
                      {r.filings && r.filings.length > 0 ? (
                        r.filings.slice(0, 4).map((filing, idx) => (
                          <a
                            key={idx}
                            href={filing.secUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono inline-flex items-center gap-0.5"
                            title={`${filing.form} filed ${filing.filingDate}: ${filing.description}`}
                          >
                            <span>{filing.form}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ))
                      ) : (
                        <span className="text-zinc-600 text-[10px] italic">No active SEC shelf on file</span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-zinc-300 transition-colors"
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
