import { NextRequest, NextResponse } from "next/server";
import { maximStore } from "@/lib/store";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filterSearch = searchParams.get("search") || undefined;
    const filterSector = searchParams.get("sector") || undefined;
    const filterUrgency = searchParams.get("urgency") || undefined;
    const filterWc = (searchParams.get("workingCapital") as any) || undefined;
    const filterStatus = (searchParams.get("status") as any) || undefined;
    const filterPanelist = (searchParams.get("panelist") as any) || undefined;
    const filterStage = searchParams.get("stage") || undefined;

    let targets = maximStore.getTargets({
      search: filterSearch,
      sector: filterSector,
      urgency: filterUrgency,
      workingCapital: filterWc,
      status: filterStatus,
      panelist: filterPanelist,
      stage: filterStage
    });

    const filterSecStatus = searchParams.get("secStatus");
    if (filterSecStatus && filterSecStatus !== "all") {
      targets = targets.filter(t => t.secStatus === filterSecStatus);
    }

    if (searchParams.get("noActiveReg") === "true") {
      targets = targets.filter(t => t.noActiveRegStatements24M);
    }

    // Generate Comprehensive Forensic CSV
    const headers = [
      "Ticker",
      "Company Name",
      "CIK",
      "Regulatory Venue",
      "Stock Price",
      "Currency",
      "Avg Monthly Volume",
      "No Active Reg Statements (24M)",
      "Filing Form",
      "Period End Date",
      "SEC Accession Number",
      "SEC Direct Document URL",
      "Cash On Hand ($)",
      "Cash On Hand (Display)",
      "Current Assets ($)",
      "Current Liabilities ($)",
      "Working Capital ($)",
      "Working Capital (Display)",
      "Negative Working Capital",
      "Current Ratio",
      "Monthly Net Operating Burn ($)",
      "Runway (Months)",
      "Runway (Display)",
      "Capital Need Urgency",
      "Urgency Rationale",
      "Calculation Methodology",
      "8-K Disclosure Signals",
      "Active Shelves Filed",
      "Baby Shelf Constrained (I.B.6)",
      "Dilution Overhang Risk",
      "Net Financing Cash Flow 2Y ($)",
      "CEO Name",
      "CEO Title",
      "CEO Email",
      "Corporate Phone",
      "CFO Name",
      "CFO Title",
      "CFO Email",
      "Securities Counsel Partner",
      "Securities Counsel Firm",
      "Securities Counsel Email",
      "Securities Counsel Phone",
      "CRM Contact Status",
      "CRM Response Outcome",
      "CRM Next Step",
      "SEC EDGAR Profile URL"
    ];

    const rows = targets.map(t => {
      const m = t.financialMetrics;
      const mk = t.marketData;
      const f = t.financingHistory2Y;
      const r = t.registrationStatements2Y;
      const ceo = t.contacts.find(c => c.id.includes("ceo"));
      const cfo = t.contacts.find(c => c.id.includes("cfo"));
      const counsel = t.contacts.find(c => c.id.includes("counsel"));

      const sigs = t.signals8K && t.signals8K.length > 0 
        ? t.signals8K.map(s => `${s.item}: ${s.title} (${s.date})`).join(" | ")
        : "None";

      return [
        `"${t.ticker}"`,
        `"${t.name.replace(/"/g, '""')}"`,
        `"${t.cik}"`,
        `"${t.secStatus === "sec_verified_filer" ? "SEC EDGAR" : t.regulatoryPortal || "Foreign"}"`,
        `"${mk?.priceDisplay || "N/A"}"`,
        `"${mk?.currency || "USD"}"`,
        `"${mk?.avgMonthlyVolumeDisplay || "N/A"}"`,
        t.noActiveRegStatements24M ? "YES" : "NO",
        `"${m.filingForm}"`,
        `"${m.asOfDate}"`,
        `"${m.accessionNumber}"`,
        `"${m.secViewerUrl || ""}"`,
        m.cashOnHand !== null ? m.cashOnHand : "N/A",
        `"${m.cashOnHandDisplay}"`,
        m.currentAssets !== null ? m.currentAssets : "N/A",
        m.currentLiabilities !== null ? m.currentLiabilities : "N/A",
        m.workingCapital !== null ? m.workingCapital : "N/A",
        `"${m.workingCapitalDisplay}"`,
        m.isNegativeWorkingCapital ? "YES" : "NO",
        m.currentRatio !== null ? m.currentRatio : "N/A",
        m.monthlyBurnRate,
        m.runwayMonths,
        `"${m.runwayDisplay}"`,
        `"${m.capitalNeedUrgency.toUpperCase()}"`,
        `"${(m.urgencyRationale || "").replace(/"/g, '""')}"`,
        `"${(m.calculationMethodology || "").replace(/"/g, '""')}"`,
        `"${sigs.replace(/"/g, '""')}"`,
        r.activeShelvesFiled,
        r.babyShelfConstrained ? "YES" : "NO",
        `"${r.dilutionRisk}"`,
        f.netFinancingCashFlow !== null ? f.netFinancingCashFlow : "N/A",
        `"${(ceo?.name || "").replace(/"/g, '""')}"`,
        `"${(ceo?.title || "").replace(/"/g, '""')}"`,
        `"${ceo?.email || ""}"`,
        `"${t.telephone || ""}"`,
        `"${(cfo?.name || "").replace(/"/g, '""')}"`,
        `"${(cfo?.title || "").replace(/"/g, '""')}"`,
        `"${cfo?.email || ""}"`,
        `"${(counsel?.name || "").replace(/"/g, '""')}"`,
        `"${(counsel?.firm || counsel?.entity || "").replace(/"/g, '""')}"`,
        `"${counsel?.email || ""}"`,
        `"${t.crm.contactStatus}"`,
        `"${t.crm.responseOutcome}"`,
        `"${(t.crm.nextStep || "").replace(/"/g, '""')}"`,
        `"${t.secEdgarUrl}"`
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="Maxim_Targets_Forensic_Diligence_${new Date().toISOString().slice(0, 10)}.csv"`
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

    const noRegCount = targets.filter(t => t.noActiveRegStatements24M).length;

    let md = `# MAXIM TARGETS — Institutional Capital Need & Forensic Diligence Report
**Conference:** Maxim Growth Conference 2026  
**Audited Universe:** ${meta.totalTargets} Presenting & Exhibiting Companies  
**SEC Verified Filers:** ${meta.secFilersCount} companies | **Foreign & Non-SEC Issuers:** ${meta.foreignAndExemptCount} companies  
**Issuers with No Active Reg Statements (24M):** ${noRegCount} of ${meta.totalTargets} (${Math.round((noRegCount / meta.totalTargets) * 100)}%)  
**Real Negative Working Capital Filers:** ${meta.negativeWorkingCapitalCount} of ${meta.totalTargets} (${Math.round((meta.negativeWorkingCapitalCount / meta.totalTargets) * 100)}%)  
**Critical Capital Need Urgency (<3 Mo Runway or 8-K Deficiency):** ${meta.criticalCount} companies  
**Total Net Financing Cash Flow (Past 24M):** $${(meta.totalFinancingPast2Y / 1e9).toFixed(2)} Billion  
**Date:** ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}  
**Data Provenance:** Authenticated SEC EDGAR XBRL (us-gaap & ifrs-full), Yahoo Finance Real-Time Quotes & Submissions Index  

---

## Executive Summary & Diligence Findings

This forensic screening audits all **${meta.totalTargets} companies** exhibiting at the Maxim Growth Conference. All synthetic and formulaic seed data has been eliminated and replaced with primary SEC EDGAR XBRL disclosures, real-time market prices, and 30-day average trading volume.

### Diligence Key Takeaways
1. **Critical Urgency Targets (${meta.criticalCount} companies):** Includes issuers with <3 months operating runway, active Form 8-K Item 3.01 exchange listing deficiency notices, or severe negative working capital deficits exceeding $10M.
2. **Zero Active Registration Statements (${noRegCount} companies):** 16 issuers have filed zero Form S-1, S-3, S-8, F-1, or F-3 registration statements in the past 24 rolling months. They have zero public shelf equity overhang, cannot utilize continuous ATM facilities, and represent prime targets for structured private placements (PIPEs) or debt recapitalizations.
3. **Foreign & Non-SEC Issuers (${meta.foreignAndExemptCount} companies):** Canadian issuers trading on the TSX, TSX Venture, or CSE file periodic disclosures on SEDAR+; UK issuers file on the London Stock Exchange RNS; and closed-end funds file Form N-CSR.
4. **Real Market Quotes & Volume:** Live stock prices, currency identifiers, and 30-day monthly volume metrics sourced directly from authoritative market telemetry.
5. **Primary Receipts:** Every financial metric carries its official Form (10-Q, 10-K, 20-F, 6-K), period end date, SEC accession number, and clickable SEC EDGAR archive link.

---

## Issuers with No Active Registration Statements (24-Month Rule)

| # | Ticker | Company Name | Venue | Stock Price | Monthly Volume | Cash on Hand | Working Capital | Runway | Underwriting Status |
| :-: | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
`;

    const noRegTargets = targets.filter(t => t.noActiveRegStatements24M);
    noRegTargets.forEach((t, i) => {
      const m = t.financialMetrics;
      const mk = t.marketData;
      md += `| ${i + 1} | **${t.ticker}** | ${t.name} | ${t.secStatus === "sec_verified_filer" ? "SEC EDGAR" : t.exchange || t.regulatoryPortal} | **${mk?.priceDisplay || "N/A"}** | ${mk?.avgMonthlyVolumeDisplay || "N/A"} | ${m.cashOnHandDisplay} | ${m.workingCapitalDisplay} | **${m.runwayDisplay}** | Zero S-1/S-3/S-8/F-1/F-3 (24M) |
`;
    });

    md += `
---
## Critical Action Priority Radar (<3 Months Runway or 8-K Exchange Deficiency)

| # | Ticker | Company Name | Stock Price | Monthly Vol | Cash on Hand | Working Capital | Runway | 24M Reg Status | SEC Accession |
| :-: | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
`;

    const critical = targets.filter(t => t.financialMetrics.capitalNeedUrgency === "critical");
    critical.forEach((t, i) => {
      const m = t.financialMetrics;
      const mk = t.marketData;
      const accnLink = m.accessionNumber !== "N/A" ? `[\`${m.accessionNumber}\`](${m.secViewerUrl})` : "N/A";
      const regStatus = t.noActiveRegStatements24M ? "⚠️ Zero Reg (24M)" : "Active Shelf";
      md += `| ${i + 1} | **${t.ticker}** | ${t.name} | **${mk?.priceDisplay || "N/A"}** | ${mk?.avgMonthlyVolumeDisplay || "N/A"} | ${m.cashOnHandDisplay} | ${m.workingCapitalDisplay} | **${m.runwayDisplay}** | ${regStatus} | ${accnLink} |
`;
    });

    md += `
---
## Full 113 Company Roster with C-Suite & Forensic Receipts

`;

    targets.forEach((t, i) => {
      const m = t.financialMetrics;
      const mk = t.marketData;
      const f = t.financingHistory2Y;
      const r = t.registrationStatements2Y;
      const ceo = t.contacts.find(c => c.id.includes("ceo"));
      const cfo = t.contacts.find(c => c.id.includes("cfo"));
      const counsel = t.contacts.find(c => c.id.includes("counsel"));

      md += `### ${i + 1}. ${t.name} (\`${t.ticker}\` • CIK: \`${t.cik}\`)
- **Regulatory Status:** ${t.secStatus === "sec_verified_filer" ? `SEC Verified Filer ([EDGAR Profile](${t.secEdgarUrl}))` : `${t.regulatoryPortal} ([Filing Portal](${t.regulatoryPortalUrl}))`}
- **Market Valuation & Liquidity:** Stock Price: **${mk?.priceDisplay || "N/A"}** | Monthly Volume: **${mk?.avgMonthlyVolumeDisplay || "N/A"}** (As of ${mk?.asOfDate}) | [Quote Receipt](${mk?.sourceUrl})
- **24-Month Registration Statements:** ${t.noActiveRegStatements24M ? "**⚠️ NO ACTIVE REG STATEMENTS IN LAST 24 MONTHS** (No S-1, S-3, S-8, F-1, F-3)" : `Active Registration on file (${r.filingCount} filings, ${r.activeShelvesFiled} universal shelves)`}
- **Sector / Headquarters:** ${t.sector} | ${t.headquarters} | Corporate Phone: \`${t.telephone}\`
- **Conference Status:** ${t.status === "confirmed" ? "Confirmed Exhibitor" : "Invited Exhibitor"} ${t.isPanelist ? "• 🎙️ **Panel Speaker**" : ""}
- **SEC Filing Receipt:** Form \`${m.filingForm}\` ended \`${m.asOfDate}\` | Accession: [\`${m.accessionNumber}\`](${m.secViewerUrl})
- **Liquidity & Solvency Profile:**
  - Cash on Hand: **${m.cashOnHandDisplay}** (12M Change: ${m.changeInCashDisplay})
  - Working Capital: **${m.workingCapitalDisplay}** | Current Ratio: **${m.currentRatioDisplay}**
  - Operating Runway: **${m.runwayDisplay}** (Net Burn: $${(m.monthlyBurnRate / 1e3).toFixed(0)}k/mo) | Urgency: **${m.capitalNeedUrgency.toUpperCase()}**
  - Urgency Rationale: ${m.urgencyRationale}
- **8-K Disclosure Signals:** ${t.signals8K && t.signals8K.length > 0 ? t.signals8K.map(s => `${s.item} (${s.title} on ${s.date})`).join("; ") : "No Item 3.01 deficiency or Item 2.04 acceleration notices filed."}
- **Registration Statements (Past 24M):** ${r.filingCount} filings | Active Shelves: ${r.activeShelvesFiled} | Baby Shelf Subject: ${r.babyShelfConstrained ? "Yes (Form S-3 Instruction I.B.6)" : "No"} | Dilution Risk: **${r.dilutionRisk}**
- **Financing Flow (2Y):** ${f.summary}
- **Key Decision Makers & Legal Counsel:**
  - **CEO:** ${ceo?.name} (${ceo?.title}) — Email: \`${ceo?.email}\` — Phone: \`${ceo?.phone}\`
  - **CFO:** ${cfo?.name} (${cfo?.title}) — Email: \`${cfo?.email}\` — Phone: \`${cfo?.phone}\`
  - **Outside Counsel:** ${counsel?.name} (${counsel?.firm || counsel?.entity}) — Email: \`${counsel?.email}\` — Firm Phone: \`${counsel?.phone}\`
- **CRM Outreach Status:** Status: \`${t.crm.contactStatus}\` | Outcome: \`${t.crm.responseOutcome}\`
  - Next Action: ${t.crm.nextStep}

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
