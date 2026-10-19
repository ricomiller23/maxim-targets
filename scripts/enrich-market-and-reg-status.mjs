import fs from "fs";
import path from "path";

const targetsPath = path.resolve("data/maxim-targets.json");
const storePath = path.resolve("data/maxim-store.json");

const raw = fs.readFileSync(targetsPath, "utf8");
const data = JSON.parse(raw);
const targets = data.targets;

const SYMBOL_MAP = {
  "BRBM": "BCHT",           // Birchtech Corp ticker updated to BCHT on NYSE American
  "TSXV: CDPR": "CDPR.V",   // Cerro de Pasco Resources Inc (TSXV)
  "CSNX: PHOS": "PHOS.CN",  // First Phosphate Corp (CSE)
  "CNSX: AIRX": "AIRX.CN",  // Redwood AI / Clean Air Metals Inc (CSE)
  "TSX: TLG": "TLG.TO",     // Troilus Mining Corp (TSX)
  "TSX: FLT": "FLT.TO",     // Volatus Aerospace Corp (TSX)
  "TSXV: LUCA": "LUCA.V",   // Luca Mining Corp (TSXV)
  "LSE: SWC": "SWC.L",      // The Smarter Web Company Plc (LSE)
  "ALCPB": "ALCPB.PA",      // Capital B (Euronext Paris)
  "NIM": "NIM.V",           // Nicola Mining Inc (TSXV)
  "BMM": "BMM.V",           // Blue Moon Metals Inc (TSXV)
  "SCZ": "SCZ.V",           // Santacruz Silver Mining Ltd (TSXV)
  "SVRS": "SVRS.V",         // Silver Storm Mining Ltd (TSXV)
  "TII": "TI.TO",           // Titan Mining Corp (TSX)
};

const REG_FORMS = ["S-1", "S-3", "S-8", "F-1", "F-3"];

function formatVolumeDisplay(vol) {
  if (vol === null || vol === undefined) return "N/A";
  if (vol >= 1e9) return `${(vol / 1e9).toFixed(1)}B/mo`;
  if (vol >= 1e6) return `${(vol / 1e6).toFixed(1)}M/mo`;
  if (vol >= 1e3) return `${(vol / 1e3).toFixed(1)}K/mo`;
  return `${vol}/mo`;
}

function formatPriceDisplay(price, currency = "USD") {
  if (price === null || price === undefined) return "N/A";
  const numStr = price < 1 ? price.toFixed(3) : price.toFixed(2);
  switch (currency.toUpperCase()) {
    case "CAD":
      return `C$${numStr}`;
    case "EUR":
      return `€${numStr}`;
    case "GBP":
    case "GBP":
      return `£${numStr}`;
    case "GBP":
    case "GBp":
      return `${(price).toFixed(1)}p`;
    default:
      return `$${numStr}`;
  }
}

