export interface SocialSignal {
  source: "lunarcrush" | "links-only";
  mentions24h: number | null;
  interactions24h: number | null;
  sentimentPct: number | null; // 0-100, % positive
  galaxyScore: number | null;
  hasWebsite: boolean;
  hasTwitter: boolean;
  hasTelegram: boolean;
  links: { type: string; url: string }[];
}

const LUNARCRUSH_KEY = process.env.LUNARCRUSH_API_KEY;

// LunarCrush indexes by ticker symbol, not contract address, so matches on
// very new/low-cap tokens can be sparse or wrong-token collisions for common
// symbols. Treat this as directional, not authoritative.
async function fetchLunarCrush(symbol: string): Promise<Partial<SocialSignal> | null> {
  if (!LUNARCRUSH_KEY) return null;
  try {
    const r = await fetch(
      `https://lunarcrush.com/api4/public/coins/${encodeURIComponent(symbol)}/v1`,
      {
        headers: { Authorization: `Bearer ${LUNARCRUSH_KEY}` },
        next: { revalidate: 0 },
      }
    );
    if (!r.ok) return null;
    const json = await r.json();
    const d = json?.data;
    if (!d) return null;
    return {
      mentions24h: d.social_mentions ?? d.social_volume_24h ?? null,
      interactions24h: d.interactions_24h ?? null,
      sentimentPct: d.sentiment ?? null,
      galaxyScore: d.galaxy_score ?? null,
    };
  } catch {
    return null;
  }
}

export async function fetchSocialSignal(
  symbol: string,
  websites: string[],
  socials: { type: string; url: string }[]
): Promise<SocialSignal> {
  const links = [
    ...websites.map((url) => ({ type: "website", url })),
    ...socials,
  ];
  const lc = await fetchLunarCrush(symbol);

  return {
    source: lc ? "lunarcrush" : "links-only",
    mentions24h: lc?.mentions24h ?? null,
    interactions24h: lc?.interactions24h ?? null,
    sentimentPct: lc?.sentimentPct ?? null,
    galaxyScore: lc?.galaxyScore ?? null,
    hasWebsite: websites.length > 0,
    hasTwitter: socials.some((s) => /twitter|^x$/i.test(s.type)),
    hasTelegram: socials.some((s) => /telegram/i.test(s.type)),
    links,
  };
}
