# RugRadar

A personal leaderboard for freshly-launched BSC and Solana tokens, ranked by
liquidity + volume, with an automated rug-pull risk screen on every listing.

## What it does

- **Discovery**: pulls new/active pairs on BSC and Solana from DexScreener's
  free public API.
- **Ranking**: scores each token on a blend of liquidity and 24h volume
  (volume weighted slightly higher) and lists the strongest first.
- **Rug filter**, powered by GoPlus Security, checked against every token:
  - Liquidity locked or burned
  - Ownership renounced
  - Honeypot / sell-simulation check
  - Top-10 holder concentration
  - Buy tax vs. sell tax
  - Still-mintable supply
- Extra listing filters: **minimum token age**, **minimum liquidity/volume**,
  **require socials present**.
- **Social scanner** on each token's detail page: shows linked
  website/Twitter/Telegram, and — if you add a LunarCrush API key — live
  mention counts, interactions, and sentiment.
- Auto-refreshes every 45 seconds. Two-chain toggle (BSC / Solana / both).

## Honest limitations (read before you trade on this)

- DexScreener doesn't offer a free "every new pair the instant it's created"
  firehose. This app approximates "new" by searching each chain's most
  common trading pairs (WBNB/BUSD/USDT on BSC, SOL/USDC on Solana) and
  sorting by pair creation time. It's the same approach most free scanner
  bots use, but it can miss extremely fresh or thinly-traded pairs. A paid
  data feed or your own chain indexer would close that gap.
- GoPlus's security data is a strong signal, not a guarantee. Sophisticated
  scams can still pass these checks. Never treat a "CLEAR" badge as
  investment advice.
- The social scanner's live numbers require your own free LunarCrush API
  key (see below). Without one, it still shows linked channels, just not
  mention/sentiment counts. It matches by token symbol, so very common
  ticker symbols can occasionally show another project's data.
- This is a screening tool, not a wallet or a trading bot. It never touches
  your funds.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Optional: copy `.env.example` to `.env.local` and add a LunarCrush API key
to enable live social metrics.

## Deploy to Vercel

**Option A — from your own GitHub (recommended):**

1. Create a new repo on GitHub and push this project to it:
   ```bash
   git init
   git add .
   git commit -m "RugRadar"
   git branch -M main
   git remote add origin https://github.com/<your-username>/rugradar.git
   git push -u origin main
   ```
2. Go to https://vercel.com/new, choose "Import Git Repository", and select
   the repo.
3. Framework preset should auto-detect as **Next.js** — leave build/output
   settings as default.
4. (Optional) Under **Environment Variables**, add `LUNARCRUSH_API_KEY` if
   you have one.
5. Click **Deploy**. You'll get a live `*.vercel.app` URL in about a minute.

**Option B — straight from your machine with the Vercel CLI, no GitHub:**

```bash
npm install -g vercel
cd rugradar
vercel        # first deploy, follow the prompts
vercel --prod # promote to your production URL
```

Either way, no other configuration is required — DexScreener and GoPlus are
public APIs with no key needed for the base features.

## Project structure

```
app/
  page.tsx                       leaderboard (client component)
  token/[chain]/[address]/       token detail page
  api/tokens/                    aggregated, scored leaderboard feed
  api/token-detail/              single-token detail (pair + security)
  api/security/                  raw GoPlus security lookup
  api/social/                    social scanner lookup
lib/
  dexscreener.ts                 DexScreener client + new-pair discovery
  goplus.ts                      GoPlus Security client, normalizes BSC/Solana
  social.ts                      LunarCrush client with link-only fallback
  scoring.ts                     momentum score, risk classification, filters
  types.ts                       shared types
components/                      FilterPanel, TokenRow, RiskBadge, panels
```
