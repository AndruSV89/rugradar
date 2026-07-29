import { NextRequest, NextResponse } from "next/server";
import { fetchTokenPair } from "@/lib/dexscreener";
import { fetchSecurity } from "@/lib/goplus";
import { classifyRisk, momentumScore } from "@/lib/scoring";
import { ChainId } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const chain = req.nextUrl.searchParams.get("chain") as ChainId | null;
  const address = req.nextUrl.searchParams.get("address");

  if (!chain || !address) {
    return NextResponse.json(
      { error: "chain and address are required" },
      { status: 400 }
    );
  }

  const pair = await fetchTokenPair(chain, address);
  if (!pair) {
    return NextResponse.json({ error: "Token not found" }, { status: 404 });
  }

  const security = await fetchSecurity(chain, address);
  const { risk, reasons } = classifyRisk(security);

  return NextResponse.json({
    token: {
      ...pair,
      momentumScore: momentumScore(pair),
      security,
      risk,
      riskReasons: reasons,
    },
  });
}
