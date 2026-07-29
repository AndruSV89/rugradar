import { NextRequest, NextResponse } from "next/server";
import { fetchSecurity } from "@/lib/goplus";
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

  const security = await fetchSecurity(chain, address);
  return NextResponse.json({ security });
}
