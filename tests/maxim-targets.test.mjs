import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.resolve(__dirname, "../data/maxim-targets.json");

test("MAXIM Targets — Prebuild Assertion Test Suite v2.0 (Real SEC Data)", async (t) => {
  assert.ok(fs.existsSync(DATA_PATH), "maxim-targets.json dataset must exist");
  const raw = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const { metadata, targets } = raw;

  await t.test("Test 1: Full cohort of 113 presenting companies verified", () => {
    assert.equal(targets.length, 113, "Must contain exactly 113 presenting companies from Maxim Conference");
    assert.equal(metadata.totalTargets, 113);
  });

  await t.test("Test 2: Proper segregation of SEC filers vs Foreign/Exempt filers", () => {
    targets.forEach((target) => {
      assert.ok(["sec_verified_filer", "non_sec_foreign_or_private", "sec_exempt_fund", "bankrupt_defunct"].includes(target.secStatus), `Target ${target.ticker} must have valid secStatus`);
      
      if (target.secStatus === "sec_verified_filer") {
        assert.ok(/^\d+$/.test(target.cik), `SEC Filer ${target.ticker} must have numeric CIK (got ${target.cik})`);
        assert.ok(target.secEdgarUrl.startsWith("https://www.sec.gov"), `Target ${target.ticker} must have valid SEC EDGAR URL`);
      } else {
        assert.ok(target.regulatoryPortal, `Non-SEC target ${target.ticker} must specify regulatoryPortal`);
        assert.ok(target.regulatoryPortalUrl.startsWith("http"), `Non-SEC target ${target.ticker} must specify regulatoryPortalUrl`);
      }
    });
  });

  await t.test("Test 3: Financial metrics integrity and provenance (Standing Rules A, B, C)", () => {
    targets.forEach((target) => {
      const m = target.financialMetrics;
      assert.ok(["critical", "urgent", "moderate", "stable", "unrated"].includes(m.capitalNeedUrgency), `Target ${target.ticker} urgency must be valid tier`);
      assert.ok(typeof m.calculationMethodology === "string" && m.calculationMethodology.length > 10, `Target ${target.ticker} must have explicit methodology`);

      if (target.secStatus === "sec_verified_filer" && m.cashOnHand !== null) {
        assert.ok(typeof m.cashOnHand === "number" && m.cashOnHand >= 0, `Target ${target.ticker} cash on hand must be >= 0`);
        assert.ok(m.asOfDate.match(/^\d{4}-\d{2}-\d{2}$/), `Target ${target.ticker} asOfDate must be YYYY-MM-DD (got ${m.asOfDate})`);
        assert.ok(["10-Q", "10-K", "20-F", "6-K", "40-F"].includes(m.filingForm), `Target ${target.ticker} filingForm must be valid SEC periodic form (got ${m.filingForm})`);
        assert.ok(m.accessionNumber.match(/^\d{10}-\d{2}-\d{6}$/), `Target ${target.ticker} accessionNumber must match SEC standard (got ${m.accessionNumber})`);

        if (m.isUnclassifiedBalanceSheet) {
          assert.ok(m.workingCapitalDisplay.includes("Unclassified"), `REIT ${target.ticker} must indicate unclassified balance sheet`);
        } else if (m.currentAssets !== null && m.currentLiabilities !== null) {
          assert.equal(m.workingCapital, m.currentAssets - m.currentLiabilities, `Target ${target.ticker} working capital must equal Current Assets - Current Liabilities`);
          assert.equal(m.isNegativeWorkingCapital, m.workingCapital < 0, `Target ${target.ticker} negative working capital flag must be accurate`);
        }
      }
    });
  });

  await t.test("Test 4: Real registration statements carry authentic SEC accession receipts", () => {
    targets.forEach((target) => {
      const r = target.registrationStatements2Y;
      assert.ok(["Severe", "High", "Moderate", "Low", "Not Applicable"].includes(r.dilutionRisk), `Target ${target.ticker} dilution risk must be valid`);
      if (r.filings && r.filings.length > 0) {
        r.filings.forEach((filing) => {
          assert.ok(filing.secUrl.startsWith("https://www.sec.gov"), `Filing for ${target.ticker} must have valid SEC EDGAR URL`);
          assert.ok(filing.accessionNumber.match(/^\d{10}-\d{2}-\d{6}$/), `Filing for ${target.ticker} must have SEC accession number format`);
        });
      }
    });
  });

  await t.test("Test 5: Zero synthetic or repeating dummy contacts (Truth Over Completeness)", () => {
    const ceoNames = new Map();
    targets.forEach((target) => {
      assert.ok(target.contacts && target.contacts.length >= 1, `Target ${target.ticker} must have at least 1 contact record`);
      target.contacts.forEach((c) => {
        // Assert no synthetic sequential email domains like firstname@ticker.com
        if (c.email.includes("@")) {
          const domain = c.email.split("@")[1].toLowerCase();
          assert.notEqual(domain, `${target.ticker.toLowerCase()}.com`, `Target ${target.ticker} must not have synthetic firstname@ticker.com email`);
        }
        // Check for repeating dummy names (e.g. Arthur V. Vance)
        if (c.id.includes("ceo") && !c.name.includes("Executive Office") && !c.name.includes("Secretariat")) {
          const count = (ceoNames.get(c.name) || 0) + 1;
          ceoNames.set(c.name, count);
        }
      });
    });

    // Assert no CEO name appears more than once across 113 companies (unless verified parent/subsidiary)
    for (const [name, count] of ceoNames.entries()) {
      assert.ok(count <= 1, `Dummy placeholder CEO name "${name}" repeated ${count} times across unrelated companies`);
    }
  });

  await t.test("Test 6: 8-K signals carry accession receipts when present", () => {
    targets.forEach((target) => {
      if (target.signals8K && target.signals8K.length > 0) {
        target.signals8K.forEach((sig) => {
          assert.ok(sig.accessionNumber.match(/^\d{10}-\d{2}-\d{6}$/), `Signal for ${target.ticker} must have valid SEC accession number`);
          assert.ok(sig.secUrl.startsWith("https://www.sec.gov"), `Signal for ${target.ticker} must link to SEC EDGAR`);
          assert.ok(["Item 3.01", "Item 2.04", "Item 3.02"].includes(sig.item), `Signal item must be recognized 8-K item`);
        });
      }
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
