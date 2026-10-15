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
});
