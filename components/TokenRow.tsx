import Link from "next/link";
import RiskBadge from "./RiskBadge";
import { ScoredToken } from "@/lib/types";

function fmtUsd(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtAge(minutes: number) {
  if (!Number.isFinite(minutes)) return "—";
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / 1440)}d`;
}

export default function TokenRow({ token, rank }: { token: ScoredToken; rank: number }) {
  return (
    <Link
      href={`/token/${token.chain}/${token.tokenAddress}`}
      className="animate-rise group grid grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-lg border border-line bg-panel px-3 py-3 transition-colors hover:border-scandim sm:grid-cols-[2rem_1.5fr_repeat(4,minmax(0,1fr))_auto]"
    >
      <span className="font-mono text-xs text-muted">{String(rank).padStart(2, "0")}</span>

      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
            token.chain === "bsc" ? "bg-amber/15 text-amber" : "bg-scan/15 text-scan"
          }`}
        >
          {token.chain}
        </span>
        <div className="min-w-0">
          <div className="truncate font-display text-sm font-medium text-ink group-hover:text-scan">
            {token.symbol}
          </div>
          <div className="truncate text-xs text-muted">{token.name}</div>
        </div>
      </div>

      <div className="hidden text-right font-mono text-sm font-tabular text-ink sm:block">
        {fmtUsd(token.liquidityUsd)}
        <div className="text-[10px] text-muted">liquidity</div>
      </div>
      <div className="hidden text-right font-mono text-sm font-tabular text-ink sm:block">
        {fmtUsd(token.volume24hUsd)}
        <div className="text-[10px] text-muted">vol 24h</div>
      </div>
      <div className="hidden text-right font-mono text-sm font-tabular sm:block">
        <span className={token.priceChange24h >= 0 ? "text-scan" : "text-danger"}>
          {token.priceChange24h >= 0 ? "+" : ""}
          {token.priceChange24h.toFixed(1)}%
        </span>
        <div className="text-[10px] text-muted">24h</div>
      </div>
      <div className="hidden text-right font-mono text-sm font-tabular text-ink sm:block">
        {fmtAge(token.ageMinutes)}
        <div className="text-[10px] text-muted">age</div>
      </div>

      <RiskBadge risk={token.risk} />
    </Link>
  );
}
