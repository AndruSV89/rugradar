import { NextRequest, NextResponse } from "next/server";
import { fetchSocialSignal } from "@/lib/social";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  const websites = req.nextUrl.searchParams.getAll("website");
  const socialTypes = req.nextUrl.searchParams.getAll("socialType");
  const socialUrls = req.nextUrl.searchParams.getAll("socialUrl");

  if (!symbol) {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 });
  }

  const socials = socialTypes.map((type, i) => ({
    type,
    url: socialUrls[i] ?? "",
  }));

  const signal = await fetchSocialSignal(symbol, websites, socials);
  return NextResponse.json({ signal });
}
