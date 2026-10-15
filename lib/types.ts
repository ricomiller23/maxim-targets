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
}

export interface RegFiling {
  form: string;
  filingDate: string;
  description: string;
  underwriterAgent: string;
  secUrl: string;
  accessionNumber: string;
}

export interface FinancialMetrics {
  cashOnHand: number;
  changeInCash12M: number;
  changeInCashPct: number;
  currentAssets: number;
  currentLiabilities: number;
  workingCapital: number;
  isNegativeWorkingCapital: boolean;
  workingCapitalDeficit: number;
  currentRatio: number;
  monthlyBurnRate: number;
  runwayMonths: number;
  capitalNeedUrgency: "critical" | "urgent" | "moderate" | "stable";
}

export interface FinancingHistory2Y {
  totalRaised: number;
  equityRaised: number;
  warrantProceeds: number;
  convertibleDebt: number;
  seniorDebt: number;
  atmProceeds: number;
  summary: string;
}

export interface RegistrationStatements2Y {
  activeShelfCapacity: number;
  remainingShelfUsable: number;
  filingCount: number;
  primaryUnderwriter: string;
  dilutionRisk: "Severe" | "High" | "Moderate" | "Low";
  filings: RegFiling[];
}

export interface CrmRecord {
  stage: "screened" | "outreach_ready" | "contacted" | "nda_signed" | "term_sheet" | "passed";
  priority: string;
  lastTouch: string | null;
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
  secEdgarUrl: string;
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
  totalTargets: number;
  criticalCount: number;
  urgentCount: number;
  moderateCount: number;
  stableCount: number;
  negativeWorkingCapitalCount: number;
  totalNegativeWorkingCapitalDeficit: number;
  totalFinancingPast2Y: number;
  panelistCount: number;
}
