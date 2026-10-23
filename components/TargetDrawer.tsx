"use client";

import React, { useState } from "react";
import { 
  X, 
  Flame, 
  AlertTriangle, 
  ExternalLink, 
  Mail, 
  Phone, 
  Building2, 
  Layers, 
  Copy, 
  Check, 
  Send, 
  FileText, 
  Briefcase, 
  ShieldCheck, 
  ShieldAlert,
  FileX,
  DollarSign,
  Clock, 
  ArrowRight,
  TrendingDown,
  UserCheck,
  CheckCircle2
} from "lucide-react";
import { MaximTarget, ExecutiveContact } from "@/lib/types";

interface TargetDrawerProps {
  target: MaximTarget | null;
  onClose: () => void;
  onUpdateStage: (targetId: string, stage: any) => void;
  onAddNote: (targetId: string, text: string) => void;
  onLogActivity: (targetId: string, activity: any) => void;
  onUpdateCrm?: (targetId: string, updates: any) => void;
}

export const TargetDrawer: React.FC<TargetDrawerProps> = ({
  target,
  onClose,
  onUpdateStage,
  onAddNote,
  onLogActivity,
  onUpdateCrm
}) => {
  if (!target) return null;

  const [activeTab, setActiveTab] = useState<"financials" | "signals" | "shelves" | "contacts" | "outreach" | "crm">("financials");
  const [outreachTrack, setOutreachTrack] = useState<"management" | "legal">("management");
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");
  const [contactStatus, setContactStatus] = useState(target.crm.contactStatus || "Not Contacted");
  const [responseOutcome, setResponseOutcome] = useState(target.crm.responseOutcome || "Pending Response");
  const [nextStep, setNextStep] = useState(target.crm.nextStep || "");
  const [savedCrmMsg, setSavedCrmMsg] = useState<string | null>(null);

  const m = target.financialMetrics;
  const f = target.financingHistory2Y;
  const r = target.registrationStatements2Y;
  const sigs = target.signals8K || [];

  // Selected outreach copy
  const subject = outreachTrack === "management" ? target.outreach.managementSubject : target.outreach.legalSubject;
  const body = outreachTrack === "management" ? target.outreach.managementBody : target.outreach.legalBody;

  // Key recipient based on track
  const primaryRecipient: ExecutiveContact | undefined = outreachTrack === "management"
    ? target.contacts.find(c => c.id.includes("ceo")) || target.contacts[0]
    : target.contacts.find(c => c.id.includes("counsel")) || target.contacts[0];

  const handleCopy = (text: string, type: "subject" | "body") => {
    navigator.clipboard.writeText(text);
    if (type === "subject") {
      setCopiedSubject(true);
      setTimeout(() => setCopiedSubject(false), 2000);
    } else {
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 2000);
    }
  };

  const handleOpenGmail = () => {
    const to = primaryRecipient?.email && primaryRecipient.email.includes("@") ? encodeURIComponent(primaryRecipient.email) : "";
    const su = encodeURIComponent(subject);
    const bo = encodeURIComponent(body);
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}&body=${bo}`;
    window.open(url, "_blank");

    onLogActivity(target.id, {
      type: "email",
      summary: `Opened Gmail draft for ${target.name} (${primaryRecipient?.name || "Leadership"}) [${outreachTrack.toUpperCase()} TRACK]`
    });
  };

  const handleNativeDispatch = async () => {
    setDispatchStatus("Logging touch...");
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId: target.id,
          contactEmail: primaryRecipient?.email || "Not yet sourced",
          contactName: primaryRecipient?.name || "Executive Office",
          outreachType: outreachTrack === "management" ? "Management Proposal" : "Legal Restructuring Proposal",
          subject
        })
      });
      if (!res.ok) throw new Error("Dispatch failed");
      setDispatchStatus("Outreach touch logged to CRM!");
      setTimeout(() => setDispatchStatus(null), 3000);
    } catch (e: any) {
      setDispatchStatus("Error: " + e.message);
    }
  };

  const handleSaveCrmOutcome = async () => {
    try {
      const res = await fetch("/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId: target.id,
          contactStatus,
          responseOutcome,
          nextStep
        })
      });
      const data = await res.json();
      if (data.success) {
        setSavedCrmMsg("✓ CRM Pipeline Updated!");
        setTimeout(() => setSavedCrmMsg(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddNote(target.id, newNote.trim());
    setNewNote("");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex justify-end transition-opacity">
      <div 
        className="w-full max-w-3xl bg-zinc-950 border-l border-zinc-800 h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-zinc-800 bg-zinc-900/80 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-2xl font-black text-white tracking-tight">
                  {target.ticker}
                </span>
                <span className="text-xs font-mono text-zinc-400 border border-zinc-750 px-2 py-0.5 rounded">
                  {target.secStatus === "sec_verified_filer" ? "SEC Verified" : target.regulatoryPortal || "Foreign Exchange"}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  m.capitalNeedUrgency === "critical"
                    ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                    : m.capitalNeedUrgency === "urgent"
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                    : "bg-blue-500/20 border-blue-500/40 text-blue-300"
                }`}>
                  {m.capitalNeedUrgency} Urgency
                </span>
                {target.isPanelist && (
                  <span className="bg-purple-500/20 border border-purple-500/40 text-purple-300 px-2 py-0.5 rounded-md text-[10px] font-bold">
                    🎙️ Panelist
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-zinc-100 mt-1">
                {target.name}
              </h2>
              <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                <span>{target.sector}</span>
                <span>•</span>
                <span className="font-mono">
                  {target.secStatus === "sec_verified_filer" ? `CIK: ${target.cik}` : target.regulatoryPortal}
                </span>
                <span>•</span>
                <a
                  href={target.secEdgarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 font-semibold"
                >
                  <span>{target.secStatus === "sec_verified_filer" ? "SEC EDGAR Profile" : "Regulatory Filing Portal"}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center space-x-1 mt-4 pt-3 border-t border-zinc-800/60 overflow-x-auto scrollbar-none text-xs font-semibold">
            {[
              { id: "financials", label: "Solvency & Receipts", icon: Flame },
              { id: "signals", label: `8-K Signals (${sigs.length})`, icon: AlertTriangle },
              { id: "shelves", label: "Registration Shelves", icon: Layers },
              { id: "contacts", label: "C-Suite & Counsel", icon: UserCheck },
              { id: "outreach", label: "Outreach Generator", icon: Mail },
              { id: "crm", label: "CRM & Pipeline Tracking", icon: Briefcase }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? "bg-zinc-800 text-amber-400 font-bold shadow-sm"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-850"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Drawer Body Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: Solvency & Primary Receipts */}
          {activeTab === "financials" && (
            <div className="space-y-6">
              {/* PRIMARY SEC FILING RECEIPT BOX */}
              <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
                      Primary Filing Receipt (Standing Rule B)
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-750 text-[10px] font-mono text-zinc-300">
                    Form {m.filingForm} • Period Ended {m.asOfDate}
                  </span>
                </div>

                <div className="text-xs text-zinc-300 font-mono space-y-1">
                  <p>
                    <span className="text-zinc-500">Accession Number:</span>{" "}
                    {m.accessionNumber !== "N/A" ? (
                      <a 
                        href={m.secViewerUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-amber-400 font-bold hover:underline inline-flex items-center gap-1"
                      >
                        {m.accessionNumber}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-zinc-500">Non-SEC Filer ({target.regulatoryPortal})</span>
                    )}
                  </p>
                  <p>
                    <span className="text-zinc-500">Data Provenance:</span> {target.dataProvenance}
                  </p>
                  <p>
                    <span className="text-zinc-500">Last Refreshed:</span> {target.lastRefreshedAt}
                  </p>
                </div>
              </div>

              {/* MARKET DATA & 24M REGISTRATION STATEMENT AUDIT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                      <span>Live Market Quote & Liquidity</span>
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">As of {target.marketData?.asOfDate || "2026-10-19"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-850">
                      <span className="text-[10px] text-zinc-500 block">Stock Price</span>
                      <span className="font-mono text-lg font-bold text-white block mt-0.5">
                        {target.marketData?.priceDisplay || "N/A"}
                      </span>
                      <span className="text-[10px] text-zinc-400">{target.marketData?.currency || "USD"}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-850">
                      <span className="text-[10px] text-zinc-500 block">Avg Monthly Volume</span>
                      <span className="font-mono text-lg font-bold text-amber-400 block mt-0.5">
                        {target.marketData?.avgMonthlyVolumeDisplay || "N/A"}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {target.marketData?.avgDailyVolume ? `${(target.marketData.avgDailyVolume / 1e3).toFixed(0)}K daily avg` : "30d"}
                      </span>
                    </div>
                  </div>
                  {target.marketData?.sourceUrl && (
                    <div className="pt-1 text-[10px] font-mono text-right">
                      <a 
                        href={target.marketData.sourceUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-1"
                      >
                        <span>Market Data Receipt (Yahoo / SEC)</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  )}
                </div>

                <div className={`p-4 rounded-2xl border space-y-2 ${
                  target.noActiveRegStatements24M 
                    ? "border-rose-500/40 bg-rose-950/20" 
                    : "border-purple-500/30 bg-purple-950/20"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5">
                      {target.noActiveRegStatements24M ? (
                        <>
                          <FileX className="w-3.5 h-3.5 text-rose-400" />
                          <span className="text-rose-400">24-Month Reg Statement Audit</span>
                        </>
                      ) : (
                        <>
                          <Layers className="w-3.5 h-3.5 text-purple-400" />
                          <span className="text-purple-300">24-Month Reg Statement Audit</span>
                        </>
                      )}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      target.noActiveRegStatements24M ? "bg-rose-950 text-rose-300 border border-rose-500/40" : "bg-purple-950 text-purple-300 border border-purple-500/40"
                    }`}>
                      {target.noActiveRegStatements24M ? "ZERO ACTIVE REG" : `${target.regStatementsCount24M || target.registrationStatements2Y.filingCount} Filings`}
                    </span>
                  </div>
                  <div className="text-xs space-y-1 pt-1">
                    {target.noActiveRegStatements24M ? (
                      <div className="space-y-1">
                        <p className="text-rose-300 font-bold text-[11px]">
                          No S-1, S-3, S-8, F-1, or F-3 filed in the last 24 months.
                        </p>
                        <p className="text-[10px] text-zinc-400 leading-relaxed">
                          Issuer has zero active public shelf capacity. Rapid continuous ATM dilution is impossible without filing a new registration statement subject to SEC review. Prime target for private bridge debt, senior facilities, or structured equity recapitalization.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-purple-200 font-semibold text-[11px]">
                          Active registration statements on file ({target.registrationStatements2Y.activeShelvesFiled} Universal S-3/F-3 Shelves).
                        </p>
                        <p className="text-[10px] text-zinc-400 leading-relaxed">
                          Forms detected in 24-month window: {target.regStatementForms24M?.join(", ") || "S-3 / 424B5"}.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION A: RAW SEC EDGAR FACTS */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                    1. Raw Filing Facts (SEC XBRL Disclosures)
                  </h4>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                    Verified Primary Source
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850">
                    <span className="text-[10px] text-zinc-500 block">Cash & Equivalents</span>
                    <span className="font-mono text-lg font-bold text-white block mt-0.5">
                      {m.cashOnHandDisplay}
                    </span>
                    <span className="text-[10px] text-zinc-400">12M Delta: {m.changeInCashDisplay}</span>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850">
                    <span className="text-[10px] text-zinc-500 block">Working Capital (Current Assets - Liabs)</span>
                    <span className={`font-mono text-lg font-bold block mt-0.5 ${
                      m.isNegativeWorkingCapital ? "text-rose-400" : m.isUnclassifiedBalanceSheet ? "text-amber-400" : "text-emerald-400"
                    }`}>
                      {m.workingCapitalDisplay}
                    </span>
                    <span className="text-[10px] text-zinc-400">Current Ratio: {m.currentRatioDisplay}</span>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850">
                    <span className="text-[10px] text-zinc-500 block">Current Assets</span>
                    <span className="font-mono text-sm font-bold text-zinc-200 block mt-0.5">
                      {m.currentAssets !== null ? `$${(m.currentAssets / 1e6).toFixed(2)}M` : "Unclassified / Not Disclosed"}
                    </span>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850">
                    <span className="text-[10px] text-zinc-500 block">Current Liabilities</span>
                    <span className="font-mono text-sm font-bold text-zinc-200 block mt-0.5">
                      {m.currentLiabilities !== null ? `$${(m.currentLiabilities / 1e6).toFixed(2)}M` : "Unclassified / Not Disclosed"}
                    </span>
                  </div>
                </div>

                {m.isUnclassifiedBalanceSheet && (
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-300">
                    <strong>{(target.sector || '').toLowerCase().includes('reit') || (target.sector || '').toLowerCase().includes('real estate') ? 'REIT Unclassified Balance Sheet:' : 'Unclassified Balance Sheet:'}</strong> {(target.sector || '').toLowerCase().includes('reit') || (target.sector || '').toLowerCase().includes('real estate') ? 'Real estate investment properties and mortgage notes are classified as non-current assets and liabilities under US-GAAP. Working capital is not reported by REIT management.' : 'Assets and liabilities are presented without current/non-current distinction under applicable reporting standards (e.g. IFRS or financial institution format).'}
                  </div>
                )}
              </div>

              {/* SECTION B: DERIVED CAPITAL NEED & DILUTION MODEL */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                    2. Derived Diligence Model & Methodology Output
                  </h4>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                    Decision Telemetry
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-850 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Capital Need Urgency Tier:</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        m.capitalNeedUrgency === "critical" ? "bg-rose-500 text-zinc-950" : "bg-amber-500 text-zinc-950"
                      }`}>
                        {m.capitalNeedUrgency}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {m.urgencyRationale}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-850 space-y-1">
                    <span className="text-xs font-bold text-white">Mathematical Methodology:</span>
                    <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                      {m.calculationMethodology}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-850 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Baby Shelf Limitation (Instruction I.B.6):</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        r.babyShelfConstrained ? "bg-rose-950 text-rose-300 border border-rose-500/40" : "bg-zinc-800 text-zinc-400"
                      }`}>
                        {r.babyShelfConstrained ? "CONSTRAINED (1/3 Cap)" : "Standard Eligibility"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      {r.babyShelfNote}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 8-K Disclosure Signals */}
          {activeTab === "signals" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                  Form 8-K Material Trigger Disclosures
                </h4>
                <span className="text-xs text-zinc-500 font-mono">Scanned past 24 months</span>
              </div>

              {sigs.length === 0 ? (
                <div className="text-center py-12 rounded-xl border border-zinc-800 bg-zinc-900/40 text-xs text-zinc-400">
                  <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="font-bold text-zinc-300">Clean Disclosure Profile</p>
                  <p className="text-zinc-500 mt-1">No Form 8-K Item 3.01 deficiency notices or Item 2.04 debt acceleration triggers detected.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sigs.map((sig, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/20 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                          <h5 className="text-sm font-bold text-white font-mono">{sig.item}: {sig.title}</h5>
                        </div>
                        <span className="text-xs font-mono text-zinc-400">{sig.date}</span>
                      </div>
                      <p className="text-xs text-zinc-300">{sig.details}</p>
                      <div className="pt-1 border-t border-rose-500/20 flex items-center justify-between text-[11px] font-mono">
                        <span className="text-zinc-400">Accession: {sig.accessionNumber}</span>
                        <a 
                          href={sig.secUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-amber-400 hover:text-white inline-flex items-center gap-1 font-bold"
                        >
                          <span>View Official 8-K Filing</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Registration Shelves */}
          {activeTab === "shelves" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                      Form S-3 / F-3 Universal Shelves & ATM Registrations
                    </h4>
                    <p className="text-xs text-zinc-500">{r.filingCount} registration statements on SEC EDGAR</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    r.dilutionRisk === "Severe" ? "bg-rose-950 text-rose-300 border border-rose-500" : "bg-amber-950 text-amber-300 border border-amber-500"
                  }`}>
                    {r.dilutionRisk} Dilution Overhang
                  </span>
                </div>

                {/* Filings Table */}
                <div className="border border-zinc-800 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-950 border-b border-zinc-800 text-[10px] font-mono text-zinc-400 uppercase">
                      <tr>
                        <th className="p-2.5">Form</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Description</th>
                        <th className="p-2.5 text-right">SEC Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850">
                      {r.filings.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-zinc-500">
                            No active Form S-3 or 424B registration statements filed.
                          </td>
                        </tr>
                      ) : (
                        r.filings.map((filing, idx) => (
                          <tr key={idx} className="hover:bg-zinc-800/40">
                            <td className="p-2.5 font-mono font-bold text-amber-400">{filing.form}</td>
                            <td className="p-2.5 text-zinc-400 font-mono text-[11px]">{filing.filingDate}</td>
                            <td className="p-2.5 text-zinc-200">{filing.description}</td>
                            <td className="p-2.5 text-right">
                              <a
                                href={filing.secUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-amber-400 hover:text-white inline-flex items-center gap-1 font-mono text-[11px]"
                              >
                                <span>{(filing.accessionNumber || "SEC-FILING").slice(0, 15)}...</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: C-Suite & Legal Contacts */}
          {activeTab === "contacts" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                  Executive Officers & Corporate Counsel
                </h4>
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="text-zinc-400">HQ Phone: <strong className="text-zinc-200">{target.telephone}</strong></span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-zinc-500">Official Disclosures</span>
                </div>
              </div>

              <div className="space-y-3">
                {target.contacts.map((c) => (
                  <div key={c.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-bold text-white">{c.name}</h5>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-500/20 text-blue-300">
                            {c.receptivityScore.replace(/_/g, " ")} receptivity
                          </span>
                        </div>
                        <p className="text-xs text-amber-400 font-medium">{c.title}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {c.email && c.email.includes("@") ? (
                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            <span className="font-mono text-zinc-200 text-xs bg-zinc-950 border border-zinc-800 px-2.5 py-1 rounded-lg select-all">
                              {c.email}
                            </span>
                            <a
                              href={`mailto:${c.email}`}
                              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-sm"
                              title={`Direct email to ${c.name}`}
                            >
                              <Mail className="w-3 h-3" />
                              <span>Direct Email</span>
                            </a>
                          </div>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-zinc-900 text-zinc-500 text-[10px] font-mono border border-zinc-800">
                            Email: Not yet sourced
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-zinc-300">{c.roleSummary}</p>
                    <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                      <span>{c.id.includes("counsel") ? "Firm Phone: " : "Office Phone: "}<strong className="text-zinc-200">{c.phone || target.telephone}</strong></span>
                      <span className="text-zinc-500">{c.source || "SEC Disclosure"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Outreach Generator */}
          {activeTab === "outreach" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center rounded-xl bg-zinc-900 border border-zinc-800 p-1">
                  <button
                    onClick={() => setOutreachTrack("management")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      outreachTrack === "management" ? "bg-zinc-800 text-amber-400 shadow-sm" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    C-Suite Proposal
                  </button>
                  <button
                    onClick={() => setOutreachTrack("legal")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      outreachTrack === "legal" ? "bg-zinc-800 text-amber-400 shadow-sm" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Securities Counsel Track
                  </button>
                </div>
              </div>

              {/* Subject Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-bold">Subject Line</span>
                  <button
                    onClick={() => handleCopy(subject, "subject")}
                    className="text-amber-400 hover:text-amber-300 text-[11px] inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSubject ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSubject ? "Copied!" : "Copy Subject"}</span>
                  </button>
                </div>
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 select-all">
                  {subject}
                </div>
              </div>

              {/* Body Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-bold">Personalized Proposal Body</span>
                  <button
                    onClick={() => handleCopy(body, "body")}
                    className="text-amber-400 hover:text-amber-300 text-[11px] inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedBody ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedBody ? "Copied!" : "Copy Body"}</span>
                  </button>
                </div>
                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-[320px] overflow-y-auto select-all">
                  {body}
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenGmail}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-red-600/30 transition-all cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Open in Gmail (1-Click)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNativeDispatch}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-amber-400" />
                    <span>Log Outreach Touch in CRM</span>
                  </button>
                </div>

                {dispatchStatus && (
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    {dispatchStatus}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: CRM & Pipeline Outcomes (Item 7) */}
          {activeTab === "crm" && (
            <div className="space-y-6">
              {/* Outcome Tracking Card */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                    Pipeline Progression & Outcome Tracking
                  </h4>
                  {savedCrmMsg && (
                    <span className="text-xs font-bold text-emerald-400 font-mono">
                      {savedCrmMsg}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                      Contact Status:
                    </label>
                    <select
                      value={contactStatus}
                      onChange={(e) => setContactStatus(e.target.value as any)}
                      className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="Not Contacted">Not Contacted</option>
                      <option value="Outreach Sent">Outreach Sent</option>
                      <option value="Executive Follow-up">Executive Follow-up</option>
                      <option value="NDA Sent">NDA Sent</option>
                      <option value="Term Sheet Proposed">Term Sheet Proposed</option>
                      <option value="Passed / Archived">Passed / Archived</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                      Response Outcome:
                    </label>
                    <select
                      value={responseOutcome}
                      onChange={(e) => setResponseOutcome(e.target.value as any)}
                      className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="Pending Response">Pending Response</option>
                      <option value="Positive / Receptive">Positive / Receptive</option>
                      <option value="Meeting Scheduled">Meeting Scheduled</option>
                      <option value="Declined - Sufficient Runway">Declined - Sufficient Runway</option>
                      <option value="Declined - Alternative Facility">Declined - Alternative Facility</option>
                      <option value="No Response">No Response</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                    Next Action Step:
                  </label>
                  <input
                    type="text"
                    value={nextStep}
                    onChange={(e) => setNextStep(e.target.value)}
                    placeholder="e.g. Follow up on bridge facility proposal next Tuesday..."
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] font-mono text-zinc-500">
                    Last Touch: {target.crm.lastTouch || "Never"}
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveCrmOutcome}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save Pipeline Outcome</span>
                  </button>
                </div>
              </div>

              {/* Stage Progression Selector */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                  Deal Kanban Stage
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: "screened", label: "Screened" },
                    { id: "outreach_ready", label: "Outreach Ready" },
                    { id: "contacted", label: "Contacted" },
                    { id: "nda_signed", label: "NDA Signed" },
                    { id: "term_sheet", label: "Term Sheet" },
                    { id: "passed", label: "Passed" }
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onUpdateStage(target.id, s.id)}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        target.crm.stage === s.id
                          ? "bg-amber-500 text-zinc-950 border-amber-400 shadow-md"
                          : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNoteSubmit} className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                  Add Strategic Diligence Note
                </h4>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Record call takeaways, CFO feedback, or refinancing terms..."
                  rows={3}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold"
                >
                  Post Note
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
