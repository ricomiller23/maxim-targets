"use client";

import React, { useState } from "react";
import { MaximTarget } from "@/lib/types";
import { Layers, ExternalLink, ArrowUpDown, ChevronRight, AlertTriangle, TrendingDown } from "lucide-react";

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
    : targets.filter(t => t.registrationStatements2Y.dilutionRisk.toLowerCase() === filterRisk.toLowerCase());

  const totalShelfCapacity = targets.reduce((sum, t) => sum + t.registrationStatements2Y.activeShelfCapacity, 0);
  const totalAtmProceeds = targets.reduce((sum, t) => sum + t.financingHistory2Y.atmProceeds, 0);
  const totalWarrantProceeds = targets.reduce((sum, t) => sum + t.financingHistory2Y.warrantProceeds, 0);

  return (
    <div className="p-4 space-y-5">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-1">
          <span className="text-xs text-zinc-400 font-medium">Total Active Universal Shelf (S-3) Capacity</span>
          <div className="font-mono text-2xl font-black text-amber-400">
            ${(totalShelfCapacity / 1e9).toFixed(2)} Billion
          </div>
          <p className="text-[11px] text-zinc-500">Continuous shelf registration overhang available for drawdowns</p>
        </div>

        <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-1">
          <span className="text-xs text-zinc-400 font-medium">Total 2Y Maxim ATM Equity Drawn</span>
          <div className="font-mono text-2xl font-black text-white">
            ${(totalAtmProceeds / 1e9).toFixed(2)} Billion
          </div>
          <p className="text-[11px] text-zinc-500">At-The-Market continuous daily secondary market sales</p>
        </div>

        <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-1">
          <span className="text-xs text-zinc-400 font-medium">Total 2Y Warrant Proceeds / Coverage</span>
          <div className="font-mono text-2xl font-black text-purple-400">
            ${(totalWarrantProceeds / 1e6).toFixed(1)} Million
          </div>
          <p className="text-[11px] text-zinc-500">Derivative dilution overhang from registered direct sweeteners</p>
        </div>
      </div>

      {/* Table Header & Risk Filter */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Form S-3 Registration Statements & ATM Facilities Monitor</span>
        </h3>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500">Dilution Overhang:</span>
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Overhang Levels</option>
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
              <th className="py-3 px-3">Primary Underwriter</th>
              <th className="py-3 px-3 text-right">Active S-3 Shelf</th>
              <th className="py-3 px-3 text-right">2Y ATM Dilution</th>
              <th className="py-3 px-3 text-right">2Y Warrant Sweeteners</th>
              <th className="py-3 px-3 text-center">Overhang Risk</th>
              <th className="py-3 px-3">Recent Filings</th>
              <th className="py-3 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-850">
            {filtered.map((t) => {
              const r = t.registrationStatements2Y;
              const f = t.financingHistory2Y;

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

                  <td className="py-3 px-3 text-zinc-300 font-mono text-[11px]">
                    {r.primaryUnderwriter}
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-bold text-amber-400">
                    ${(r.activeShelfCapacity / 1e6).toFixed(1)}M
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-white">
                    ${(f.atmProceeds / 1e6).toFixed(1)}M
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-purple-400">
                    ${(f.warrantProceeds / 1e6).toFixed(1)}M
                  </td>

                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      r.dilutionRisk === "Severe" 
                        ? "bg-rose-950 text-rose-300 border border-rose-500/40" 
                        : "bg-amber-950 text-amber-300 border border-amber-500/40"
                    }`}>
                      {r.dilutionRisk}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {r.filings.map((filing, idx) => (
                        <a
                          key={idx}
                          href={filing.secUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono inline-flex items-center gap-0.5"
                          title={filing.description}
                        >
                          <span>{filing.form}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ))}
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
