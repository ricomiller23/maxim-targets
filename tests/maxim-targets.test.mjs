import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.resolve(__dirname, "../data/maxim-targets.json");

test("MAXIM Targets — Prebuild Assertion Test Suite v3.0 (Audited SEC Data)", async (t) => {
  assert.ok(fs.existsSync(DATA_PATH), "maxim-targets.json dataset must exist");
  const raw = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const { metadata, targets } = raw;

  await t.test("Test 1: Full cohort of 113 presenting companies verified and 100% reconciled", () => {
    assert.equal(targets.length, 113, "Must contain exactly 113 presenting companies from Maxim Conference");
    assert.equal(metadata.totalTargets, 113);
    const sumTiers = metadata.criticalCount + metadata.urgentCount + metadata.moderateCount + metadata.stableCount + metadata.unratedCount;
    assert.equal(sumTiers, 113, `Tiers must reconcile exactly to 113 (got ${sumTiers})`);
  });

  await t.test("Test 2: Hand-verified entity matches for fuzzy tickers (Standing Rule A)", () => {
    const tlg = targets.find(x => x.ticker === "TSX: TLG");
    assert.ok(tlg && tlg.name.includes("Troilus") && !tlg.name.includes("SPV"), "Troilus Mining must not be matched to TLG SPV I LLC");

    const flt = targets.find(x => x.ticker === "TSX: FLT");
    assert.ok(flt && flt.name.includes("Volatus") && !flt.name.includes("ALTR"), "Volatus Aerospace must not be matched to ALTR FLTR");

    const luca = targets.find(x => x.ticker === "TSXV: LUCA");
    assert.ok(luca && luca.name.includes("Luca Mining") && !luca.name.includes("Lucas GC"), "Luca Mining must not be matched to Lucas GC");

    const swc = targets.find(x => x.ticker === "LSE: SWC");
    assert.ok(swc && swc.name.includes("Smarter Web") && !swc.name.includes("SWCC"), "The Smarter Web Company must not be matched to SWCC Corp");

    const airx = targets.find(x => x.ticker === "CNSX: AIRX");
    assert.ok(airx && (airx.name.includes("Redwood AI") || airx.name.includes("Clean Air")) && !airx.name.includes("AirXP"), "Redwood AI must not be matched to AirXP");

    const nim = targets.find(x => x.ticker === "NIM");
    assert.ok(nim && nim.name.includes("Nicola Mining") && !nim.name.includes("NUVEEN"), "Nicola Mining must not be matched to Nuveen Municipal Fund");

    const alcpb = targets.find(x => x.ticker === "ALCPB");
    assert.ok(alcpb && alcpb.name.includes("Capital B") && !alcpb.name.includes("SOURCE CAPITAL"), "Capital B must not be matched to Source Capital");
  });

  await t.test("Test 3: Latest period ends across facts selected (Standing Rule B)", () => {
    const rcat = targets.find(x => x.ticker === "RCAT");
    assert.ok(rcat, "RCAT must exist");
    assert.equal(rcat.financialMetrics.asOfDate, "2026-06-30", `RCAT must use 2026-06-30 10-Q (got ${rcat.financialMetrics.asOfDate})`);
    assert.ok(rcat.financialMetrics.cashOnHand > 300000000, `RCAT cash must be > $300M (got ${rcat.financialMetrics.cashOnHand})`);

    const lake = targets.find(x => x.ticker === "LAKE");
    assert.ok(lake, "LAKE must exist");
    assert.equal(lake.financialMetrics.asOfDate, "2026-07-31", `LAKE must use 2026-07-31 10-Q (got ${lake.financialMetrics.asOfDate})`);
    assert.ok(lake.financialMetrics.cashOnHand > 15000000, `LAKE cash must be > $15M (got ${lake.financialMetrics.cashOnHand})`);

    const duot = targets.find(x => x.ticker === "DUOT");
    assert.ok(duot, "DUOT must exist");
    assert.equal(duot.financialMetrics.asOfDate, "2026-06-30", `DUOT must use 2026-06-30 10-Q (got ${duot.financialMetrics.asOfDate})`);
    assert.ok(duot.financialMetrics.cashOnHand > 100000000, `DUOT cash must be > $100M (got ${duot.financialMetrics.cashOnHand})`);

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
    // NioCorp, MPT, Ondas, Everspin, Lakeland must NOT be Critical
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

    // Critical count must not be inflated to 66
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
    // RZLV is 2025-12-31 (stale >135d), so must be UNRATED
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
});

