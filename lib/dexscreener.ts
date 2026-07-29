import { ChainId, TokenPair } from "./types";

const BASE = "https://api.dexscreener.com";

const DEX_CHAIN_ID: Record<ChainId, string> = {
  bsc: "bsc",
  solana: "solana",
};

interface RawPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string; symbol: string };
  priceUsd?: string;
  txns?: { h24?: { buys: number; sells: number } };
  volume?: { h24?: number };
  priceChange?: { h24?: number };
  liquidity?: { usd?: number };
  fdv?: number;
  pairCreatedAt?: number;
  url: string;
  info?: {
    imageUrl?: string;
    websites?: { url: string }[];
    socials?: { type: string; url: string }[];
  };
}

function toTokenPair(p: RawPair, chain: ChainId): TokenPair | null {
  if (!p.pairAddress || !p.baseToken?.address) return null;
  const createdAt = p.pairCreatedAt ?? 0;
  const ageMinutes = createdAt ? (Date.now() - createdAt) / 60000 : Infinity;
  return {
    chain,
    pairAddress: p.pairAddress,
    tokenAddress: p.baseToken.address,
    name: p.baseToken.name || p.baseToken.symbol || "Unknown",
    symbol: p.baseToken.symbol || "?",
    priceUsd: p.priceUsd ? parseFloat(p.priceUsd) : 0,
    liquidityUsd: p.liquidity?.usd ?? 0,
    volume24hUsd: p.volume?.h24 ?? 0,
    fdv: p.fdv ?? 0,
    pairCreatedAt: createdAt,
    ageMinutes,
    buys24h: p.txns?.h24?.buys ?? 0,
    sells24h: p.txns?.h24?.sells ?? 0,
    priceChange24h: p.priceChange?.h24 ?? 0,
    dexUrl: p.url,
    imageUrl: p.info?.imageUrl,
    websites: (p.info?.websites ?? []).map((w) => w.url),
    socials: p.info?.socials ?? [],
  };
}

interface TokenProfileEntry {
  chainId: string;
  tokenAddress: string;
}

// The real discovery sources: newly-submitted token profiles and newly
// boosted tokens. Both list *tokens*, not pairs, so we batch-resolve each
// candidate's market data via /tokens/v1/{chain}/{address}.
// Caveat: this only surfaces tokens that submitted a DexScreener profile or
// paid for a boost — anonymous pump.fun-style launches that never do either
// won't show up here. There's no free "every pair the instant it's created"
// firehose; that requires a paid feed or your own chain indexer.
async function fetchCandidateAddresses(chain: ChainId): Promise<string[]> {
  const dexChain = DEX_CHAIN_ID[chain];
  const endpoints = [
    `${BASE}/token-profiles/latest/v1`,
    `${BASE}/token-boosts/latest/v1`,
    `${BASE}/token-boosts/top/v1`,
  ];

  const results = await Promise.allSettled(
    endpoints.map((url) =>
      fetch(url, {
        headers: { Accept: "application/json" },
        next: { revalidate: 0 },
      }).then((r) => {
        if (!r.ok) throw new Error(`DexScreener ${url} failed: ${r.status}`);
        return r.json();
      })
    )
  );

  const addresses = new Set<string>();
  for (const res of results) {
    if (res.status !== "fulfilled") continue;
    const entries: TokenProfileEntry[] = Array.isArray(res.value)
      ? res.value
      : res.value?.data ?? [];
    for (const e of entries) {
      if (e.chainId === dexChain && e.tokenAddress) {
        addresses.add(e.tokenAddress);
      }
    }
  }
  return Array.from(addresses);
}

export async function discoverNewPairs(chain: ChainId): Promise<TokenPair[]> {
  const addresses = await fetchCandidateAddresses(chain);
  if (addresses.length === 0) return [];

  // /tokens/v1 accepts up to 30 comma-separated addresses per call
  const batches: string[][] = [];
  for (let i = 0; i < addresses.length; i += 30) {
    batches.push(addresses.slice(i, i + 30));
  }

  const dexChain = DEX_CHAIN_ID[chain];
  const batchResults = await Promise.allSettled(
    batches.map((batch) =>
      fetch(`${BASE}/tokens/v1/${dexChain}/${batch.join(",")}`, {
        headers: { Accept: "application/json" },
        next: { revalidate: 0 },
      }).then((r) => {
        if (!r.ok) throw new Error(`DexScreener tokens/v1 failed: ${r.status}`);
        return r.json();
      })
    )
  );

  const seen = new Map<string, TokenPair>();
  for (const res of batchResults) {
    if (res.status !== "fulfilled") continue;
    const pairs: RawPair[] = Array.isArray(res.value) ? res.value : [];
    for (const p of pairs) {
      if (p.chainId !== dexChain) continue;
      const tp = toTokenPair(p, chain);
      if (!tp) continue;
      const existing = seen.get(tp.tokenAddress);
      if (!existing || tp.liquidityUsd > existing.liquidityUsd) {
        seen.set(tp.tokenAddress, tp);
      }
    }
  }

  return Array.from(seen.values()).sort(
    (a, b) => b.pairCreatedAt - a.pairCreatedAt
  );
}

export async function fetchTokenPair(
  chain: ChainId,
  tokenAddress: string
): Promise<TokenPair | null> {
  const dexChain = DEX_CHAIN_ID[chain];
  const r = await fetch(`${BASE}/tokens/v1/${dexChain}/${tokenAddress}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });
  if (!r.ok) return null;
  const data: RawPair[] = await r.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  // pick the pair with the highest liquidity
  const best = data.reduce((a, b) =>
    (a.liquidity?.usd ?? 0) > (b.liquidity?.usd ?? 0) ? a : b
  );
  return toTokenPair(best, chain);
}
