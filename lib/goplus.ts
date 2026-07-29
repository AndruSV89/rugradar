import { ChainId, SecurityReport } from "./types";

const BASE = "https://api.gopluslabs.io/api/v1";
const EVM_CHAIN_ID: Record<string, string> = { bsc: "56" };

function toBool(v: unknown): boolean | null {
  if (v === "1" || v === 1 || v === true) return true;
  if (v === "0" || v === 0 || v === false) return false;
  return null;
}

function toPct(v: unknown): number | null {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  if (Number.isFinite(n)) return Math.round(n * 10000) / 100; // fraction -> %
  return null;
}

async function fetchEvmSecurity(
  tokenAddress: string
): Promise<SecurityReport> {
  const chainId = EVM_CHAIN_ID.bsc;
  const url = `${BASE}/token_security/${chainId}?contract_addresses=${tokenAddress}`;
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  const json = r.ok ? await r.json() : null;
  const d = json?.result?.[tokenAddress.toLowerCase()];

  if (!d) {
    return {
      chain: "bsc",
      tokenAddress,
      liquidityLocked: null,
      liquidityLockedPct: null,
      ownershipRenounced: null,
      isHoneypot: null,
      buyTaxPct: null,
      sellTaxPct: null,
      top10HolderPct: null,
      isMintable: null,
      isOpenSource: null,
    };
  }

  const lpHolders: { is_locked?: number; percent?: string }[] =
    d.lp_holders ?? [];
  const lockedPct = lpHolders
    .filter((h) => h.is_locked === 1)
    .reduce((sum, h) => sum + (parseFloat(h.percent ?? "0") || 0), 0);

  const holders: { percent?: string }[] = d.holders ?? [];
  const top10Pct =
    holders
      .slice(0, 10)
      .reduce((sum, h) => sum + (parseFloat(h.percent ?? "0") || 0), 0) * 100;

  return {
    chain: "bsc",
    tokenAddress,
    liquidityLocked: lpHolders.length > 0 ? lockedPct > 0.5 : null,
    liquidityLockedPct: lpHolders.length > 0 ? Math.round(lockedPct * 10000) / 100 : null,
    ownershipRenounced:
      d.owner_address !== undefined
        ? d.owner_address === "" ||
          d.owner_address === "0x0000000000000000000000000000000000000000"
        : null,
    isHoneypot: toBool(d.is_honeypot),
    buyTaxPct: d.buy_tax !== undefined ? toPctFraction(d.buy_tax) : null,
    sellTaxPct: d.sell_tax !== undefined ? toPctFraction(d.sell_tax) : null,
    top10HolderPct: holders.length > 0 ? Math.round(top10Pct * 100) / 100 : null,
    isMintable: toBool(d.is_mintable),
    isOpenSource: toBool(d.is_open_source),
    raw: d,
  };
}

function toPctFraction(v: unknown): number | null {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 10000) / 100; // GoPlus tax is already a fraction like 0.05 = 5%
}

async function fetchSolanaSecurity(
  tokenAddress: string
): Promise<SecurityReport> {
  const url = `${BASE}/solana/token_security?contract_addresses=${tokenAddress}`;
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  const json = r.ok ? await r.json() : null;
  const d = json?.result?.[tokenAddress];

  if (!d) {
    return {
      chain: "solana",
      tokenAddress,
      liquidityLocked: null,
      liquidityLockedPct: null,
      ownershipRenounced: null,
      isHoneypot: null,
      buyTaxPct: null,
      sellTaxPct: null,
      top10HolderPct: null,
      isMintable: null,
      isOpenSource: null,
    };
  }

  const lpHolders: { is_locked?: number; percent?: string }[] =
    d.lp_holders ?? [];
  const lockedPct = lpHolders
    .filter((h) => h.is_locked === 1)
    .reduce((sum, h) => sum + (parseFloat(h.percent ?? "0") || 0), 0);

  const holders: { percent?: string }[] = d.holders ?? [];
  const top10Pct =
    holders
      .slice(0, 10)
      .reduce((sum, h) => sum + (parseFloat(h.percent ?? "0") || 0), 0) * 100;

  const mintAuthorityActive =
    d.mintable?.status === "1" || d.mintable?.authority ? true : false;

  return {
    chain: "solana",
    tokenAddress,
    liquidityLocked: lpHolders.length > 0 ? lockedPct > 0.5 : null,
    liquidityLockedPct: lpHolders.length > 0 ? Math.round(lockedPct * 10000) / 100 : null,
    ownershipRenounced: d.mintable ? !mintAuthorityActive : null,
    isHoneypot: toBool(d.non_transferable) ?? null,
    buyTaxPct: null,
    sellTaxPct: null,
    top10HolderPct: holders.length > 0 ? Math.round(top10Pct * 100) / 100 : null,
    isMintable: mintAuthorityActive,
    isOpenSource: null,
    raw: d,
  };
}

export async function fetchSecurity(
  chain: ChainId,
  tokenAddress: string
): Promise<SecurityReport> {
  try {
    return chain === "bsc"
      ? await fetchEvmSecurity(tokenAddress)
      : await fetchSolanaSecurity(tokenAddress);
  } catch {
    return {
      chain,
      tokenAddress,
      liquidityLocked: null,
      liquidityLockedPct: null,
      ownershipRenounced: null,
      isHoneypot: null,
      buyTaxPct: null,
      sellTaxPct: null,
      top10HolderPct: null,
      isMintable: null,
      isOpenSource: null,
    };
  }
}
