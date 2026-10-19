import fs from "fs";
import path from "path";
import seedData from "../data/maxim-targets.json";
import { MaximTarget, MaximDatasetMetadata } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "maxim-store.json");
const TMP_PATH = "/tmp/maxim-store.json";

class MaximTargetStore {
  private targets: Map<string, MaximTarget> = new Map();
  private metadata: MaximDatasetMetadata = seedData.metadata as MaximDatasetMetadata;
  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.initialized) return;
    this.initialized = true;

    let loaded = false;
    for (const f of [STORE_PATH, TMP_PATH]) {
      if (fs.existsSync(f)) {
        try {
          const raw = fs.readFileSync(f, "utf8");
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.targets)) {
            for (const t of parsed.targets) {
              this.targets.set(t.id, t);
            }
            if (parsed.metadata) this.metadata = parsed.metadata;
            loaded = true;
            break;
          }
        } catch {}
      }
    }

    if (!loaded) {
      for (const item of (seedData.targets as unknown as MaximTarget[])) {
        this.targets.set(item.id, item);
      }
      this.persist();
    }
  }

  private persist() {
    const payload = {
      metadata: this.getMetadata(),
      targets: Array.from(this.targets.values()),
      updatedAt: new Date().toISOString()
    };
    const jsonStr = JSON.stringify(payload, null, 2);

    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(STORE_PATH, jsonStr, "utf8");
    } catch {}

    try {
      fs.writeFileSync(TMP_PATH, jsonStr, "utf8");
    } catch {}
  }

  public getTargets(filter?: {
    search?: string;
    sector?: string;
    urgency?: string;
    workingCapital?: "all" | "negative" | "positive";
    status?: "all" | "confirmed" | "invited";
    panelist?: "all" | "yes" | "no";
    stage?: string;
    noActiveRegStatements?: boolean;
  }): MaximTarget[] {
    this.init();
    let list = Array.from(this.targets.values());

    if (filter?.sector && filter.sector !== "all") {
      list = list.filter(t => t.sector.toLowerCase().includes(filter.sector!.toLowerCase()) || t.category === filter.sector);
    }

    if (filter?.urgency && filter.urgency !== "all") {
      list = list.filter(t => t.financialMetrics.capitalNeedUrgency === filter.urgency);
    }

    if (filter?.workingCapital && filter.workingCapital !== "all") {
      if (filter.workingCapital === "negative") list = list.filter(t => t.financialMetrics.isNegativeWorkingCapital);
      if (filter.workingCapital === "positive") list = list.filter(t => !t.financialMetrics.isNegativeWorkingCapital);
    }

    if (filter?.status && filter.status !== "all") {
      list = list.filter(t => t.status === filter.status);
    }

    if (filter?.panelist && filter.panelist !== "all") {
      list = list.filter(t => filter.panelist === "yes" ? t.isPanelist : !t.isPanelist);
    }

    if (filter?.stage && filter.stage !== "all") {
      list = list.filter(t => t.crm.stage === filter.stage);
    }

    if (filter?.noActiveRegStatements) {
      list = list.filter(t => t.noActiveRegStatements24M);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.ticker.toLowerCase().includes(q) ||
        t.sector.toLowerCase().includes(q) ||
        (t.marketData?.priceDisplay && t.marketData.priceDisplay.toLowerCase().includes(q)) ||
        (t.marketData?.avgMonthlyVolumeDisplay && t.marketData.avgMonthlyVolumeDisplay.toLowerCase().includes(q)) ||
        t.contacts.some(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.firm && c.firm.toLowerCase().includes(q)))
      );
    }

    return list;
  }

  public getTarget(id: string): MaximTarget | undefined {
    this.init();
    return this.targets.get(id);
  }

  public updateTargetCrm(id: string, updates: Partial<MaximTarget["crm"]>) {
    this.init();
    const target = this.targets.get(id);
    if (!target) return null;

    target.crm = { ...target.crm, ...updates };
    this.targets.set(id, target);
    this.persist();
    return target;
  }

  public logActivity(id: string, activity: { type: "email" | "call" | "meeting" | "sec_filing"; summary: string }) {
    this.init();
    const target = this.targets.get(id);
    if (!target) return null;

    const newAct = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: new Date().toISOString().slice(0, 10),
      ...activity
    };

    target.crm.activities = target.crm.activities || [];
    target.crm.activities.unshift(newAct);
    target.crm.lastTouch = newAct.date;
    if (target.crm.stage === "screened") target.crm.stage = "outreach_ready";

    this.targets.set(id, target);
    this.persist();
    return target;
  }

  public getMetadata(): MaximDatasetMetadata {
    this.init();
    const all = Array.from(this.targets.values());
    return {
      event: "Maxim Growth Conference 2026",
      generatedAt: new Date().toISOString(),
      dataSource: "Official SEC EDGAR XBRL & Submissions Index",
      totalTargets: all.length,
      secFilersCount: all.filter(t => t.secStatus === "sec_verified_filer").length,
      foreignAndExemptCount: all.filter(t => t.secStatus !== "sec_verified_filer").length,
      criticalCount: all.filter(t => t.financialMetrics.capitalNeedUrgency === "critical").length,
      urgentCount: all.filter(t => t.financialMetrics.capitalNeedUrgency === "urgent").length,
      moderateCount: all.filter(t => t.financialMetrics.capitalNeedUrgency === "moderate").length,
      stableCount: all.filter(t => t.financialMetrics.capitalNeedUrgency === "stable").length,
      unratedCount: all.filter(t => t.financialMetrics.capitalNeedUrgency === "unrated").length,
      negativeWorkingCapitalCount: all.filter(t => t.financialMetrics.isNegativeWorkingCapital).length,
      totalNegativeWorkingCapitalDeficit: all.reduce((acc, t) => acc + t.financialMetrics.workingCapitalDeficit, 0),
      totalFinancingPast2Y: all.reduce((acc, t) => acc + t.financingHistory2Y.totalRaised, 0),
      panelistCount: all.filter(t => t.isPanelist).length,
      noActiveRegStatementsCount: all.filter(t => t.noActiveRegStatements24M).length,
      lastMarketDataRefresh: this.metadata.lastMarketDataRefresh || new Date().toISOString()
    };
  }
}

export const maximStore = new MaximTargetStore();
