import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        hull: "#0B1210",
        panel: "#10201C",
        panel2: "#152722",
        line: "#1E362F",
        scan: "#4FE3A1",
        scandim: "#2C6650",
        amber: "#F2B84B",
        danger: "#FF5C5C",
        ink: "#E8F3EE",
        muted: "#6B8A7E",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      keyframes: {
        sweep: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        blip: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        sweep: "sweep 4s linear infinite",
        blip: "blip 1.6s ease-in-out infinite",
        rise: "rise 0.35s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
