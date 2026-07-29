export default function RadarPing({ live }: { live: boolean }) {
  return (
    <div className="relative h-9 w-9 shrink-0">
      <div className="absolute inset-0 rounded-full border border-scandim" />
      <div className="absolute inset-[6px] rounded-full border border-scandim/70" />
      <div className="absolute inset-[13px] rounded-full border border-scandim/50" />
      {live && (
        <div
          className="absolute inset-0 animate-sweep"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(79,227,161,0.55), transparent 30%)",
            borderRadius: "9999px",
            maskImage: "radial-gradient(circle, black 60%, transparent 61%)",
            WebkitMaskImage: "radial-gradient(circle, black 60%, transparent 61%)",
          }}
        />
      )}
      <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-scan" />
    </div>
  );
}
