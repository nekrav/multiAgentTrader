export type PriceReference = {
  provider: string;
  websiteLabel: string;
  referenceUrl: string;
  sourceHint: string;
  dataMode: "live" | "synthetic";
};

const fxPairs = new Set([
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "USDCAD",
  "AUDUSD",
]);

const cryptoSymbols = new Set(["BTCUSD", "ETHUSD", "SOLUSD"]);

function coalesce(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function isFxPair(symbol: string): boolean {
  return symbol.length === 6 && !symbol.includes("/") && !cryptoSymbols.has(symbol) && fxPairs.has(symbol);
}

function toYahooSymbol(symbol: string): string {
  if (symbol === "XAUUSD") {
    return "GC=F";
  }

  if (symbol === "USOIL") {
    return "CL=F";
  }

  if (cryptoSymbols.has(symbol)) {
    return `${symbol.slice(0, 3)}-${symbol.slice(3)}`;
  }

  if (isFxPair(symbol)) {
    return `${symbol}=X`;
  }

  return symbol;
}

export function getPriceReference(symbol: string, _label?: string): PriceReference {
  const normalized = coalesce(symbol);

  if (isFxPair(normalized)) {
    return {
      provider: "Frankfurter FX",
      websiteLabel: "Frankfurter",
      referenceUrl: "https://www.frankfurter.app/",
      sourceHint: "FX closes from the public rates feed used by market-data snapshots.",
      dataMode: "live",
    };
  }

  if (cryptoSymbols.has(normalized)) {
    const coinbaseMapping: Record<string, string> = {
      BTCUSD: "bitcoin",
      ETHUSD: "ethereum",
      SOLUSD: "solana",
    };

    const token = coinbaseMapping[normalized] ?? normalized.toLowerCase();

    return {
      provider: "Coinbase Spot",
      websiteLabel: "Coinbase",
      referenceUrl: `https://www.coinbase.com/price/${token}`,
      sourceHint: "Spot candle snapshots from Coinbase for BTC/ETH/SOL-based symbols.",
      dataMode: "live",
    };
  }

  return {
    provider: "Yahoo Finance",
    websiteLabel: "Yahoo Finance",
    referenceUrl: `https://finance.yahoo.com/quote/${encodeURIComponent(toYahooSymbol(normalized))}`,
    sourceHint: "Market charting and quote lookup; used as the reference page for this symbol.",
    dataMode: "synthetic",
  };
}

export function getPriceSourceBadge(symbol: string) {
  const reference = getPriceReference(symbol);
  return `${reference.dataMode === "live" ? "Live feed" : "Reference chart"} · ${reference.provider}`;
}
