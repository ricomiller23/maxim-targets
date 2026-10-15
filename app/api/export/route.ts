import { NextRequest, NextResponse } from "next/server";
import { maximStore } from "@/lib/store";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const targets = maximStore.getTargets();

    // Generate CSV
    const headers = [
      "Ticker",
      "Company Name",
      "CIK",
      "Sector",
      "Status",
      "Panelist",
      "Cash On Hand ($)",
      "12M Cash Delta ($)",
      "Current Assets ($)",
      "Current Liabilities ($)",
      "Working Capital ($)",
      "Negative Working Capital",
      "Current Ratio",
      "Monthly Burn ($)",
      "Runway (Months)",
      "Urgency Tier",
      "2Y Total Raised ($)",
      "2Y Equity ($)",
      "2Y Warrants ($)",
      "2Y Debt ($)",
      "2Y ATM ($)",
      "Active Shelf ($)",
      "Dilution Risk",
      "CEO Name",
      "CEO Email",
      "CEO Phone",
      "CFO Name",
      "CFO Email",
      "Outside Counsel",
      "Outside Counsel Email",
      "SEC EDGAR URL"
    ];

    const rows = targets.map(t => {
      const m = t.financialMetrics;
      const f = t.financingHistory2Y;
      const r = t.registrationStatements2Y;
      const ceo = t.contacts.find(c => c.id.includes("ceo"));
      const cfo = t.contacts.find(c => c.id.includes("cfo"));
      const counsel = t.contacts.find(c => c.id.includes("outside-counsel"));

      return [
        `"${t.ticker}"`,
        `"${t.name.replace(/"/g, '""')}"`,
        `"${t.cik}"`,
        `"${t.sector}"`,
        `"${t.status}"`,
        `"${t.isPanelist ? "Yes" : "No"}"`,
        m.cashOnHand,
        m.changeInCash12M,
        m.currentAssets,
        m.currentLiabilities,
        m.workingCapital,
        m.isNegativeWorkingCapital ? "YES" : "NO",
        m.currentRatio,
        m.monthlyBurnRate,
        m.runwayMonths,
        `"${m.capitalNeedUrgency.toUpperCase()}"`,
        f.totalRaised,
        f.equityRaised,
        f.warrantProceeds,
        f.seniorDebt + f.convertibleDebt,
        f.atmProceeds,
        r.activeShelfCapacity,
        `"${r.dilutionRisk}"`,
        `"${ceo?.name || ""}"`,
        `"${ceo?.email || ""}"`,
        `"${ceo?.phone || ""}"`,
        `"${cfo?.name || ""}"`,
        `"${cfo?.email || ""}"`,
        `"${counsel?.name || ""} (${counsel?.firm || ""})"`,
        `"${counsel?.email || ""}"`,
        `"${t.secEdgarUrl}"`
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="Maxim_Targets_Diligence_Export_${new Date().toISOString().slice(0, 10)}.csv"`
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const targets = maximStore.getTargets();
    const meta = maximStore.getMetadata();
    const today = new Date().toISOString().slice(0, 10);

    const reportPath = path.join("/Users/ericmiller/Downloads", `Maxim_Targets_Capital_Need_and_Diligence_Report_${today}.md`);

    let md = `# MAXIM TARGETS — Institutional Capital Need & Forensic Diligence Report
**Conference:** Maxim Growth Conference 2026  
**Audited Universe:** ${meta.totalTargets} Presenting & Exhibiting Companies  
**Negative Working Capital Deficit Universe:** ${meta.negativeWorkingCapitalCount} of ${meta.totalTargets} (${Math.round((meta.negativeWorkingCapitalCount / meta.totalTargets) * 100)}%)  
**Critical Runway (<3 Months):** ${meta.criticalCount} companies  
**Total 24-Month Financing Injected:** $${(meta.totalFinancingPast2Y / 1e9).toFixed(2)} Billion  
**Date:** ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}  

---

## Executive Summary

This forensic screening audits all **${meta.totalTargets} companies** presenting at the Maxim Conference. Companies exhibiting at Maxim typically face structural capitalization hurdles: rapid operational cash burn, depleted balance sheet cash, negative working capital, and heavy reliance on Maxim Group equity direct offerings, warrant issuances, and At-The-Market (ATM) continuous dilution facilities.

### Screening Matrix Overview
- **Critical Urgency (<3 Months Runway):** ${meta.criticalCount} companies
- **Urgent Runway (3–6 Months):** ${meta.urgentCount} companies
- **Aggregate Working Capital Deficit:** $${(meta.totalNegativeWorkingCapitalDeficit / 1e6).toFixed(1)} Million
- **Panelist Companies Flagged:** ${meta.panelistCount} keynotes/panelists

---

## High-Conviction Critical Targets (Negative Working Capital & Urgent Capital Need)

| # | Ticker | Company Name | Sector | Cash ($) | 12M Delta | Working Capital | Burn/Mo | Runway | Urgency | Active S-3 Shelf |
| :-: | :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
`;

    const critical = targets.filter(t => t.financialMetrics.capitalNeedUrgency === "critical");
    critical.forEach((t, i) => {
      const m = t.financialMetrics;
      const r = t.registrationStatements2Y;
      md += `| ${i + 1} | **${t.ticker}** | ${t.name} | ${t.sector} | $${(m.cashOnHand / 1e6).toFixed(2)}M | $${(m.changeInCash12M / 1e6).toFixed(1)}M | -$${(m.workingCapitalDeficit / 1e6).toFixed(1)}M | $${(m.monthlyBurnRate / 1e3).toFixed(0)}k | **${m.runwayMonths} mo** | 🔴 CRITICAL | $${(r.activeShelfCapacity / 1e6).toFixed(1)}M |\n`;
    });

    md += `\n---\n## Full 113 Company Roster with C-Suite & Legal Contacts\n\n`;

    targets.forEach((t, i) => {
      const m = t.financialMetrics;
      const f = t.financingHistory2Y;
      const r = t.registrationStatements2Y;
      const ceo = t.contacts.find(c => c.id.includes("ceo"));
      const cfo = t.contacts.find(c => c.id.includes("cfo"));
      const counsel = t.contacts.find(c => c.id.includes("outside-counsel"));

      md += `### ${i + 1}. ${t.name} (\`${t.ticker}\` • CIK: \`${t.cik}\`)
- **Status:** ${t.status === "confirmed" ? "Confirmed Exhibitor" : "Invited Exhibitor"} ${t.isPanelist ? "• 🎙️ **Panel Speaker**" : ""}
- **Sector / Exchange:** ${t.sector} | ${t.exchange} | [SEC EDGAR Profile](${t.secEdgarUrl})
- **Liquidity & Solvency:**
  - Cash on Hand: **$${(m.cashOnHand / 1e6).toFixed(2)}M** (12M Change: **$${(m.changeInCash12M / 1e6).toFixed(1)}M** / ${m.changeInCashPct}%)
  - Working Capital: **${m.isNegativeWorkingCapital ? `-$${(m.workingCapitalDeficit / 1e6).toFixed(2)}M (DEFICIT)` : `+$${(m.workingCapital / 1e6).toFixed(2)}M`}** | Current Ratio: **${m.currentRatio}x**
  - Cash Runway: **${m.runwayMonths} Months** (Burn: $${(m.monthlyBurnRate / 1e3).toFixed(0)}k/mo) | Urgency: **${m.capitalNeedUrgency.toUpperCase()}**
- **2-Year Funding Composition:** $${(f.totalRaised / 1e6).toFixed(1)}M total ($${(f.equityRaised / 1e6).toFixed(1)}M equity, $${(f.atmProceeds / 1e6).toFixed(1)}M ATM, $${(f.warrantProceeds / 1e6).toFixed(1)}M warrants)
- **Active Shelf / Dilution:** $${(r.activeShelfCapacity / 1e6).toFixed(1)}M Shelf Capacity | Underwriter: ${r.primaryUnderwriter} | Overhang: **${r.dilutionRisk}**
- **Key Decision Makers:**
  - **CEO:** ${ceo?.name} — \`${ceo?.email}\` — \`${ceo?.phone}\`
  - **CFO:** ${cfo?.name} — \`${cfo?.email}\` — \`${cfo?.phone}\`
  - **Securities Counsel:** ${counsel?.name} (${counsel?.firm}) — \`${counsel?.email}\` — \`${counsel?.phone}\`

`;
    });

    fs.writeFileSync(reportPath, md, "utf8");

    return NextResponse.json({
      success: true,
      reportPath,
      targetsExported: targets.length
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
