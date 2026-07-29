import { SocialSignal } from "@/lib/social";

export default function SocialPanel({ signal }: { signal: SocialSignal }) {
  return (
    <div className="rounded-lg border border-line bg-panel p-4">
      <h3 className="mb-1 font-display text-sm font-medium text-ink">Social scanner</h3>
      <p className="mb-3 text-[11px] text-muted">
        {signal.source === "lunarcrush"
          ? "Live mentions & sentiment via LunarCrush"
          : "Live sentiment feed not connected — showing linked channels only. Add LUNARCRUSH_API_KEY to enable mentions, interactions and sentiment."}
      </p>

      {signal.source === "lunarcrush" && (
        <div className="mb-3 grid grid-cols-3 gap-2">
          <Stat label="Mentions 24h" value={signal.mentions24h} />
          <Stat label="Interactions" value={signal.interactions24h} />
          <Stat
            label="Sentiment"
            value={signal.sentimentPct !== null ? `${signal.sentimentPct}%` : null}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {signal.links.length === 0 && (
          <span className="text-xs text-muted">No linked website or social channels found.</span>
        )}
        {signal.links.map((l, i) => (
          <a
            key={i}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-line px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-muted transition-colors hover:border-scandim hover:text-scan"
          >
            {l.type}
          </a>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="rounded-md bg-panel2 px-2 py-2 text-center">
      <div className="font-mono text-sm font-medium text-ink">{value ?? "—"}</div>
      <div className="text-[10px] text-muted">{label}</div>
    </div>
  );
}
