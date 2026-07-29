import { ChainId, TokenPair } from "./types";

const BASE = "https://api.dexscreener.com";

// DexScreener has no single "new pairs for chain X" REST endpoint that's free.
// Practical workaround: search against the chain's most common quote tokens,
// which returns freshly created pairs alongside established ones, then we
// filter/sort client-side by pairCreatedAt. This is the same approach most
// free scanner bots use. For a firehose of every new pair the moment it's
// created you'd want DexScreener's paid data feed or your own chain indexer.
const DISCOVERY_QUERIES: Record<ChainId, string[]> = {
  bsc: ["WBNB", "BUSD", "USDT"],
  solana: ["SOL", "USDC"],
};

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

export async function discoverNewPairs(chain: ChainId): Promise<TokenPair[]> {
  const queries = DISCOVERY_QUERIES[chain];
  const dexChain = DEX_CHAIN_ID[chain];
  const results = await Promise.allSettled(
    queries.map((q) =>
      fetch(`${BASE}/latest/dex/search?q=${encodeURIComponent(q)}`, {
        headers: { Accept: "application/json" },
        next: { revalidate: 0 },
      }).then((r) => {
        if (!r.ok) throw new Error(`DexScreener search failed: ${r.status}`);
        return r.json();
      })
    )
  );

  const seen = new Map<string, TokenPair>();
  for (const res of results) {
    if (res.status !== "fulfilled") continue;
    const pairs: RawPair[] = res.value?.pairs ?? [];
    for (const p of pairs) {
      if (p.chainId !== dexChain) continue;
      const tp = toTokenPair(p, chain);
      if (!tp) continue;
      // keep the pair with higher liquidity if the token shows up twice
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
