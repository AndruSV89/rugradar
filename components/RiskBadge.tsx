import { RiskLevel } from "@/lib/types";

const CONFIG: Record<
  RiskLevel,
  { label: string; dot: string; text: string; ring: string; pulse: boolean }
> = {
  safe: {
    label: "CLEAR",
    dot: "bg-scan",
    text: "text-scan",
    ring: "ring-scan/30",
    pulse: false,
  },
  caution: {
    label: "CAUTION",
    dot: "bg-amber",
    text: "text-amber",
    ring: "ring-amber/30",
    pulse: false,
  },
  danger: {
    label: "DANGER",
    dot: "bg-danger",
    text: "text-danger",
    ring: "ring-danger/30",
    pulse: true,
  },
  unknown: {
    label: "NO DATA",
    dot: "bg-muted",
    text: "text-muted",
    ring: "ring-muted/20",
    pulse: false,
  },
};

export default function RiskBadge({ risk }: { risk: RiskLevel }) {
  const c = CONFIG[risk];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-mono font-medium tracking-wider ring-1 ${c.ring} ${c.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot} ${c.pulse ? "animate-blip" : ""}`} />
      {c.label}
    </span>
  );
}
