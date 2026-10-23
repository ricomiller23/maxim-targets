import { MaximTarget } from "./types";

/**
 * Robust, null-safe search matcher for MAXIM Targets.
 * Matches against ticker, name, sector, CIK, price, volume, phone, and contact details.
 */
export function matchTargetSearch(target: MaximTarget, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase().trim();
  if (!q) return true;

  if (q === "no reg" && target.noActiveRegStatements24M) return true;

  if (target.ticker?.toLowerCase().includes(q)) return true;
  if (target.name?.toLowerCase().includes(q)) return true;
  if (target.sector?.toLowerCase().includes(q)) return true;
  if (target.cik && String(target.cik).toLowerCase().includes(q)) return true;
  if (target.exchange?.toLowerCase().includes(q)) return true;
  if (target.headquarters?.toLowerCase().includes(q)) return true;
  if (target.telephone?.toLowerCase().includes(q)) return true;
  if (target.marketData?.priceDisplay?.toLowerCase().includes(q)) return true;
  if (target.marketData?.avgMonthlyVolumeDisplay?.toLowerCase().includes(q)) return true;

  if (Array.isArray(target.contacts)) {
    for (const c of target.contacts) {
      if (!c) continue;
      if (c.name?.toLowerCase().includes(q)) return true;
      if (c.email?.toLowerCase().includes(q)) return true;
      if (c.firm?.toLowerCase().includes(q)) return true;
      if (c.phone?.toLowerCase().includes(q)) return true;
      if (c.title?.toLowerCase().includes(q)) return true;
      if (c.roleSummary?.toLowerCase().includes(q)) return true;
    }
  }

  return false;
}
