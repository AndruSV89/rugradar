import { SecurityReport } from "@/lib/types";

function Row({
  label,
  value,
  good,
}: {
  label: string;
  value: string;
  good: boolean | null;
}) {
  const color =
    good === null ? "text-muted" : good ? "text-scan" : "text-danger";
  return (
    <div className="flex items-center justify-between border-b border-line py-2.5 last:border-0">
      <span className="text-sm text-ink/80">{label}</span>
      <span className={`font-mono text-sm font-medium ${color}`}>{value}</span>
    </div>
  );
}

function yn(v: boolean | null, invert = false) {
  if (v === null) return { text: "unknown", good: null as boolean | null };
  const good = invert ? !v : v;
  return { text: v ? "yes" : "no", good };
}

export default function SecurityPanel({ security }: { security: SecurityReport }) {
  const honeypot = yn(security.isHoneypot, true);
  const locked = yn(security.liquidityLocked);
  const renounced = yn(security.ownershipRenounced);
  const mintable = yn(security.isMintable, true);
  const openSource = yn(security.isOpenSource);

  return (
    <div className="rounded-lg border border-line bg-panel p-4">
      <h3 className="mb-1 font-display text-sm font-medium text-ink">Security scan</h3>
      <p className="mb-2 text-[11px] text-muted">Source: GoPlus Security · verify independently before trading</p>

      <Row label="Honeypot (can't sell)" value={honeypot.text} good={honeypot.good} />
      <Row
        label="Liquidity locked / burned"
        value={
          security.liquidityLockedPct !== null
            ? `${locked.text} (${security.liquidityLockedPct.toFixed(0)}%)`
            : locked.text
        }
        good={locked.good}
      />
      <Row label="Ownership renounced" value={renounced.text} good={renounced.good} />
      <Row
        label="Top 10 holders"
        value={
          security.top10HolderPct !== null
            ? `${security.top10HolderPct.toFixed(1)}%`
            : "unknown"
        }
        good={
          security.top10HolderPct === null
            ? null
            : security.top10HolderPct <= 25
        }
      />
      <Row
        label="Buy tax"
        value={security.buyTaxPct !== null ? `${security.buyTaxPct.toFixed(1)}%` : "unknown"}
        good={security.buyTaxPct === null ? null : security.buyTaxPct <= 8}
      />
      <Row
        label="Sell tax"
        value={security.sellTaxPct !== null ? `${security.sellTaxPct.toFixed(1)}%` : "unknown"}
        good={security.sellTaxPct === null ? null : security.sellTaxPct <= 8}
      />
      <Row label="Still mintable" value={mintable.text} good={mintable.good} />
      <Row label="Contract open source" value={openSource.text} good={openSource.good} />
    </div>
  );
}
