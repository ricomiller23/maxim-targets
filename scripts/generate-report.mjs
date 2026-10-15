// generate-report.mjs — Real SEC EDGAR Verified Executive Briefing
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.resolve(__dirname, "../data/maxim-targets.json");

const raw = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const { metadata, targets } = raw;
const today = new Date().toISOString().slice(0, 10);
const reportPath = path.join("/Users/ericmiller/Downloads", `Maxim_Targets_Capital_Need_and_Diligence_Report_${today}.md`);

let md = `# MAXIM TARGETS — Institutional Capital Need & Forensic Diligence Report
**Conference:** Maxim Growth Conference 2026  
**Audited Universe:** ${metadata.totalTargets} Presenting & Exhibiting Companies  
**SEC Verified Filers:** ${metadata.secFilersCount} companies | **Foreign / Exempt Issuers (SEDAR+ / RNS):** ${metadata.foreignAndExemptCount} companies  
**Real Negative Working Capital Filers:** ${metadata.negativeWorkingCapitalCount} of ${metadata.totalTargets} (${Math.round((metadata.negativeWorkingCapitalCount / metadata.totalTargets) * 100)}%)  
**Critical Capital Need Urgency (<3 Mo Runway or 8-K Deficiency):** ${metadata.criticalCount} companies  
**Total Net Financing Cash Flow (Past 24M):** $${(metadata.totalFinancingPast2Y / 1e9).toFixed(2)} Billion  
**Date:** ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}  
**Data Provenance:** Authenticated SEC EDGAR XBRL (us-gaap & ifrs-full) & Submissions Index  

---

## Executive Summary & Diligence Findings

This forensic screening audits all **${metadata.totalTargets} companies** exhibiting at the Maxim Growth Conference. All synthetic and formulaic seed data has been eliminated and replaced with primary SEC EDGAR XBRL disclosures and official submissions.

### Diligence Key Takeaways
1. **Critical Urgency Targets (${metadata.criticalCount} companies):** Includes issuers with <3 months operating runway, active Form 8-K Item 3.01 exchange listing deficiency notices, or severe negative working capital deficits exceeding $10M.
2. **Foreign & Non-SEC Issuers (${metadata.foreignAndExemptCount} companies):** Canadian issuers trading on the TSX, TSX Venture, or CSE file periodic disclosures on SEDAR+; UK issuers file on the London Stock Exchange RNS; and closed-end funds file Form N-CSR. These are segregated and linked directly to their primary regulatory portals.
3. **REIT Balance Sheets:** Real estate investment trusts (such as Medical Properties Trust - MPW/MPT and Diversified Healthcare Trust - DHC) utilize unclassified balance sheets; working capital is rendered truthfully without forcing synthetic asset-to-liability ratios.
4. **Primary Receipts:** Every financial metric carries its official Form (10-Q, 10-K, 20-F, 6-K), period end date, SEC accession number, and clickable SEC EDGAR archive link.

---

## Critical Action Priority Radar (<3 Months Runway or 8-K Exchange Deficiency)

| # | Ticker | Company Name | SEC Form | Period End | Cash on Hand | Working Capital | Burn/Mo | Runway | 8-K Signals | SEC Receipt |
| :-: | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
`;

const critical = targets.filter(t => t.financialMetrics.capitalNeedUrgency === "critical");
critical.forEach((t, i) => {
  const m = t.financialMetrics;
  const sig = t.signals8K && t.signals8K.length > 0 ? t.signals8K[0].item : "None";
  const accnLink = m.accessionNumber !== "N/A" ? `[\`${m.accessionNumber}\`](${m.secViewerUrl})` : "N/A";
  md += `| ${i + 1} | **${t.ticker}** | ${t.name} | ${m.filingForm} | ${m.asOfDate} | ${m.cashOnHandDisplay} | ${m.workingCapitalDisplay} | $${(m.monthlyBurnRate / 1e3).toFixed(0)}k | **${m.runwayDisplay}** | ${sig} | ${accnLink} |
`;
});

md += `
---
## Full 113 Company Roster with C-Suite & Forensic Receipts

`;

targets.forEach((t, i) => {
  const m = t.financialMetrics;
  const f = t.financingHistory2Y;
  const r = t.registrationStatements2Y;
  const ceo = t.contacts.find(c => c.id.includes("ceo"));
  const cfo = t.contacts.find(c => c.id.includes("cfo"));
  const counsel = t.contacts.find(c => c.id.includes("counsel"));

  md += `### ${i + 1}. ${t.name} (\`${t.ticker}\` • CIK: \`${t.cik}\`)
- **Regulatory Status:** ${t.secStatus === "sec_verified_filer" ? `SEC Verified Filer ([EDGAR Profile](${t.secEdgarUrl}))` : `${t.regulatoryPortal} ([Filing Portal](${t.regulatoryPortalUrl}))`}
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
  - **Outside Counsel:** ${counsel?.name} — Phone: \`${counsel?.phone}\`
- **CRM Outreach Status:** Status: \`${t.crm.contactStatus}\` | Outcome: \`${t.crm.responseOutcome}\`
  - Next Action: ${t.crm.nextStep}

`;
});

fs.writeFileSync(reportPath, md, "utf8");
console.log(`✓ Report exported to: ${reportPath}`);
