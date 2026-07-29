import { NextRequest, NextResponse } from "next/server";
import { discoverNewPairs } from "@/lib/dexscreener";
import { fetchSecurity } from "@/lib/goplus";
import { classifyRisk, momentumScore } from "@/lib/scoring";
import { ChainId, ScoredToken } from "@/lib/types";

export const dynamic = "force-dynamic";

async function buildChain(chain: ChainId, limit: number): Promise<ScoredToken[]> {
  const pairs = await discoverNewPairs(chain);
  const top = pairs
    .filter((p) => p.liquidityUsd > 0)
    .sort((a, b) => momentumScore(b) - momentumScore(a))
    .slice(0, limit);

  const withSecurity = await Promise.all(
    top.map(async (t) => {
      const security = await fetchSecurity(chain, t.tokenAddress);
      const { risk, reasons } = classifyRisk(security);
      const scored: ScoredToken = {
        ...t,
        momentumScore: momentumScore(t),
        security,
        risk,
        riskReasons: reasons,
      };
      return scored;
    })
  );

  return withSecurity;
}

export async function GET(req: NextRequest) {
  const chainParam = req.nextUrl.searchParams.get("chain") as
    | ChainId
    | "all"
    | null;
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 40);

  try {
    const chains: ChainId[] =
      chainParam === "bsc" || chainParam === "solana"
        ? [chainParam]
        : ["bsc", "solana"];

    const results = await Promise.all(
      chains.map((c) => buildChain(c, Math.min(limit, 60)))
    );
    const flat = results.flat().sort((a, b) => b.momentumScore - a.momentumScore);

    return NextResponse.json({ tokens: flat, fetchedAt: Date.now() });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to load token data", detail: String(err) },
      { status: 502 }
    );
  }
}
