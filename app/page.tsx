"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import FilterPanel from "@/components/FilterPanel";
import TokenRow from "@/components/TokenRow";
import RadarPing from "@/components/RadarPing";
import { DEFAULT_FILTERS, passesFilters } from "@/lib/scoring";
import { ScoredToken } from "@/lib/types";

const REFRESH_MS = 45_000;

export default function Home() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [tokens, setTokens] = useState<ScoredToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tokens?limit=40", { cache: "no-store" });
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();
      setTokens(data.tokens ?? []);
      setLastFetched(Date.now());
    } catch (e) {
      setError(
        "Couldn't reach the discovery feed. DexScreener or GoPlus may be rate-limiting — try again shortly."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    const t = setInterval(() => {
      if (lastFetched) setSecondsAgo(Math.floor((Date.now() - lastFetched) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [lastFetched]);

  const filtered = useMemo(
    () => tokens.filter((t) => passesFilters(t, t.security, filters)),
    [tokens, filters]
  );

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-8 flex items-center gap-3">
        <RadarPing live={!loading} />
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            RugRadar
          </h1>
          <p className="text-xs text-muted sm:text-sm">
            New BSC + Solana launches, screened for rug risk, ranked by liquidity + volume
          </p>
        </div>
        <div className="ml-auto text-right font-mono text-[11px] text-muted">
          {lastFetched ? (
            <>
              <div className="text-scan">● live</div>
              <div>updated {secondsAgo}s ago</div>
            </>
          ) : (
            <div>connecting…</div>
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <FilterPanel filters={filters} onChange={setFilters} />

        <section>
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-muted">
              {loading && tokens.length === 0
                ? "Scanning…"
                : `${filtered.length} of ${tokens.length} pass filters`}
            </span>
            <button
              onClick={load}
              className="rounded-md border border-line px-2.5 py-1 font-mono text-[11px] text-muted transition-colors hover:border-scandim hover:text-scan"
            >
              refresh now
            </button>
          </div>

          {error && (
            <div className="mb-3 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">
              {error}
            </div>
          )}

          {loading && tokens.length === 0 ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[62px] animate-pulse rounded-lg border border-line bg-panel/60"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-line bg-panel px-4 py-10 text-center text-sm text-muted">
              No tokens clear the current filters. Loosen a threshold in the panel to see more.
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((t, i) => (
                <TokenRow key={`${t.chain}-${t.tokenAddress}`} token={t} rank={i + 1} />
              ))}
            </div>
          )}

          <p className="mt-6 text-center text-[11px] text-muted">
            Discovery via DexScreener · risk signals via GoPlus Security · auto-refreshes every{" "}
            {REFRESH_MS / 1000}s. Not financial advice — always verify before trading.
          </p>
        </section>
      </div>
    </main>
  );
}
