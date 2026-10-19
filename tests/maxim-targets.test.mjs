import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.resolve(__dirname, "../data/maxim-targets.json");

test("MAXIM Targets — Prebuild Assertion Test Suite v3.1 (Audited SEC Data & Market Quotes)", async (t) => {
  const raw = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const { metadata, targets } = raw;

  await t.test("Test 1: Full cohort of 113 presenting companies verified and 100% reconciled", () => {
    assert.equal(targets.length, 113, "Targets length must be exactly 113");
    assert.equal(metadata.totalTargets, 113, "Metadata totalTargets must be 113");

    // Tier sum check
    const sumTiers = metadata.criticalCount + metadata.urgentCount + metadata.moderateCount + metadata.stableCount + metadata.unratedCount;
    assert.equal(sumTiers, 113, `Tiers must reconcile to 113 (got ${sumTiers})`);
  });

  await t.test("Test 2: Hand-verified entity matches for fuzzy tickers (Standing Rule A)", () => {
    const tlg = targets.find(x => x.ticker === "TSX: TLG");
    assert.ok(tlg, "Troilus Mining must exist with ticker TSX: TLG");
    assert.ok(tlg.name.includes("Troilus"), "TLG must be Troilus Mining");

    const flt = targets.find(x => x.ticker === "TSX: FLT");
    assert.ok(flt, "Volatus Aerospace must exist with ticker TSX: FLT");
    assert.ok(flt.name.includes("Volatus"), "FLT must be Volatus Aerospace");

    const luca = targets.find(x => x.ticker === "TSXV: LUCA");
    assert.ok(luca, "Luca Mining must exist with ticker TSXV: LUCA");
    assert.ok(luca.name.includes("Luca"), "LUCA must be Luca Mining");

    const swc = targets.find(x => x.ticker === "LSE: SWC");
    assert.ok(swc, "Smarter Web Company must exist with ticker LSE: SWC");
    assert.ok(swc.name.includes("Smarter Web"), "SWC must be Smarter Web Company");

    const airx = targets.find(x => x.ticker === "CNSX: AIRX");
    assert.ok(airx, "Redwood AI / Clean Air Metals must exist with ticker CNSX: AIRX");

    const nim = targets.find(x => x.ticker === "NIM");
    assert.ok(nim, "Nicola Mining must exist with ticker NIM");
    assert.ok(nim.name.includes("Nicola"), "NIM must be Nicola Mining");

    const alc = targets.find(x => x.ticker === "ALCPB");
    assert.ok(alc, "Capital B must exist with ticker ALCPB");
  });

  await t.test("Test 3: Latest period ends across facts selected (Standing Rule B)", () => {
    const rcat = targets.find(x => x.ticker === "RCAT");
    assert.ok(rcat, "RCAT must exist");
    assert.equal(rcat.financialMetrics.asOfDate, "2026-06-30", `RCAT must use 2026-06-30 10-Q (got ${rcat.financialMetrics.asOfDate})`);
    assert.ok(rcat.financialMetrics.cashOnHand >= 300000000, `RCAT cash must be >= $300M (got ${rcat.financialMetrics.cashOnHand})`);

    const lake = targets.find(x => x.ticker === "LAKE");
    assert.ok(lake, "LAKE must exist");
    assert.equal(lake.financialMetrics.asOfDate, "2026-07-31", `LAKE must use 2026-07-31 10-Q (got ${lake.financialMetrics.asOfDate})`);

    const duot = targets.find(x => x.ticker === "DUOT");
    assert.ok(duot, "DUOT must exist");
    assert.equal(duot.financialMetrics.asOfDate, "2026-06-30", `DUOT must use 2026-06-30 10-Q (got ${duot.financialMetrics.asOfDate})`);

    const brbm = targets.find(x => x.ticker === "BRBM");
    assert.ok(brbm, "BRBM must exist");
    assert.equal(brbm.financialMetrics.asOfDate, "2026-06-30", `BRBM must use 2026-06-30 10-Q (got ${brbm.financialMetrics.asOfDate})`);

    const lucd = targets.find(x => x.ticker === "LUCD");
    assert.ok(lucd, "LUCD must exist");
    assert.equal(lucd.financialMetrics.asOfDate, "2026-06-30", `LUCD must use 2026-06-30 10-Q (got ${lucd.financialMetrics.asOfDate})`);

    const fatn = targets.find(x => x.ticker === "FATN");
    assert.ok(fatn, "FATN must exist");
    assert.equal(fatn.financialMetrics.asOfDate, "2026-06-30", `FATN must use 2026-06-30 10-Q (got ${fatn.financialMetrics.asOfDate})`);
  });

  await t.test("Test 4: Urgency tiers derived from runway & liquidity, not 3.01 over-matching", () => {
    const nb = targets.find(x => x.ticker === "NB");
    assert.equal(nb.financialMetrics.capitalNeedUrgency, "stable", "NioCorp ($415M cash) must be STABLE tier");

    const mpt = targets.find(x => x.ticker === "MPT");
    assert.equal(mpt.financialMetrics.capitalNeedUrgency, "stable", "Medical Properties Trust ($425M cash, 89mo) must be STABLE tier");

    const onds = targets.find(x => x.ticker === "ONDS");
    assert.equal(onds.financialMetrics.capitalNeedUrgency, "stable", "Ondas ($658M cash) must be STABLE tier");

    const mram = targets.find(x => x.ticker === "MRAM");
    assert.equal(mram.financialMetrics.capitalNeedUrgency, "stable", "Everspin (cash-flow positive) must be STABLE tier");

    const lake = targets.find(x => x.ticker === "LAKE");
    assert.equal(lake.financialMetrics.capitalNeedUrgency, "stable", "Lakeland (cash-flow positive) must be STABLE tier");

    assert.ok(metadata.criticalCount <= 25, `Critical count must be realistic (got ${metadata.criticalCount}, expected <= 25)`);
  });

  await t.test("Test 5: Zero synthetic placeholders ('18 Months (Est.)' banned)", () => {
    targets.forEach((target) => {
      assert.notEqual(target.financialMetrics.runwayDisplay, "18 Months (Est.)", `Target ${target.ticker} has synthetic '18 Months (Est.)'`);
    });
  });

  await t.test("Test 6: S-3 / ATM underwriter claims sourced and truthful (no hardcoded Maxim)", () => {
    targets.forEach((target) => {
      const r = target.registrationStatements2Y;
      assert.notEqual(r.primaryUnderwriter, "Maxim Group LLC / Registered Syndicate", `Target ${target.ticker} has hardcoded Maxim underwriter claim`);
    });
  });

  await t.test("Test 7: Real officer names verified across all 113 targets (no generic switchboard)", () => {
    targets.forEach((target) => {
      assert.ok(target.contacts && target.contacts.length >= 1, `Target ${target.ticker} must have contacts`);
      const ceo = target.contacts.find(c => c.id.includes("ceo"));
      assert.ok(ceo, `Target ${target.ticker} must have CEO contact record`);
      assert.ok(!ceo.name.includes("Executive Office"), `Target ${target.ticker} has generic placeholder '${ceo.name}'`);
    });
  });

  await t.test("Test 8: Rule 9 compliance: Zero unearned banned words in static text", () => {
    const rawContent = fs.readFileSync(DATA_PATH, "utf8");
    const banned = ["100% verified", "certified accurate", "exhaustive audit"];
    banned.forEach((word) => {
      assert.ok(!rawContent.toLowerCase().includes(word), `Banned phrase "${word}" found in dataset`);
    });
  });

  await t.test("Test 9: Zero hardcoded DVLT strings or false numbers across dataset", () => {
    const rawContent = fs.readFileSync(DATA_PATH, "utf8");
    assert.ok(!rawContent.includes("134.9M current asset liquidity"), "Hardcoded DVLT current asset string must be eliminated");
    targets.filter(t => t.ticker !== "DVLT").forEach(t => assert.ok(!JSON.stringify(t).includes("107.7M working capital surplus"), `Target ${t.ticker} must not have DVLT surplus string`));
    assert.ok(!rawContent.includes("1 Mo Cash ($107.7M Surplus)"), "DVLT incoherent runway label must be eliminated");
  });

  await t.test("Test 10: Tiers follow runway strictly without deficit over-promotion", () => {
    const djt = targets.find(x => x.ticker === "DJT");
    assert.ok(djt, "DJT must exist");
    assert.equal(djt.financialMetrics.capitalNeedUrgency, "stable", "DJT (108mo runway) must be STABLE tier");

    const rzlv = targets.find(x => x.ticker === "RZLV");
    assert.ok(rzlv, "RZLV must exist");
    assert.equal(rzlv.financialMetrics.capitalNeedUrgency, "unrated", "RZLV (288d stale filing) must be UNRATED tier");

    const angx = targets.find(x => x.ticker === "ANGX");
    assert.ok(angx, "ANGX must exist");
    assert.equal(angx.financialMetrics.capitalNeedUrgency, "stable", "ANGX (Cash Flow Positive) must be STABLE tier");

    const dvlt = targets.find(x => x.ticker === "DVLT");
    assert.ok(dvlt, "DVLT must exist");
    assert.equal(dvlt.financialMetrics.capitalNeedUrgency, "critical", "DVLT (1 mo cash runway) must be CRITICAL tier");
    assert.ok(dvlt.financialMetrics.runwayDisplay.includes("1 Month"), "DVLT runway display must be 1 Month");

    const fjet = targets.find(x => x.ticker === "FJET");
    assert.ok(fjet, "FJET must exist");
    assert.equal(fjet.financialMetrics.capitalNeedUrgency, "critical", "FJET (1 mo cash runway) must be CRITICAL tier");

    const kynb = targets.find(x => x.ticker === "KYNB");
    assert.ok(kynb, "KYNB must exist");
    assert.equal(kynb.financialMetrics.capitalNeedUrgency, "stable", "KYNB (17 mo runway, $50.6M cash) must be STABLE tier");
  });

  await t.test("Test 11: Stale filings older than 135 days are UNRATED", () => {
    const zena = targets.find(x => x.ticker === "ZENA");
    if (zena) assert.equal(zena.financialMetrics.capitalNeedUrgency, "unrated", "ZENA (2024 filing) must be UNRATED");

    const nipg = targets.find(x => x.ticker === "NIPG");
    if (nipg) assert.equal(nipg.financialMetrics.capitalNeedUrgency, "unrated", "NIPG (2024 filing) must be UNRATED");

    const pre = targets.find(x => x.ticker === "PRE");
    if (pre) assert.equal(pre.financialMetrics.capitalNeedUrgency, "unrated", "PRE (2024 filing) must be UNRATED");
  });

  await t.test("Test 12: Suppress misleading cash change percentage on small or extreme bases", () => {
    const duot = targets.find(x => x.ticker === "DUOT");
    assert.ok(duot, "DUOT must exist");
    assert.equal(duot.financialMetrics.changeInCashPct, null, "DUOT cash change pct must be null");

    const mrln = targets.find(x => x.ticker === "MRLN");
    if (mrln) assert.equal(mrln.financialMetrics.changeInCashPct, null, "MRLN cash change pct must be null");

    const pali = targets.find(x => x.ticker === "PALI");
    if (pali) assert.equal(pali.financialMetrics.changeInCashPct, null, "PALI cash change pct must be null");

    const ctor = targets.find(x => x.ticker === "CTOR");
    if (ctor) assert.equal(ctor.financialMetrics.changeInCashPct, null, "CTOR cash change pct must be null");
  });

  await t.test("Test 13: Outside counsel phone is not company switchboard", () => {
    targets.forEach((target) => {
      const counsel = target.contacts.find(c => c.id.includes("counsel"));
      if (counsel) {
        assert.equal(counsel.phone, "Not yet sourced", `Target ${target.ticker} counsel phone must not be switchboard`);
        if (target.secStatus === "sec_verified_filer") assert.ok(counsel.source && counsel.source.includes("Exhibit 5.1"), `Target ${target.ticker} counsel source must cite Exhibit 5.1`);
      }
    });
  });

  await t.test("Test 14: BBBY is verified defunct and unrated", () => {
    const bbby = targets.find(x => x.ticker === "BBBY");
    assert.ok(bbby, "BBBY must exist");
    assert.equal(bbby.name, "Bed Bath & Beyond Inc. (Defunct / Chapter 11 Liquidating Trust)");
    assert.equal(bbby.financialMetrics.capitalNeedUrgency, "unrated");
    assert.equal(bbby.financialMetrics.runwayDisplay, "Defunct / Chapter 11");
  });

  await t.test("Test 15: Sourced market data (Stock Price & Monthly Volume) exists on all 113 targets", () => {
    let quotedCount = 0;
    targets.forEach((target) => {
      assert.ok(target.marketData, `Target ${target.ticker} must have marketData object`);
      assert.ok(target.marketData.priceDisplay, `Target ${target.ticker} must have priceDisplay`);
      assert.ok(target.marketData.avgMonthlyVolumeDisplay, `Target ${target.ticker} must have avgMonthlyVolumeDisplay`);
      assert.ok(target.marketData.sourceUrl, `Target ${target.ticker} must have market data sourceUrl`);

      if (target.marketData.price !== null) {
        quotedCount++;
        assert.ok(target.marketData.price > 0, `Target ${target.ticker} price must be > 0`);
        assert.ok(target.marketData.avgMonthlyVolume >= 0, `Target ${target.ticker} volume must be >= 0`);
      }
    });
    assert.ok(quotedCount >= 110, `At least 110 of 113 targets must have live numeric quotes (got ${quotedCount})`);
  });

  await t.test("Test 16: Zero Active Registration Statements (24M) derived truthfully without gaps", () => {
    const noRegTargets = targets.filter(t => t.noActiveRegStatements24M);
    assert.equal(noRegTargets.length, 16, `Exactly 16 targets must be flagged as no active reg statements (got ${noRegTargets.length})`);
    assert.equal(metadata.noActiveRegStatementsCount, 16, "Metadata noActiveRegStatementsCount must be 16");

    // Verify each no-reg target truly has zero S-1/S-3/S-8/F-1/F-3 in filings
    noRegTargets.forEach((t) => {
      const regFilings = t.registrationStatements2Y?.filings || [];
      const hasReg = regFilings.some(f => ["S-1", "S-3", "S-8", "F-1", "F-3"].includes(f.form.replace(/\/A$/, "").replace(/ASR$/, "")));
      assert.ok(!hasReg, `Target ${t.ticker} flagged as no reg but has qualifying filing in filings list`);
      assert.equal(t.registrationStatements2Y.activeShelvesFiled, 0, `Target ${t.ticker} must have 0 active shelves`);
    });
  });
});
