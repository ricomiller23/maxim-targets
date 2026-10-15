// lib/derive.mjs
// Pure, dependency-free derivation logic shared by the ingest script, the repair
// script, the tests and the UI. No network access and no clock reads at import time.

export const PERIODIC_FORMS = ["10-Q", "10-K", "20-F", "6-K", "40-F"];
const FOREIGN_FORMS = ["20-F", "6-K", "40-F"];
const DAY_MS = 86400000;

/** Freshness thresholds (days after period end). */
export const FRESHNESS = {
  domesticDays: 135, // quarter + ~45-day filing lag
  foreignDays: 300, // annual + ~120-day filing lag; interim reporting is optional for FPIs
  expiredMultiple: 1.5 // older than threshold * multiple => data is not rated
};

const NAME_STOPWORDS = new Set([
  "inc", "corp", "corporation", "ltd", "limited", "llc", "the", "company", "co", "holdings",
  "holding", "group", "plc", "incorporated", "incorporation", "sa", "ab", "as", "publ", "de"
]);

// ---------------------------------------------------------------------------
// Entity matching
// ---------------------------------------------------------------------------

function nameTokens(s) {
  return new Set(
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter((w) => w && !NAME_STOPWORDS.has(w))
  );
}

/** Overlap coefficient of significant name tokens (0..1). */
export function nameOverlap(a, b) {
  const A = nameTokens(a);
  const B = nameTokens(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / Math.min(A.size, B.size);
}

export const ENTITY_MATCH_THRESHOLD = 0.6;

export function entityMatches(seedName, officialName) {
  return nameOverlap(seedName, officialName) >= ENTITY_MATCH_THRESHOLD;
}

// ---------------------------------------------------------------------------
// Freshness
// ---------------------------------------------------------------------------

export function freshnessFor(asOfDate, form, now = new Date()) {
  if (!asOfDate || !/^\d{4}-\d{2}-\d{2}$/.test(asOfDate)) {
    return { status: "unknown", ageDays: null, thresholdDays: null };
  }
  const thresholdDays = FOREIGN_FORMS.includes(form) ? FRESHNESS.foreignDays : FRESHNESS.domesticDays;
  const ageDays = Math.floor((now.getTime() - Date.parse(`${asOfDate}T00:00:00Z`)) / DAY_MS);
  let status = "current";
  if (ageDays > thresholdDays * FRESHNESS.expiredMultiple) status = "expired";
  else if (ageDays > thresholdDays) status = "stale";
  return { status, ageDays, thresholdDays };
}

// ---------------------------------------------------------------------------
// XBRL fact selection
// ---------------------------------------------------------------------------

function unitEntries(concept) {
  if (!concept || !concept.units) return { entries: [], unit: null, nonUsdUnit: null };
  if (Array.isArray(concept.units.USD)) return { entries: concept.units.USD, unit: "USD", nonUsdUnit: null };
  const other = Object.keys(concept.units)[0] || null;
  return { entries: [], unit: null, nonUsdUnit: other };
}

function gather(facts, names, forms) {
  const out = [];
  let nonUsdUnit = null;
  const taxonomies = [facts?.facts?.["us-gaap"] || {}, facts?.facts?.["ifrs-full"] || {}];
  names.forEach((name, priority) => {
    for (const tax of taxonomies) {
      const concept = tax[name];
      if (!concept) continue;
      const { entries, nonUsdUnit: nu } = unitEntries(concept);
      if (nu && !nonUsdUnit) nonUsdUnit = nu;
      for (const e of entries) {
        if (forms && !forms.includes(e.form)) continue;
        if (typeof e.val !== "number" || !e.end) continue;
        out.push({ ...e, concept: name, priority });
      }
    }
  });
  return { entries: out, nonUsdUnit };
}

function byRecency(a, b) {
  if (a.end !== b.end) return b.end.localeCompare(a.end);
  if (a.filed !== b.filed) return (b.filed || "").localeCompare(a.filed || "");
  return a.priority - b.priority;
}

/**
 * Latest instant fact across ALL candidate concepts. Choosing the newest period end
 * (not the first concept that exists) is what prevents stale concepts from winning.
 */
export function latestInstant(facts, names, forms = PERIODIC_FORMS) {
  const { entries, nonUsdUnit } = gather(facts, names, forms);
  const instants = entries.filter((e) => !e.start);
  instants.sort(byRecency);
  return { fact: instants[0] || null, nonUsdUnit };
}

export function instantAt(facts, names, end, forms = PERIODIC_FORMS) {
  const { entries } = gather(facts, names, forms);
  const hit = entries.filter((e) => !e.start && e.end === end);
  hit.sort(byRecency);
  return hit[0] || null;
}

/** Instant fact ~12 months before `end` (+/- 20 days), newest filing wins. */
export function instantYearEarlier(facts, names, end, forms = PERIODIC_FORMS) {
  const { entries } = gather(facts, names, forms);
  const target = Date.parse(`${end}T00:00:00Z`) - 365 * DAY_MS;
  const near = entries
    .filter((e) => !e.start && Math.abs(Date.parse(`${e.end}T00:00:00Z`) - target) <= 20 * DAY_MS)
    .sort((a, b) => (b.filed || "").localeCompare(a.filed || ""));
  return near[0] || null;
}

export function monthsInPeriod(start, end) {
  const days = (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / DAY_MS + 1;
  return Math.max(1, Math.round(days / 30.4375));
}

/**
 * Duration fact ending on `end`. Prefers the latest-quarter (3 month) figure when the
 * filing carries it, otherwise the longest (year-to-date) figure. The month count
 * always comes from XBRL start/end, never from an assumption.
 */
export function durationAt(facts, names, end, forms = PERIODIC_FORMS, { startHint } = {}) {
  const { entries } = gather(facts, names, forms);
  const hit = entries.filter((e) => e.start && e.end === end);
  if (hit.length === 0) return null;
  const withMonths = hit.map((e) => ({ ...e, months: monthsInPeriod(e.start, e.end) }));
  if (startHint) {
    const exact = withMonths.filter((e) => e.start === startHint).sort(byRecency);
    if (exact[0]) return exact[0];
  }
  const quarter = withMonths.filter((e) => e.months >= 2 && e.months <= 4).sort(byRecency);
  if (quarter[0]) return quarter[0];
  withMonths.sort((a, b) => b.months - a.months || byRecency(a, b));
  return withMonths[0];
}

export const CONCEPTS = {
  cash: [
    "CashAndCashEquivalentsAtCarryingValue",
    "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents",
    "CashAndCashEquivalents",
    "Cash"
  ],
  shortTermInvestments: [
    "ShortTermInvestments",
    "MarketableSecuritiesCurrent",
    "AvailableForSaleSecuritiesDebtSecuritiesCurrent",
    "OtherShortTermInvestments"
  ],
  currentAssets: ["AssetsCurrent", "CurrentAssets"],
  currentLiabilities: ["LiabilitiesCurrent", "CurrentLiabilities"],
  operatingCashFlow: [
    "NetCashProvidedByUsedInOperatingActivities",
    "NetCashProvidedByUsedInOperatingActivitiesContinuingOperations",
    "CashFlowsFromUsedInOperatingActivities",
    "NetCashFlowsFromUsedInOperatingActivities"
  ],
  capex: [
    "PaymentsToAcquirePropertyPlantAndEquipment",
    "PaymentsToAcquireProductiveAssets",
    "PurchaseOfPropertyPlantAndEquipment",
    "PurchaseOfPropertyPlantAndEquipmentClassifiedAsInvestingActivities"
  ],
  financingCashFlow: ["NetCashProvidedByUsedInFinancingActivities", "CashFlowsFromUsedInFinancingActivities"],
  revenue: ["Revenues", "RevenueFromContractWithCustomerExcludingAssessedTax", "SalesRevenueNet", "Revenue"]
};

/**
 * Extract all inputs for one issuer from an SEC companyfacts payload. Every figure is
 * taken from the SAME period end as the latest cash fact so the metrics are comparable.
 */
export function extractFacts(companyFacts) {
  const { fact: cash, nonUsdUnit } = latestInstant(companyFacts, CONCEPTS.cash);
  if (!cash) {
    return { cash: null, nonUsdUnit, reportingCurrencyNote: nonUsdUnit ? `Balance sheet is tagged in ${nonUsdUnit}, not USD` : null };
  }
  const end = cash.end;
  const sti = instantAt(companyFacts, CONCEPTS.shortTermInvestments, end);
  const ca = instantAt(companyFacts, CONCEPTS.currentAssets, end);
  const cl = instantAt(companyFacts, CONCEPTS.currentLiabilities, end);
  const ocf = durationAt(companyFacts, CONCEPTS.operatingCashFlow, end);
  const capex = ocf ? durationAt(companyFacts, CONCEPTS.capex, end, PERIODIC_FORMS, { startHint: ocf.start }) : null;
  const fin = ocf ? durationAt(companyFacts, CONCEPTS.financingCashFlow, end, PERIODIC_FORMS, { startHint: ocf.start }) : null;
  const prior = instantYearEarlier(companyFacts, CONCEPTS.cash, end);
  const rev = ocf ? durationAt(companyFacts, CONCEPTS.revenue, end, PERIODIC_FORMS, { startHint: ocf.start }) : null;

  return {
    cash,
    shortTermInvestments: sti ? sti.val : null,
    currentAssets: ca ? ca.val : null,
    currentLiabilities: cl ? cl.val : null,
    ocf: ocf ? ocf.val : null,
    ocfMonths: ocf ? ocf.months : null,
    capex: capex ? Math.abs(capex.val) : 0,
    financing: fin ? fin.val : null,
    priorCash: prior ? prior.val : null,
    annualizedRevenue: rev && rev.months ? (rev.val * 12) / rev.months : null,
    nonUsdUnit: null
  };
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function fmtMoney(n, digits = 2) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(digits)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(digits)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}k`;
  return `${sign}$${abs.toFixed(0)}`;
}

/** Cash-change display. Percent is suppressed when the prior base is too small to mean anything. */
export function fmtCashChange(delta, priorCash, pct) {
  if (delta === null || delta === undefined) return "Prior period unavailable";
  const sign = delta >= 0 ? "+" : "-";
  const dollars = `${sign}${fmtMoney(Math.abs(delta), 1)}`;
  const baseTooSmall = priorCash !== null && priorCash !== undefined && Math.abs(priorCash) < 1e6;
  if (baseTooSmall || pct === null || pct === undefined || Math.abs(pct) > 1000) {
    return `${dollars} (n/m: prior cash ${fmtMoney(priorCash, 1)})`;
  }
  return `${pct >= 0 ? "+" : ""}${pct}% (${dollars})`;
}

export function runwayLabel(months) {
  if (months === null || months === undefined) return "Not computable";
  if (months > 36) return ">36 months";
  return `${months} ${months === 1 ? "month" : "months"}`;
}

// ---------------------------------------------------------------------------
// Metrics + urgency
// ---------------------------------------------------------------------------

const REIT_OR_BANK = /real estate investment trust|commercial banks|savings institution|national commercial banks/i;

export function balanceSheetType({ currentAssets, currentLiabilities, sector }) {
  if (currentAssets !== null && currentAssets !== undefined && currentLiabilities !== null && currentLiabilities !== undefined) return "classified";
  return REIT_OR_BANK.test(sector || "") ? "unclassified" : "not_tagged";
}

/**
 * Tier rules. Runway drives the tier. A Form 8-K Item 3.01 filing is a separate listing
 * flag; it never overrides runway.
 *   critical : runway <= 3 months, or WC deficit > $20M with runway <= 6 months
 *   urgent   : runway <= 6 months, or WC deficit > $5M with runway <= 12 months
 *   moderate : runway <= 12 months
 *   stable   : runway > 12 months, or operating cash flow positive
 *   unrated  : no usable cash/cash-flow data, stale data, or unverified entity
 */
export function classifyUrgency(m) {
  const fmt = (n) => fmtMoney(n, 1);
  if (m.entityNeedsReview) {
    return { tier: "unrated", rationale: "UNRATED: company-to-SEC-entity match failed validation; no financials are shown until the CIK is confirmed." };
  }
  if (m.freshness?.status === "expired") {
    return {
      tier: "unrated",
      rationale: `UNRATED: latest usable period (${m.asOfDate}) is ${m.freshness.ageDays} days old (limit ${Math.round(m.freshness.thresholdDays * FRESHNESS.expiredMultiple)}). Refresh before relying on it.`
    };
  }
  if (m.cash === null || m.cash === undefined) {
    return { tier: "unrated", rationale: "UNRATED: no cash balance tagged in XBRL for the latest filing." };
  }
  if (m.ocf === null || m.ocf === undefined) {
    return { tier: "unrated", rationale: "UNRATED: operating cash flow not tagged in XBRL, so runway cannot be computed." };
  }
  if (m.ocf >= 0) {
    return { tier: "stable", rationale: "STABLE: operating cash flow was positive in the latest reported period." };
  }
  const runway = m.runwayMonths;
  let tier = runway <= 3 ? "critical" : runway <= 6 ? "urgent" : runway <= 12 ? "moderate" : "stable";
  let rationale = `${runway <= 12 ? "" : ""}Runway ${runwayLabel(runway)} (${fmt(m.liquidity)} liquidity ÷ ${fmt(m.monthlyBurn)}/mo burn).`;
  if (m.negativeWc && m.wcDeficit > 20e6 && runway <= 6 && tier !== "critical") {
    tier = "critical";
    rationale += ` Working capital deficit of ${fmt(m.wcDeficit)} with runway under 6 months.`;
  } else if (m.negativeWc && m.wcDeficit > 5e6 && runway <= 12 && (tier === "moderate" || tier === "stable")) {
    tier = "urgent";
    rationale += ` Working capital deficit of ${fmt(m.wcDeficit)} with runway under 12 months.`;
  }
  const label = tier.toUpperCase();
  if (m.freshness?.status === "stale") rationale += ` Data is ${m.freshness.ageDays} days old (stale).`;
  return { tier, rationale: `${label}: ${rationale}` };
}

/**
 * Build the financialMetrics fields from raw inputs. Used by ingest (live XBRL) and by the
 * repair script (stored values), so both produce identical results.
 */
export function finalizeMetrics(i, now = new Date()) {
  const caveats = [...(i.caveats || [])];
  const sti = i.shortTermInvestments ?? null;
  const cash = i.cash ?? null;
  const liquidity = cash === null ? null : cash + (sti || 0);

  const hasWc = i.currentAssets !== null && i.currentAssets !== undefined && i.currentLiabilities !== null && i.currentLiabilities !== undefined;
  const workingCapital = hasWc ? i.currentAssets - i.currentLiabilities : null;
  const negativeWc = workingCapital !== null && workingCapital < 0;
  const wcDeficit = negativeWc ? Math.abs(workingCapital) : 0;
  const currentRatio = hasWc && i.currentLiabilities > 0 ? Number((i.currentAssets / i.currentLiabilities).toFixed(2)) : null;
  const bsType = balanceSheetType(i);

  // Burn: YTD cash flow divided by the real number of months it covers.
  let monthlyBurn = 0;
  let runwayMonths = null;
  if (i.ocf !== null && i.ocf !== undefined && i.ocf < 0 && i.ocfMonths) {
    monthlyBurn = Math.round((Math.abs(i.ocf) + (i.capex || 0)) / i.ocfMonths);
    if (monthlyBurn > 0 && liquidity !== null) runwayMonths = Math.max(1, Math.round(liquidity / monthlyBurn));
  }
  if (i.ocfMonthsInferred) caveats.push(`Cash-flow period inferred as ${i.ocfMonths} months from the period-end date (assumes a calendar fiscal year). Re-run ingest for exact XBRL durations.`);
  if (hasWc && cash !== null && i.currentAssets - cash > 10 * Math.max(cash, 1) && i.currentAssets - cash > 20e6) {
    caveats.push("Large non-cash current assets (investments, digital assets, receivables, inventory) are not counted in runway; verify liquidity in the filing.");
  }

  const freshness = freshnessFor(i.asOfDate, i.filingForm, now);
  const { tier, rationale } = classifyUrgency({
    entityNeedsReview: i.entityNeedsReview,
    freshness,
    asOfDate: i.asOfDate,
    cash,
    ocf: i.ocf,
    runwayMonths,
    liquidity,
    monthlyBurn,
    negativeWc,
    wcDeficit
  });

  let runwayDisplay;
  if (tier === "unrated") runwayDisplay = "Not rated";
  else if (i.ocf !== null && i.ocf !== undefined && i.ocf >= 0) runwayDisplay = "Cash-flow positive";
  else runwayDisplay = runwayLabel(runwayMonths);

  const changeInCash12M = cash !== null && i.priorCash !== null && i.priorCash !== undefined ? cash - i.priorCash : null;
  const changeInCashPct =
    changeInCash12M !== null && i.priorCash > 0 ? Math.round((changeInCash12M / i.priorCash) * 100) : null;

  const methodology =
    cash === null
      ? `No cash balance tagged in XBRL for Form ${i.filingForm || "n/a"}.`
      : `Runway = ${fmtMoney(liquidity)} liquidity${sti ? ` (${fmtMoney(cash)} cash + ${fmtMoney(sti)} short-term investments)` : " (cash only)"} ÷ ${fmtMoney(monthlyBurn)}/mo burn, where burn = (|operating cash flow| + capex) ÷ ${i.ocfMonths ?? "?"} months covered by the filing. Form ${i.filingForm} for period ended ${i.asOfDate} (Accn ${i.accessionNumber}).`;

  return {
    cashOnHand: cash,
    cashOnHandDisplay: cash !== null ? fmtMoney(cash) : "Not disclosed in XBRL",
    shortTermInvestments: sti,
    asOfDate: i.asOfDate,
    filingForm: i.filingForm,
    accessionNumber: i.accessionNumber,
    changeInCash12M,
    changeInCashPct,
    changeInCashDisplay: fmtCashChange(changeInCash12M, i.priorCash ?? null, changeInCashPct),
    currentAssets: i.currentAssets ?? null,
    currentLiabilities: i.currentLiabilities ?? null,
    workingCapital,
    workingCapitalDisplay:
      bsType === "unclassified"
        ? "Unclassified balance sheet (REIT / bank)"
        : bsType === "not_tagged"
          ? "Current assets/liabilities not tagged"
          : negativeWc
            ? `-${fmtMoney(wcDeficit)} (DEFICIT)`
            : `+${fmtMoney(workingCapital)} (SURPLUS)`,
    isNegativeWorkingCapital: negativeWc,
    workingCapitalDeficit: wcDeficit,
    currentRatio,
    currentRatioDisplay: currentRatio !== null ? `${currentRatio}x` : "N/A",
    isUnclassifiedBalanceSheet: bsType === "unclassified",
    balanceSheetType: bsType,
    isCommercialRevenue: i.annualizedRevenue != null ? i.annualizedRevenue > 5e6 : Boolean(i.isCommercialRevenue),
    operatingCashFlow: i.ocf ?? null,
    operatingCashFlowMonths: i.ocfMonths ?? null,
    monthlyBurnRate: monthlyBurn,
    runwayMonths: runwayMonths === null ? (i.ocf >= 0 ? 99 : 0) : runwayMonths,
    runwayDisplay,
    capitalNeedUrgency: tier,
    urgencyRationale: rationale,
    calculationMethodology: methodology,
    freshness,
    dataCaveats: caveats
  };
}

// ---------------------------------------------------------------------------
// Registration statements (no invented dollar figures)
// ---------------------------------------------------------------------------

export const SHELF_FORMS = ["S-3", "S-3ASR", "F-3", "F-3ASR"];
export const PROSPECTUS_SUPPLEMENT_FORMS = ["424B5"];

export function summarizeRegistrations(filings, item302Recent, now = new Date(), windowDays = 730) {
  const recent = (filings || []).filter((f) => now.getTime() - Date.parse(`${f.filingDate}T00:00:00Z`) <= windowDays * DAY_MS);
  const shelves = recent.filter((f) => SHELF_FORMS.includes(f.form)).length;
  const supplements = recent.filter((f) => PROSPECTUS_SUPPLEMENT_FORMS.includes(f.form)).length;
  const s1 = recent.filter((f) => f.form === "S-1" || f.form === "F-1").length;
  let risk;
  if (shelves + supplements + s1 === 0) risk = "Low";
  else if (shelves >= 1 && supplements >= 3) risk = "Severe";
  else if (shelves >= 1 && supplements >= 1 && item302Recent) risk = "Severe";
  else if (shelves >= 1 && supplements >= 1) risk = "High";
  else if (shelves >= 1 || supplements >= 1) risk = "Moderate";
  else risk = "Moderate";
  return { recent, shelves, supplements, s1Offerings: s1, dilutionRisk: risk };
}

// ---------------------------------------------------------------------------
// Contacts
// ---------------------------------------------------------------------------

export const NOT_SOURCED = "Not yet sourced";

export function isPlaceholderName(name) {
  return (
    !name ||
    /executive office|corporate secretariat|^chief (executive|financial) officer$|^securities & corporate counsel$|^outside (securities )?counsel$|^not yet sourced$/i.test(
      name.trim()
    )
  );
}

const NAME_SUFFIXES = new Set(["jr", "jr.", "sr", "sr.", "ii", "iii", "iv", "md", "m.d.", "phd", "ph.d."]);

/** SEC Form 4 owner names are "LAST FIRST MIDDLE [SUFFIX]". */
export function formatForm4Name(raw) {
  const parts = String(raw || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return raw ? titleCase(raw) : "";
  const suffix = [];
  while (parts.length > 2 && NAME_SUFFIXES.has(parts[parts.length - 1].toLowerCase())) suffix.unshift(parts.pop());
  const [last, ...rest] = parts;
  return [...rest.map(titleCase), titleCase(last), ...suffix.map((s) => (s.length <= 3 ? s.toUpperCase().replace(/^J/, "J").replace(/^S/, "S") : titleCase(s)))].join(" ").replace(/\s+/g, " ");
}

function titleCase(s) {
  return s
    .toLowerCase()
    .replace(/(^|[\s'-])([a-z])/g, (_, p, c) => p + c.toUpperCase())
    .replace(/^Mc([a-z])/, (_, c) => `Mc${c.toUpperCase()}`);
}

export function parseForm4Xml(xml) {
  const pick = (re) => {
    const m = re.exec(xml || "");
    return m ? m[1].trim() : "";
  };
  const name = pick(/<rptOwnerName>([^<]+)<\/rptOwnerName>/i);
  const title = pick(/<officerTitle>([^<]+)<\/officerTitle>/i);
  const isOfficer = /<isOfficer>\s*(1|true)\s*<\/isOfficer>/i.test(xml || "");
  return { name: name ? formatForm4Name(name) : "", rawName: name, officerTitle: title, isOfficer };
}

export function classifyOfficerTitle(title) {
  const t = String(title || "").toLowerCase();
  if (/chief executive|\bceo\b|principal executive/.test(t)) return "ceo";
  if (/chief financial|\bcfo\b|principal financial|principal accounting/.test(t)) return "cfo";
  return null;
}

/** Contacts with no invented names. Anything unsourced says so. */
export function buildContacts({ targetId, officialName, phone, officers = {}, curated, secDescriptor }) {
  const mk = (role, rec, defaultTitle, roleSummary, score) => {
    const sourced = rec && !isPlaceholderName(rec.name);
    return {
      id: `c-${targetId}-${role}`,
      name: sourced ? rec.name : NOT_SOURCED,
      title: sourced ? rec.title || defaultTitle : defaultTitle,
      entity: officialName,
      email: NOT_SOURCED,
      phone: phone || NOT_SOURCED,
      roleSummary,
      receptivityScore: score,
      source: sourced ? rec.source : "No officer found in SEC filings or curated list"
    };
  };
  const curatedRec = (key, titleKey) =>
    curated && curated[key]
      ? { name: curated[key], title: curated[titleKey], source: "Curated list (not machine-verified); confirm against the latest proxy or 8-K" }
      : null;

  const ceo = officers.ceo || curatedRec("ceo", "ceoTitle");
  const cfo = officers.cfo || curatedRec("cfo", "cfoTitle");
  const counselName = curated?.outsideCounsel;
  const contacts = [
    mk("ceo", ceo, "Chief Executive Officer", "Executive with oversight of capital formation and investor relations.", "very_high"),
    mk("cfo", cfo, "Chief Financial Officer", "Officer responsible for liquidity, credit facilities and SEC periodic filings.", "high")
  ];
  contacts.push({
    id: `c-${targetId}-counsel`,
    name: counselName && !isPlaceholderName(counselName) ? counselName : NOT_SOURCED,
    title: "Outside securities counsel",
    entity: "Legal counsel",
    email: NOT_SOURCED,
    phone: NOT_SOURCED,
    firm: counselName && !isPlaceholderName(counselName) ? counselName : undefined,
    roleSummary: "Counsel advising on registration statements, ATM facilities and compliance.",
    receptivityScore: "high",
    source: counselName && !isPlaceholderName(counselName) ? "Curated list (not machine-verified)" : secDescriptor || "Not found in SEC filings"
  });
  return contacts;
}

// ---------------------------------------------------------------------------
// Outreach drafts (never quote numbers we do not trust)
// ---------------------------------------------------------------------------

const SIGNATURE = "Sincerely,\nEric Miller\nManaging Principal\nricomiller@gmail.com • (480) 287-2227";

export function buildOutreach(t, now = new Date()) {
  const m = t.financialMetrics;
  const ceo = t.contacts.find((c) => c.id.includes("ceo"));
  const greeting = ceo && !isPlaceholderName(ceo.name) ? `Dear ${ceo.name},` : `Dear ${t.name} Management Team,`;
  const trusted = t.secStatus === "sec_verified_filer" && m.cashOnHand !== null && ["current", "stale"].includes(m.freshness?.status);

  let filingLine = "";
  if (trusted) {
    filingLine = `Your latest SEC Form ${m.filingForm} (period ended ${m.asOfDate}, accession ${m.accessionNumber}) shows ${m.cashOnHandDisplay} in cash${m.isNegativeWorkingCapital ? ` against a ${fmtMoney(m.workingCapitalDeficit)} working capital deficit` : ""}.`;
  }
  const sig = (t.signals8K || [])[0];
  const sigLine = sig ? `We also noted your recent Form 8-K (${sig.item}: ${sig.title}, filed ${sig.date}).` : "";
  const intro = `I am contacting you regarding ${t.name} (${t.ticker}) and your participation in the Maxim Growth Conference.`;
  const pitch =
    "We provide structured, non-dilutive balance sheet solutions, including asset-backed bridge liquidity, senior debt optimization and consensual recapitalization, as an alternative to continued shelf or ATM issuance.";
  const ask = "Would 15 minutes this week work for a confidential conversation under a standard NDA?";

  const mgmtBody = [greeting, intro, filingLine, sigLine, pitch, ask, SIGNATURE].filter(Boolean).join("\n\n");
  const legalBody = [
    "Dear Counsel,",
    `I am contacting you regarding ${t.name} (${t.ticker}).`,
    trusted
      ? `Recent SEC periodic disclosures (Form ${m.filingForm}, period ended ${m.asOfDate}, accession ${m.accessionNumber}) indicate runway of ${m.runwayDisplay}${m.isNegativeWorkingCapital ? ` with a ${fmtMoney(m.workingCapitalDeficit)} working capital deficit` : ""}.`
      : "",
    sigLine,
    "We structure consensual debt and non-dilutive liquidity facilities that help boards manage continuous shelf dilution.",
    "Respectfully,\nEric Miller\nManaging Principal\nricomiller@gmail.com • (480) 287-2227"
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    managementSubject: `CONFIDENTIAL: ${t.name} (${t.ticker}): Non-Dilutive Liquidity Alternatives`,
    managementBody: mgmtBody,
    legalSubject: `CONFIDENTIAL / FOR COUNSEL: ${t.name} (${t.ticker}): Balance Sheet Alternatives`,
    legalBody
  };
}

// ---------------------------------------------------------------------------
// Dataset metadata
// ---------------------------------------------------------------------------

export function summarizeDataset(targets, previous = {}) {
  const count = (fn) => targets.filter(fn).length;
  const tier = (name) => count((t) => t.financialMetrics.capitalNeedUrgency === name);
  const unrated = targets.filter((t) => t.financialMetrics.capitalNeedUrgency === "unrated");
  const reason = (t) => {
    if (t.secStatus === "bankrupt_defunct") return "defunct";
    if (t.secStatus === "sec_exempt_fund") return "fund";
    if (t.secStatus === "non_sec_foreign_or_private") return "foreign";
    if (t.entityMatch === "needs_review") return "entity_review";
    if (t.financialMetrics.freshness?.status === "expired") return "expired_data";
    return "no_xbrl_data";
  };
  const unratedReasons = {};
  for (const t of unrated) unratedReasons[reason(t)] = (unratedReasons[reason(t)] || 0) + 1;
  return {
    ...previous,
    totalTargets: targets.length,
    secFilersCount: count((t) => t.secStatus === "sec_verified_filer"),
    foreignAndExemptCount: count((t) => t.secStatus !== "sec_verified_filer"),
    criticalCount: tier("critical"),
    urgentCount: tier("urgent"),
    moderateCount: tier("moderate"),
    stableCount: tier("stable"),
    unratedCount: unrated.length,
    unratedReasons,
    staleCount: count((t) => t.financialMetrics.freshness?.status === "stale"),
    negativeWorkingCapitalCount: count((t) => t.financialMetrics.isNegativeWorkingCapital),
    totalNegativeWorkingCapitalDeficit: targets.reduce((a, t) => a + (t.financialMetrics.workingCapitalDeficit || 0), 0),
    totalFinancingPast2Y: targets.reduce((a, t) => a + (t.financingHistory2Y.totalRaised || 0), 0),
    listingNoticeCount: count((t) => (t.signals8K || []).some((s) => s.item === "Item 3.01")),
    panelistCount: count((t) => t.isPanelist)
  };
}
