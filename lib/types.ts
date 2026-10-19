export interface ExecutiveContact {
  id: string;
  name: string;
  title: string;
  entity: string;
  email: string;
  phone: string;
  firm?: string;
  roleSummary: string;
  receptivityScore: "high" | "very_high" | "moderate" | "low";
  notes?: string;
  source?: string;
}

export interface RegFiling {
  form: string;
  filingDate: string;
  description: string;
  underwriterAgent: string;
  secUrl: string;
  accessionNumber: string;
}

export interface SecSignal8K {
  type: "item_3_01_deficiency" | "item_2_04_acceleration" | "item_3_02_unregistered_dilution";
  item: string;
  title: string;
  date: string;
  accessionNumber: string;
  secUrl: string;
  details: string;
}

export interface MarketData {
  price: number | null;
  priceDisplay: string;
  currency: string;
  avgDailyVolume: number | null;
  avgMonthlyVolume: number | null;
  avgMonthlyVolumeDisplay: string;
  asOfDate: string;
  sourceUrl: string;
}

export interface FinancialMetrics {
  cashOnHand: number | null;
  cashOnHandDisplay: string;
  asOfDate: string;
  filingForm: string;
  accessionNumber: string;
  secViewerUrl?: string;
  changeInCash12M: number | null;
  changeInCashPct: number | null;
  changeInCashDisplay: string;
  currentAssets: number | null;
  currentLiabilities: number | null;
  workingCapital: number | null;
  workingCapitalDisplay: string;
  isNegativeWorkingCapital: boolean;
  workingCapitalDeficit: number;
  currentRatio: number | null;
  currentRatioDisplay: string;
  isUnclassifiedBalanceSheet?: boolean;
  isCommercialRevenue?: boolean;
  operatingCashFlow?: number | null;
  monthlyBurnRate: number;
  runwayMonths: number;
  runwayDisplay: string;
  capitalNeedUrgency: "critical" | "urgent" | "moderate" | "stable" | "unrated";
  urgencyRationale: string;
  calculationMethodology: string;
  isStaleFiling?: boolean;
  staleDays?: number;
  hasItem301Notice?: boolean;
  item301Details?: {
    noticeDate: string;
    accessionNumber: string;
    secUrl: string;
    status: string;
  } | null;
}

export interface FinancingHistory2Y {
  netFinancingCashFlow: number | null;
  totalRaised: number;
  equityRaised: number;
  warrantProceeds: number;
  convertibleDebt: number;
  seniorDebt: number;
  atmProceeds: number;
  summary: string;
  sourceFiling?: string;
}

export interface RegistrationStatements2Y {
  activeShelvesFiled: number;
  activeShelfCapacity: number;
  remainingShelfUsable: number;
  filingCount: number;
  primaryUnderwriter: string;
  dilutionRisk: "Severe" | "High" | "Moderate" | "Low" | "Not Applicable";
  babyShelfConstrained: boolean;
  babyShelfNote: string;
  universalShelvesFiled?: number;
  atmProspectusCount?: number;
  initialRegistrationsCount?: number;
  filings: RegFiling[];
}

export interface CrmRecord {
  stage: "screened" | "outreach_ready" | "contacted" | "nda_signed" | "term_sheet" | "passed";
  priority: string;
  contactStatus: "Not Contacted" | "Outreach Sent" | "Executive Follow-up" | "NDA Sent" | "Term Sheet Proposed" | "Passed / Archived";
  lastTouch: string | null;
  nextStep: string;
  responseOutcome: "Pending Response" | "Positive / Receptive" | "Meeting Scheduled" | "Declined - Sufficient Runway" | "Declined - Alternative Facility" | "No Response";
  notes: {
    id: string;
    date: string;
    author: string;
    text: string;
  }[];
  activities: {
    id: string;
    date: string;
    type: "email" | "call" | "meeting" | "sec_filing";
    summary: string;
  }[];
}

export interface OutreachTemplates {
  managementSubject: string;
  managementBody: string;
  legalSubject: string;
  legalBody: string;
}

export interface MaximTarget {
  id: string;
  name: string;
  ticker: string;
  cik: string;
  sector: string;
  category: "multi_sector" | "healthcare";
  status: "confirmed" | "invited";
  isPanelist: boolean;
  exchange: string;
  headquarters: string;
  secStatus: "sec_verified_filer" | "non_sec_foreign_or_private" | "sec_exempt_fund" | "bankrupt_defunct";
  regulatoryPortal?: string;
  regulatoryPortalUrl?: string;
  telephone: string;
  secEdgarUrl: string;
  dataProvenance: string;
  lastRefreshedAt: string;
  signals8K?: SecSignal8K[];
  marketData: MarketData;
  noActiveRegStatements24M: boolean;
  hasActiveRegStatements24M: boolean;
  regStatementsCount24M: number;
  regStatementForms24M: string[];
  financialMetrics: FinancialMetrics;
  financingHistory2Y: FinancingHistory2Y;
  registrationStatements2Y: RegistrationStatements2Y;
  contacts: ExecutiveContact[];
  crm: CrmRecord;
  outreach: OutreachTemplates;
}

export interface MaximDatasetMetadata {
  event: string;
  generatedAt: string;
  dataSource: string;
  totalTargets: number;
  secFilersCount: number;
  foreignAndExemptCount: number;
  criticalCount: number;
  urgentCount: number;
  moderateCount: number;
  stableCount: number;
  unratedCount: number;
  negativeWorkingCapitalCount: number;
  totalNegativeWorkingCapitalDeficit: number;
  totalFinancingPast2Y: number;
  panelistCount: number;
  noActiveRegStatementsCount?: number;
  lastMarketDataRefresh?: string;
  changeLog?: {
    version: string;
    date: string;
    summary: string;
  }[];
}
