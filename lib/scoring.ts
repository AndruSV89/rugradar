import { FilterState, RiskLevel, SecurityReport, TokenPair } from "./types";

// Ranks tokens by a blend of liquidity and 24h volume. Volume is weighted
// slightly higher since it reflects live interest, liquidity guards against
// wallets that can't actually exit a position.
export function momentumScore(t: TokenPair): number {
  const liq = Math.log10(Math.max(t.liquidityUsd, 1));
  const vol = Math.log10(Math.max(t.volume24hUsd, 1));
  return vol * 1.4 + liq * 1.0;
}

export function classifyRisk(
  security: SecurityReport | null
): { risk: RiskLevel; reasons: string[] } {
  if (!security) return { risk: "unknown", reasons: ["Security data unavailable"] };

  const reasons: string[] = [];
  let dangerHits = 0;
  let cautionHits = 0;

  if (security.isHoneypot === true) {
    dangerHits++;
    reasons.push("Sell simulation failed (honeypot)");
  }
  if (security.liquidityLocked === false) {
    dangerHits++;
    reasons.push("Liquidity not locked or burned");
  }
  if (security.ownershipRenounced === false) {
    cautionHits++;
    reasons.push("Ownership not renounced");
  }
  if (security.top10HolderPct !== null && security.top10HolderPct > 40) {
    dangerHits++;
    reasons.push(`Top 10 wallets hold ${security.top10HolderPct.toFixed(1)}% of supply`);
  } else if (security.top10HolderPct !== null && security.top10HolderPct > 25) {
    cautionHits++;
    reasons.push(`Top 10 wallets hold ${security.top10HolderPct.toFixed(1)}% of supply`);
  }
  if (security.sellTaxPct !== null && security.sellTaxPct > 15) {
    dangerHits++;
    reasons.push(`Sell tax ${security.sellTaxPct.toFixed(1)}%`);
  } else if (security.sellTaxPct !== null && security.sellTaxPct > 8) {
    cautionHits++;
    reasons.push(`Sell tax ${security.sellTaxPct.toFixed(1)}%`);
  }
  if (security.buyTaxPct !== null && security.buyTaxPct !== security.sellTaxPct) {
    if (security.buyTaxPct > 15) {
      cautionHits++;
      reasons.push(`Buy tax ${security.buyTaxPct.toFixed(1)}%`);
    }
  }
  if (security.isMintable === true) {
    cautionHits++;
    reasons.push("Supply can still be minted");
  }

  if (dangerHits > 0) return { risk: "danger", reasons };
  if (cautionHits > 0) return { risk: "caution", reasons };
  if (reasons.length === 0) reasons.push("No red flags detected");
  return { risk: "safe", reasons };
}

export function passesFilters(
  t: TokenPair,
  security: SecurityReport | null,
  f: FilterState
): boolean {
  if (f.chain !== "all" && t.chain !== f.chain) return false;
  if (t.liquidityUsd < f.minLiquidity) return false;
  if (t.volume24hUsd < f.minVolume) return false;
  if (t.ageMinutes < f.minAgeMinutes) return false;
  if (f.requireSocials && t.websites.length === 0 && t.socials.length === 0)
    return false;

  if (security) {
    if (
      f.blockHoneypots &&
      security.isHoneypot !== null &&
      security.isHoneypot
    )
      return false;
    if (
      f.requireLiquidityLocked &&
      security.liquidityLocked !== null &&
      !security.liquidityLocked
    )
      return false;
    if (
      f.requireOwnershipRenounced &&
      security.ownershipRenounced !== null &&
      !security.ownershipRenounced
    )
      return false;
    if (
      security.top10HolderPct !== null &&
      security.top10HolderPct > f.maxTop10HolderPct
    )
      return false;
    if (security.buyTaxPct !== null && security.buyTaxPct > f.maxBuyTax)
      return false;
    if (security.sellTaxPct !== null && security.sellTaxPct > f.maxSellTax)
      return false;
  }

  return true;
}

export const DEFAULT_FILTERS: FilterState = {
  chain: "all",
  minLiquidity: 5000,
  minVolume: 2000,
  minAgeMinutes: 15,
  maxBuyTax: 15,
  maxSellTax: 15,
  maxTop10HolderPct: 40,
  requireLiquidityLocked: true,
  requireOwnershipRenounced: false,
  blockHoneypots: true,
  requireSocials: false,
};