async function fetchQuote(target) {
  const ticker = target.ticker;

  // Handle known special cases truthfully
  if (ticker === "BBBY") {
    return {
      price: null,
      priceDisplay: "Defunct (Ch. 11)",
      currency: "USD",
      avgDailyVolume: null,
      avgMonthlyVolume: null,
      avgMonthlyVolumeDisplay: "Defunct",
      asOfDate: "2026-10-15",
      sourceUrl: "https://www.sec.gov/edgar/browse/?CIK=0000886158"
    };
  }

  if (ticker === "CNDR") {
    return {
      price: null,
      priceDisplay: "Pre-IPO (Reg CF)",
      currency: "USD",
      avgDailyVolume: null,
      avgMonthlyVolume: null,
      avgMonthlyVolumeDisplay: "Pre-IPO",
      asOfDate: "2026-10-15",
      sourceUrl: "https://www.sec.gov/edgar/browse/?CIK=0001569744"
    };
  }

  const symbol = SYMBOL_MAP[ticker] || ticker;
  const quoteUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1mo`;
  
  try {
    const res = await fetch(quoteUrl, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const json = await res.json();
    const meta = json.chart?.result?.[0]?.meta;
    if (!meta || meta.regularMarketPrice === undefined) {
      throw new Error("Missing price in meta");
    }

    const price = meta.regularMarketPrice;
    const currency = meta.currency || "USD";
    const indicators = json.chart?.result?.[0]?.indicators?.quote?.[0];
    const vols = indicators?.volume?.filter(v => v !== null && v !== undefined) || [];
    const avgDaily = vols.length > 0 ? vols.reduce((a, b) => a + b, 0) / vols.length : (meta.regularMarketVolume || 0);
    const avgMonthly = Math.round(avgDaily * 21); // standard 21 trading days/mo
    const asOfTimestamp = meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

    return {
      price: price,
      priceDisplay: formatPriceDisplay(price, currency),
      currency: currency,
      avgDailyVolume: Math.round(avgDaily),
      avgMonthlyVolume: avgMonthly,
      avgMonthlyVolumeDisplay: formatVolumeDisplay(avgMonthly),
      asOfDate: asOfTimestamp,
      sourceUrl: `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}`
    };
  } catch (err) {
    console.warn(`[WARN] Failed to fetch quote for ${ticker} (${symbol}): ${err.message}`);
    return {
      price: null,
      priceDisplay: "Not yet sourced",
      currency: "USD",
      avgDailyVolume: null,
      avgMonthlyVolume: null,
      avgMonthlyVolumeDisplay: "Not yet sourced",
      asOfDate: new Date().toISOString().slice(0, 10),
      sourceUrl: target.secEdgarUrl || `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}`
    };
  }
}

async function run() {
  console.log(`Enriching ${targets.length} targets with verified Market Data & 24M Reg Statement Status...`);

  let noRegCount = 0;
  const enrichedTargets = [];

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    const market = await fetchQuote(t);

    // Compute Registration Statement 24M status truthfully
    const r = t.registrationStatements2Y || {};
    const filings = r.filings || [];

    // Find all qualifying reg statements in filings
    const regFilings24M = filings.filter(f => {
      const base = f.form.toUpperCase().replace(/\/A$/, "").replace(/ASR$/, "");
      return REG_FORMS.includes(base);
    });

    const formsFound = new Set(regFilings24M.map(f => f.form));
    
    // Check if universal shelf or initial reg counts exist
    const hasUniversal = (r.universalShelvesFiled || r.activeShelvesFiled || 0) > 0;
    const hasInitial = (r.initialRegistrationsCount || 0) > 0;

    if (hasUniversal) formsFound.add("S-3/F-3 Shelf");
    if (hasInitial) formsFound.add("S-1/F-1 Initial");

    const totalRegCount = regFilings24M.length + (hasUniversal ? (r.universalShelvesFiled || r.activeShelvesFiled) : 0) + (hasInitial ? r.initialRegistrationsCount : 0);
    const hasActiveReg = totalRegCount > 0;
    const noActiveReg = !hasActiveReg;

    if (noActiveReg) {
      noRegCount++;
    }

    const regFormsList = Array.from(formsFound);

    const enriched = {
      ...t,
      marketData: market,
      noActiveRegStatements24M: noActiveReg,
      hasActiveRegStatements24M: hasActiveReg,
      regStatementsCount24M: totalRegCount,
      regStatementForms24M: regFormsList
    };

    enrichedTargets.push(enriched);
    process.stdout.write(`\rEnriched ${i + 1}/${targets.length}: ${t.ticker.padEnd(10)} Price: ${market.priceDisplay.padEnd(12)} Vol: ${market.avgMonthlyVolumeDisplay.padEnd(10)} NoReg: ${noActiveReg ? "YES" : "NO"}`);

    // Rate-limit pause
    await new Promise(res => setTimeout(res, 60));
  }

  console.log(`\n\nEnrichment Complete:`);
  console.log(`- Total Targets: ${enrichedTargets.length}`);
  console.log(`- Targets with NO Active Reg Statements (24M): ${noRegCount}`);
  console.log(`- Targets with Active Reg Statements (24M): ${enrichedTargets.length - noRegCount}`);
  console.log(`- Sourced Market Quotes: ${enrichedTargets.filter(t => t.marketData.price !== null).length}`);

  const updatedMetadata = {
    ...data.metadata,
    noActiveRegStatementsCount: noRegCount,
    lastMarketDataRefresh: new Date().toISOString()
  };

  const outputPayload = {
    metadata: updatedMetadata,
    targets: enrichedTargets
  };

  fs.writeFileSync(targetsPath, JSON.stringify(outputPayload, null, 2), "utf8");
  fs.writeFileSync(storePath, JSON.stringify(outputPayload, null, 2), "utf8");
  console.log(`Successfully updated ${targetsPath} and ${storePath}!`);
}

run().catch(console.error);
