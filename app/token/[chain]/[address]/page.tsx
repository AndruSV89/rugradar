"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import RiskBadge from "@/components/RiskBadge";
import SecurityPanel from "@/components/SecurityPanel";
import SocialPanel from "@/components/SocialPanel";
import { ScoredToken } from "@/lib/types";
import { SocialSignal } from "@/lib/social";

function fmtUsd(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export default function TokenDetail() {
  const params = useParams<{ chain: string; address: string }>();
  const [token, setToken] = useState<ScoredToken | null>(null);
  const [social, setSocial] = useState<SocialSignal | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      try {
        const res = await fetch(
          `/api/token-detail?chain=${params.chain}&address=${params.address}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error("not found");
        const data = await res.json();
        setToken(data.token);

        const qs = new URLSearchParams({ symbol: data.token.symbol });
        data.token.websites.forEach((w: string) => qs.append("website", w));
        data.token.socials.forEach((s: { type: string; url: string }) => {
          qs.append("socialType", s.type);
          qs.append("socialUrl", s.url);
        });
        const socialRes = await fetch(`/api/social?${qs.toString()}`, {
          cache: "no-store",
        });
        if (socialRes.ok) {
          const socialData = await socialRes.json();
          setSocial(socialData.signal);
        }
      } catch {
        setError("Couldn't load this token. It may have been delisted or the address is wrong.");
      }
    }
    run();
  }, [params.chain, params.address]);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <Link href="/" className="mb-6 inline-block font-mono text-xs text-muted hover:text-scan">
        ← back to leaderboard
      </Link>

      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {!token && !error && (
        <div className="space-y-3">
          <div className="h-20 animate-pulse rounded-lg border border-line bg-panel/60" />
          <div className="h-64 animate-pulse rounded-lg border border-line bg-panel/60" />
        </div>
      )}

      {token && (
        <>
          <header className="mb-6 flex items-start justify-between gap-4 rounded-lg border border-line bg-panel p-5">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
                    token.chain === "bsc" ? "bg-amber/15 text-amber" : "bg-scan/15 text-scan"
                  }`}
                >
                  {token.chain}
                </span>
                <RiskBadge risk={token.risk} />
              </div>
              <h1 className="font-display text-2xl font-bold text-ink">{token.symbol}</h1>
              <p className="text-sm text-muted">{token.name}</p>
              <p className="mt-2 break-all font-mono text-[11px] text-muted">
                {token.tokenAddress}
              </p>
            </div>
            <a
              href={token.dexUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-md border border-scandim px-3 py-1.5 font-mono text-xs text-scan transition-colors hover:bg-scan/10"
            >
              View chart ↗
            </a>
          </header>

          <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["Price", `$${token.priceUsd.toPrecision(4)}`],
              ["Liquidity", fmtUsd(token.liquidityUsd)],
              ["Volume 24h", fmtUsd(token.volume24hUsd)],
              ["FDV", fmtUsd(token.fdv)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-line bg-panel p-3 text-center">
                <div className="font-mono text-sm font-medium text-ink">{value}</div>
                <div className="text-[10px] text-muted">{label}</div>
              </div>
            ))}
          </div>

          <div className="mb-6 rounded-lg border border-line bg-panel p-4">
            <h3 className="mb-2 font-display text-sm font-medium text-ink">Why this rating</h3>
            <ul className="space-y-1.5">
              {token.riskReasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink/80">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted" />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          {token.security && (
            <div className="mb-6">
              <SecurityPanel security={token.security} />
            </div>
          )}

          {social ? (
            <SocialPanel signal={social} />
          ) : (
            <div className="h-40 animate-pulse rounded-lg border border-line bg-panel/60" />
          )}

          <p className="mt-6 text-center text-[11px] text-muted">
            Automated screening only — not financial advice. Always verify contracts yourself before trading.
          </p>
        </>
      )}
    </main>
  );
}
