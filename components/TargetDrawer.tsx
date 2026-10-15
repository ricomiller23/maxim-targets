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
  Scale, 
  ShieldCheck, 
  Clock, 
  ArrowRight,
  TrendingDown,
  UserCheck
} from "lucide-react";
import { MaximTarget, ExecutiveContact } from "@/lib/types";

interface TargetDrawerProps {
  target: MaximTarget | null;
  onClose: () => void;
  onUpdateStage: (targetId: string, stage: any) => void;
  onAddNote: (targetId: string, text: string) => void;
  onLogActivity: (targetId: string, activity: any) => void;
}

export const TargetDrawer: React.FC<TargetDrawerProps> = ({
  target,
  onClose,
  onUpdateStage,
  onAddNote,
  onLogActivity
}) => {
  if (!target) return null;

  const [activeTab, setActiveTab] = useState<"financials" | "financing" | "shelves" | "contacts" | "outreach" | "crm">("financials");
  const [outreachTrack, setOutreachTrack] = useState<"management" | "legal">("management");
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");

  const m = target.financialMetrics;
  const f = target.financingHistory2Y;
  const r = target.registrationStatements2Y;

  // Selected outreach copy
  const subject = outreachTrack === "management" ? target.outreach.managementSubject : target.outreach.legalSubject;
  const body = outreachTrack === "management" ? target.outreach.managementBody : target.outreach.legalBody;

  // Key recipient based on track
  const primaryRecipient: ExecutiveContact | undefined = outreachTrack === "management"
    ? target.contacts.find(c => c.id.includes("ceo")) || target.contacts[0]
    : target.contacts.find(c => c.id.includes("outside-counsel")) || target.contacts.find(c => c.id.includes("gc")) || target.contacts[0];

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
    if (!primaryRecipient) return;
    const to = encodeURIComponent(primaryRecipient.email);
    const su = encodeURIComponent(subject);
    const bo = encodeURIComponent(body);
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}&body=${bo}`;
    window.open(url, "_blank");

    onLogActivity(target.id, {
      type: "email",
      summary: `Opened Gmail composer for ${primaryRecipient.name} (${primaryRecipient.email}) [${outreachTrack.toUpperCase()} TRACK]`
    });
  };

  const handleNativeDispatch = async () => {
    if (!primaryRecipient) return;
    setDispatchStatus("Dispatching...");
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId: target.id,
          contactEmail: primaryRecipient.email,
          contactName: primaryRecipient.name,
          outreachType: outreachTrack === "management" ? "Management Proposal" : "Legal Restructuring Proposal",
          subject
        })
      });
      if (!res.ok) throw new Error("Dispatch logging failed");
      setDispatchStatus("Logged & Outreach Registered!");
      setTimeout(() => setDispatchStatus(null), 3000);
    } catch (e: any) {
      setDispatchStatus("Error: " + e.message);
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
                  {target.exchange}
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
                <span className="font-mono">CIK: {target.cik}</span>
                <span>•</span>
                <a
                  href={target.secEdgarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 font-semibold"
                >
                  <span>SEC EDGAR Filings</span>
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
              { id: "financials", label: "Solvency & Runway", icon: Flame },
              { id: "financing", label: "2Y Financing Flow", icon: TrendingDown },
              { id: "shelves", label: "Registration Shelves", icon: Layers },
              { id: "contacts", label: "C-Suite & Counsel", icon: UserCheck },
              { id: "outreach", label: "Outreach Generator", icon: Mail },
              { id: "crm", label: "CRM & Notes", icon: Briefcase }
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
          {/* TAB 1: Solvency & Runway */}
          {activeTab === "financials" && (
            <div className="space-y-6">
              {/* Runway Callout Banner */}
              <div className={`p-4 rounded-2xl border ${
                m.runwayMonths < 3
                  ? "bg-rose-950/40 border-rose-500/40"
                  : m.runwayMonths < 6
                  ? "bg-amber-950/40 border-amber-500/40"
                  : "bg-zinc-900 border-zinc-800"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Flame className={`w-5 h-5 ${m.runwayMonths < 3 ? "text-rose-400" : "text-amber-400"}`} />
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Estimated Cash Runway: <span className="font-mono">{m.runwayMonths} Months</span>
                      </h4>
                      <p className="text-xs text-zinc-400">
                        Monthly Operating Cash Burn: <strong className="font-mono text-zinc-200">${(m.monthlyBurnRate / 1e3).toFixed(0)}k/mo</strong>
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                    m.capitalNeedUrgency === "critical" ? "bg-rose-500 text-zinc-950" : "bg-amber-500 text-zinc-950"
                  }`}>
                    {m.capitalNeedUrgency} Capital Need
                  </span>
                </div>
              </div>

              {/* Working Capital Breakdown */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Working Capital & Liquidity Screen
                </h4>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850">
                    <span className="text-[10px] text-zinc-500 font-medium block">Current Cash</span>
                    <span className="font-mono text-base font-bold text-white block mt-0.5">
                      ${(m.cashOnHand / 1e6).toFixed(2)}M
                    </span>
                    <span className="text-[10px] text-rose-400 font-mono">
                      12M Delta: ${(m.changeInCash12M / 1e6).toFixed(1)}M ({m.changeInCashPct}%)
                    </span>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850">
                    <span className="text-[10px] text-zinc-500 font-medium block">Current Assets</span>
                    <span className="font-mono text-base font-bold text-zinc-200 block mt-0.5">
                      ${(m.currentAssets / 1e6).toFixed(2)}M
                    </span>
                    <span className="text-[10px] text-zinc-500">Short-term liquidity pool</span>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850">
                    <span className="text-[10px] text-zinc-500 font-medium block">Current Liabilities</span>
                    <span className="font-mono text-base font-bold text-rose-300 block mt-0.5">
                      ${(m.currentLiabilities / 1e6).toFixed(2)}M
                    </span>
                    <span className="text-[10px] text-zinc-500">Due within 12 months</span>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850">
                    <span className="text-[10px] text-zinc-500 font-medium block">Working Capital</span>
                    <span className={`font-mono text-base font-black block mt-0.5 ${
                      m.isNegativeWorkingCapital ? "text-rose-400" : "text-emerald-400"
                    }`}>
                      {m.isNegativeWorkingCapital ? `-$${(m.workingCapitalDeficit / 1e6).toFixed(2)}M` : `+$${(m.workingCapital / 1e6).toFixed(2)}M`}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Current Ratio: {m.currentRatio}x
                    </span>
                  </div>
                </div>

                {m.isNegativeWorkingCapital && (
                  <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl text-xs text-rose-300 leading-relaxed">
                    <strong>Negative Working Capital Alert:</strong> Short-term debt obligations exceed current assets by <strong>${(m.workingCapitalDeficit / 1e6).toFixed(2)}M</strong>. Immediate outside capital or debt restructuring is required to prevent default or aggressive dilutive equity issuance.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: 2Y Financing Flow */}
          {activeTab === "financing" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                    24-Month Capital Formation Breakdown
                  </h4>
                  <span className="font-mono text-sm font-black text-emerald-400">
                    Total Injected: ${(f.totalRaised / 1e6).toFixed(1)}M
                  </span>
                </div>

                {/* Progress Visualizer */}
                <div className="w-full bg-zinc-800 h-3 rounded-full overflow-hidden flex">
                  <div 
                    className="bg-blue-500 h-full" 
                    style={{ width: `${(f.equityRaised / f.totalRaised) * 100}%` }} 
                    title={`Equity: $${(f.equityRaised/1e6).toFixed(1)}M`} 
                  />
                  <div 
                    className="bg-amber-500 h-full" 
                    style={{ width: `${(f.atmProceeds / f.totalRaised) * 100}%` }} 
                    title={`ATM: $${(f.atmProceeds/1e6).toFixed(1)}M`} 
                  />
                  <div 
                    className="bg-purple-500 h-full" 
                    style={{ width: `${(f.warrantProceeds / f.totalRaised) * 100}%` }} 
                    title={`Warrants: $${(f.warrantProceeds/1e6).toFixed(1)}M`} 
                  />
                  <div 
                    className="bg-rose-500 h-full" 
                    style={{ width: `${((f.convertibleDebt + f.seniorDebt) / f.totalRaised) * 100}%` }} 
                    title={`Debt: $${((f.convertibleDebt + f.seniorDebt)/1e6).toFixed(1)}M`} 
                  />
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                    <div>
                      <span className="text-zinc-400 text-[11px] block">Registered Direct / Equity</span>
                      <strong className="text-white font-mono">${(f.equityRaised / 1e6).toFixed(1)}M</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                    <div>
                      <span className="text-zinc-400 text-[11px] block">Maxim ATM Sales</span>
                      <strong className="text-white font-mono">${(f.atmProceeds / 1e6).toFixed(1)}M</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-purple-500 shrink-0" />
                    <div>
                      <span className="text-zinc-400 text-[11px] block">Warrant Inducements</span>
                      <strong className="text-white font-mono">${(f.warrantProceeds / 1e6).toFixed(1)}M</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
                    <div>
                      <span className="text-zinc-400 text-[11px] block">Convertible / Senior Debt</span>
                      <strong className="text-white font-mono">${((f.convertibleDebt + f.seniorDebt) / 1e6).toFixed(1)}M</strong>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-850 text-xs text-zinc-300 leading-relaxed">
                  <p>{f.summary}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Registration Statements & Shelves */}
          {activeTab === "shelves" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                      Form S-3 Universal Shelf & ATM Capacity
                    </h4>
                    <p className="text-xs text-zinc-500">Filings underwritten by Maxim Group LLC and syndicate</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    r.dilutionRisk === "Severe" ? "bg-rose-950 text-rose-300 border border-rose-500" : "bg-amber-950 text-amber-300 border border-amber-500"
                  }`}>
                    {r.dilutionRisk} Dilution Overhang
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850">
                    <span className="text-[10px] text-zinc-500 block">Universal Shelf Ceiling</span>
                    <span className="font-mono text-lg font-bold text-white block mt-0.5">
                      ${(r.activeShelfCapacity / 1e6).toFixed(1)}M
                    </span>
                    <span className="text-[10px] text-zinc-400">Available on active Form S-3</span>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850">
                    <span className="text-[10px] text-zinc-500 block">Lead Underwriter / Sales Agent</span>
                    <span className="font-mono text-sm font-bold text-amber-400 block mt-0.5">
                      {r.primaryUnderwriter}
                    </span>
                    <span className="text-[10px] text-zinc-400">ATM continuous equity facility</span>
                  </div>
                </div>

                {/* Filings Table */}
                <div className="border border-zinc-800 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-950 border-b border-zinc-800 text-[10px] font-mono text-zinc-400 uppercase">
                      <tr>
                        <th className="p-2.5">Form</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Filing Description</th>
                        <th className="p-2.5 text-right">SEC Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850">
                      {r.filings.map((filing, idx) => (
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
                              <span>EDGAR</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: C-Suite & Legal Contacts */}
          {activeTab === "contacts" && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                Executive & Corporate Governance Roster ({target.contacts.length} Contacts)
              </h4>

              <div className="space-y-3">
                {target.contacts.map((c) => (
                  <div key={c.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-bold text-white">{c.name}</h5>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            c.receptivityScore === "very_high" ? "bg-emerald-500/20 text-emerald-300" : "bg-blue-500/20 text-blue-300"
                          }`}>
                            {c.receptivityScore.replace(/_/g, " ")} receptivity
                          </span>
                        </div>
                        <p className="text-xs text-amber-400 font-medium">{c.title}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`mailto:${c.email}`}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs inline-flex items-center gap-1.5"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Email</span>
                        </a>
                        <a
                          href={`tel:${c.phone}`}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs inline-flex items-center gap-1.5"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-zinc-400 pt-1 border-t border-zinc-850">
                      <div>Email: <strong className="text-zinc-200 select-all">{c.email}</strong></div>
                      <div>Phone: <strong className="text-zinc-200">{c.phone}</strong></div>
                    </div>

                    <p className="text-xs text-zinc-400 pt-1 leading-relaxed">
                      {c.roleSummary}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Asset Liberator Outreach Generator */}
          {activeTab === "outreach" && (
            <div className="space-y-5">
              {/* Dual Track Selector */}
              <div className="flex items-center rounded-xl bg-zinc-900 border border-zinc-800 p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setOutreachTrack("management")}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    outreachTrack === "management" ? "bg-amber-500 text-zinc-950 font-black shadow-md" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Management Proposal (CEO / CFO)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOutreachTrack("legal")}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    outreachTrack === "legal" ? "bg-amber-500 text-zinc-950 font-black shadow-md" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Scale className="w-4 h-4" />
                  <span>Legal & Fiduciary Track (Outside Counsel / GC)</span>
                </button>
              </div>

              {/* Recipient Card */}
              {primaryRecipient && (
                <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>
                      Addressing Target: <strong className="text-white">{primaryRecipient.name}</strong> ({primaryRecipient.title})
                    </span>
                  </div>
                  <span className="font-mono text-zinc-400">{primaryRecipient.email}</span>
                </div>
              )}

              {/* Subject Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-bold">Outreach Subject Line</span>
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
                  <span className="text-zinc-400 font-bold">Personalized Diligence Proposal Body</span>
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

              {/* Dispatch Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenGmail}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-red-600/30 transition-all cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Open in Gmail Web (1-Click)</span>
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

          {/* TAB 6: CRM & Notes */}
          {activeTab === "crm" && (
            <div className="space-y-6">
              {/* Stage Progression Selector */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                  Update Deal Pipeline Stage
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
                  placeholder="Record restructuring insights, Maxim panel comments, or lender intelligence..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 min-h-[90px]"
                />
                <button
                  type="submit"
                  disabled={!newNote.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs disabled:opacity-50 cursor-pointer"
                >
                  Save Note to Dossier
                </button>
              </form>

              {/* Notes Timeline */}
              <div className="space-y-3 pt-3 border-t border-zinc-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                  Dossier Notes History ({target.crm.notes.length})
                </h4>
                {target.crm.notes.map((n) => (
                  <div key={n.id} className="p-3 bg-zinc-950 rounded-xl border border-zinc-850 space-y-1">
                    <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
                      <span>{n.author}</span>
                      <span>{n.date}</span>
                    </div>
                    <p className="text-xs text-zinc-200 leading-relaxed">{n.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
