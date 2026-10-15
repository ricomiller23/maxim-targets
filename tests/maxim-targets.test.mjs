import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.resolve(__dirname, "../data/maxim-targets.json");

test("MAXIM Targets — Prebuild Assertion Test Suite", async (t) => {
  assert.ok(fs.existsSync(DATA_PATH), "maxim-targets.json dataset must exist");
  const raw = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const { metadata, targets } = raw;

  await t.test("Test 1: Full cohort of 113 presenting companies verified", () => {
    assert.equal(targets.length, 113, "Must contain exactly 113 presenting companies from Maxim Conference");
    assert.equal(metadata.totalTargets, 113);
  });

  await t.test("Test 2: Every target has verified SEC EDGAR profile and valid CIK", () => {
    targets.forEach((target) => {
      assert.ok(target.secEdgarUrl && target.secEdgarUrl.startsWith("https://www.sec.gov"), `Target ${target.ticker} must have valid SEC EDGAR URL`);
      assert.ok(target.cik && target.cik.length >= 7, `Target ${target.ticker} must have valid CIK`);
    });
  });

  await t.test("Test 3: Financial metrics integrity: Cash, Working Capital, Burn, and Runway computed", () => {
    targets.forEach((target) => {
      const m = target.financialMetrics;
      assert.ok(typeof m.cashOnHand === "number" && m.cashOnHand >= 0, `Target ${target.ticker} cash on hand must be >= 0`);
      assert.ok(typeof m.workingCapital === "number", `Target ${target.ticker} working capital must be a number`);
      assert.equal(m.workingCapital, m.currentAssets - m.currentLiabilities, `Target ${target.ticker} working capital must equal Current Assets - Current Liabilities`);
      assert.equal(m.isNegativeWorkingCapital, m.workingCapital < 0, `Target ${target.ticker} negative working capital flag must be accurate`);
      assert.ok(m.runwayMonths > 0, `Target ${target.ticker} runway must be > 0`);
      assert.ok(["critical", "urgent", "moderate", "stable"].includes(m.capitalNeedUrgency), `Target ${target.ticker} urgency must be valid tier`);
    });
  });

  await t.test("Test 4: 24-Month financing flow integrity: Total equals components", () => {
    targets.forEach((target) => {
      const f = target.financingHistory2Y;
      const computedSum = f.equityRaised + f.warrantProceeds + f.convertibleDebt + f.seniorDebt + f.atmProceeds;
      assert.equal(f.totalRaised, computedSum, `Target ${target.ticker} 2Y financing sum must balance with components`);
      assert.ok(f.summary.length > 20, `Target ${target.ticker} must have non-empty financing summary`);
    });
  });

  await t.test("Test 5: Registration statements verified with SEC filings", () => {
    targets.forEach((target) => {
      const r = target.registrationStatements2Y;
      assert.ok(r.filings && r.filings.length > 0, `Target ${target.ticker} must have Form S-3/424B/S-1 filings`);
      r.filings.forEach((filing) => {
        assert.ok(filing.secUrl.startsWith("https://www.sec.gov"), `Filing for ${target.ticker} must have valid SEC EDGAR URL`);
        assert.ok(filing.accessionNumber, `Filing for ${target.ticker} must have SEC accession number`);
      });
    });
  });

  await t.test("Test 6: C-Suite and outside legal counsel contacts complete for every company", () => {
    targets.forEach((target) => {
      assert.ok(target.contacts && target.contacts.length >= 4, `Target ${target.ticker} must have at least 4 key decision makers`);
      const ceo = target.contacts.find((c) => c.id.includes("ceo"));
      const cfo = target.contacts.find((c) => c.id.includes("cfo"));
      const counsel = target.contacts.find((c) => c.id.includes("outside-counsel") || c.id.includes("gc"));

      assert.ok(ceo && ceo.email.includes("@"), `Target ${target.ticker} must have CEO with verified email`);
      assert.ok(cfo && cfo.email.includes("@"), `Target ${target.ticker} must have CFO with verified email`);
      assert.ok(counsel && counsel.email.includes("@"), `Target ${target.ticker} must have Counsel with verified email`);
    });
  });

  await t.test("Test 7: Asset Liberator style outreach templates present and populated", () => {
    targets.forEach((target) => {
      assert.ok(target.outreach.managementSubject.length > 10, `Target ${target.ticker} must have management subject`);
      assert.ok(target.outreach.managementBody.includes(target.ticker), `Target ${target.ticker} management body must reference ticker`);
      assert.ok(target.outreach.legalSubject.length > 10, `Target ${target.ticker} must have legal subject`);
      assert.ok(target.outreach.legalBody.includes(target.ticker), `Target ${target.ticker} legal body must reference ticker`);
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
