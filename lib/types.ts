export type ChainId = "bsc" | "solana";

export interface TokenPair {
  chain: ChainId;
  pairAddress: string;
  tokenAddress: string;
  name: string;
  symbol: string;
  priceUsd: number;
  liquidityUsd: number;
  volume24hUsd: number;
  fdv: number;
  pairCreatedAt: number; // ms epoch
  ageMinutes: number;
  buys24h: number;
  sells24h: number;
  priceChange24h: number;
  dexUrl: string;
  imageUrl?: string;
  websites: string[];
  socials: { type: string; url: string }[];
}

export interface SecurityReport {
  chain: ChainId;
  tokenAddress: string;
  liquidityLocked: boolean | null;
  liquidityLockedPct: number | null;
  ownershipRenounced: boolean | null;
  isHoneypot: boolean | null;
  buyTaxPct: number | null;
  sellTaxPct: number | null;
  top10HolderPct: number | null;
  isMintable: boolean | null;
  isOpenSource: boolean | null;
  raw?: unknown;
}

export type RiskLevel = "safe" | "caution" | "danger" | "unknown";

export interface ScoredToken extends TokenPair {
  momentumScore: number;
  security: SecurityReport | null;
  risk: RiskLevel;
  riskReasons: string[];
}

export interface FilterState {
  chain: ChainId | "all";
  minLiquidity: number;
  minVolume: number;
  minAgeMinutes: number;
  maxBuyTax: number;
  maxSellTax: number;
  maxTop10HolderPct: number;
  requireLiquidityLocked: boolean;
  requireOwnershipRenounced: boolean;
  blockHoneypots: boolean;
  requireSocials: boolean;
}
