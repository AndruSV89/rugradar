"use client";

import { FilterState } from "@/lib/types";

function NumberField({
  label,
  value,
  onChange,
  suffix,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  step?: number;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wider text-muted font-mono">
        {label}
      </span>
      <div className="flex items-center gap-1 rounded-md border border-line bg-panel px-2 py-1.5">
        <input
          type="number"
          value={value}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-transparent font-mono text-sm text-ink outline-none [appearance:textfield]"
        />
        {suffix && <span className="text-xs text-muted font-mono">{suffix}</span>}
      </div>
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between gap-3 rounded-md border px-2.5 py-1.5 text-left text-xs font-mono transition-colors ${
        checked
          ? "border-scandim bg-scan/10 text-scan"
          : "border-line bg-panel text-muted"
      }`}
    >
      {label}
      <span
        className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${
          checked ? "bg-scan" : "bg-line"
        }`}
      >
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-hull transition-transform ${
            checked ? "translate-x-3.5" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}

export default function FilterPanel({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (f: FilterState) => void;
}) {
  const set = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="rounded-lg border border-line bg-panel2/60 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="font-display text-sm font-medium text-ink">Filters</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="mb-3 flex gap-2">
        {(["all", "bsc", "solana"] as const).map((c) => (
          <button
            key={c}
            onClick={() => set("chain", c)}
            className={`flex-1 rounded-md border px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
              filters.chain === c
                ? "border-scan bg-scan/10 text-scan"
                : "border-line text-muted hover:border-scandim"
            }`}
          >
            {c === "all" ? "Both" : c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label="Min liquidity"
          value={filters.minLiquidity}
          onChange={(v) => set("minLiquidity", v)}
          suffix="USD"
          step={500}
        />
        <NumberField
          label="Min 24h volume"
          value={filters.minVolume}
          onChange={(v) => set("minVolume", v)}
          suffix="USD"
          step={500}
        />
        <NumberField
          label="Min age"
          value={filters.minAgeMinutes}
          onChange={(v) => set("minAgeMinutes", v)}
          suffix="min"
        />
        <NumberField
          label="Max top-10 holders"
          value={filters.maxTop10HolderPct}
          onChange={(v) => set("maxTop10HolderPct", v)}
          suffix="%"
        />
        <NumberField
          label="Max buy tax"
          value={filters.maxBuyTax}
          onChange={(v) => set("maxBuyTax", v)}
          suffix="%"
        />
        <NumberField
          label="Max sell tax"
          value={filters.maxSellTax}
          onChange={(v) => set("maxSellTax", v)}
          suffix="%"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Toggle
          label="Block honeypots"
          checked={filters.blockHoneypots}
          onChange={(v) => set("blockHoneypots", v)}
        />
        <Toggle
          label="Require LP locked"
          checked={filters.requireLiquidityLocked}
          onChange={(v) => set("requireLiquidityLocked", v)}
        />
        <Toggle
          label="Require renounced"
          checked={filters.requireOwnershipRenounced}
          onChange={(v) => set("requireOwnershipRenounced", v)}
        />
        <Toggle
          label="Require socials"
          checked={filters.requireSocials}
          onChange={(v) => set("requireSocials", v)}
        />
      </div>
    </div>
  );
}
