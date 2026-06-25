import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";

export type FxstreetRssItem = {
  title: string;
  link: string;
  description: string;
  publishedAt: string;
};

export type FxstreetPriceSignal = {
  symbol: string;
  price: number;
  source: "fxstreet-rss";
  headline: string;
  link: string;
  publishedAt: string;
  updatedAt: number;
};

type FxstreetSnapshot = {
  updatedAt: string | null;
  source: string;
  status: "idle" | "ok" | "error" | "disabled";
  itemCount: number;
  signalCount: number;
  error?: string;
};

const defaultRssUrl = "https://www.fxstreet.com/rss";
const defaultPollMs = 5 * 60_000;
const defaultSignalTtlMs = 30 * 60_000;
const xmlEntityMap: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

const marketPatterns: Array<{ symbol: string; matchers: RegExp[]; pricePatterns: RegExp[] }> = [
  {
    symbol: "EURUSD",
    matchers: [/EUR\/USD/i, /EURUSD/i],
    pricePatterns: [/EUR\/USD[^\d]*(?:trades|holds|near|around|at|above|below|to)?[^\d]*(\d+\.\d{3,5})/gi],
  },
  {
    symbol: "GBPUSD",
    matchers: [/GBP\/USD/i, /GBPUSD/i],
    pricePatterns: [/GBP\/USD[^\d]*(?:trades|holds|near|around|at|above|below|to)?[^\d]*(\d+\.\d{3,5})/i],
  },
  {
    symbol: "USDJPY",
    matchers: [/USD\/JPY/i, /USDJPY/i],
    pricePatterns: [/USD\/JPY[^\d]*(?:trades|holds|near|around|at|above|below|to)?[^\d]*(\d{2,3}\.\d{1,4})/i],
  },
  {
    symbol: "USDCAD",
    matchers: [/USD\/CAD/i, /USDCAD/i],
    pricePatterns: [/USD\/CAD[^\d]*(?:trades|holds|near|around|at|above|below|to)?[^\d]*(\d+\.\d{3,5})/i],
  },
  {
    symbol: "AUDUSD",
    matchers: [/AUD\/USD/i, /AUDUSD/i],
    pricePatterns: [/AUD\/USD[^\d]*(?:trades|holds|near|around|at|above|below|to)?[^\d]*(\d+\.\d{3,5})/i],
  },
  {
    symbol: "XAUUSD",
    matchers: [/XAU\/USD/i, /gold/i],
    pricePatterns: [/(?:XAU\/USD|Gold)[^$\d]*(?:trades|holds|weakens|pulls back|near|around|at|above|below|to)?[^$\d]*\$?([1-9][\d,]{3,}(?:\.\d+)?)/gi],
  },
  {
    symbol: "USOIL",
    matchers: [/WTI/i, /crude oil/i],
    pricePatterns: [/(?:WTI|crude oil)[^$\d]*(?:trades|holds|near|around|at|above|below|to)?[^$\d]*\$([1-9]\d{1,2}(?:\.\d+)?)/gi],
  },
  {
    symbol: "BTCUSD",
    matchers: [/BTC\/USD/i, /Bitcoin/i],
    pricePatterns: [/(?:BTC\/USD|Bitcoin)[^$\d]*(?:trades|holds|near|around|at|above|below|to)?[^$\d]*\$?([1-9]\d{4,}(?:\.\d+)?)/i],
  },
  {
    symbol: "ETHUSD",
    matchers: [/ETH\/USD/i, /Ethereum/i],
    pricePatterns: [/(?:ETH\/USD|Ethereum)[^$\d]*(?:trades|holds|near|around|at|above|below|to)?[^$\d]*\$?([1-9]\d{3,}(?:\.\d+)?)/i],
  },
];

export function parseFxstreetRssItems(xml: string): FxstreetRssItem[] {
  return [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)]
    .map((match) => match[0])
    .map((itemXml) => {
      const pubDate = readXmlTag(itemXml, "pubDate");
      const parsedDate = Date.parse(pubDate);
      return {
        title: readXmlTag(itemXml, "title").slice(0, 220),
        link: readXmlTag(itemXml, "link"),
        description: stripHtml(readXmlTag(itemXml, "description")).slice(0, 500),
        publishedAt: Number.isFinite(parsedDate) ? new Date(parsedDate).toISOString() : new Date().toISOString(),
      };
    })
    .filter((item) => item.title.length > 0);
}

export function extractFxstreetPriceSignals(items: FxstreetRssItem[], now = Date.now()): FxstreetPriceSignal[] {
  const signals = new Map<string, FxstreetPriceSignal>();
  for (const item of items) {
    const text = `${item.title}. ${item.description}`;
    for (const market of marketPatterns) {
      if (!market.matchers.some((matcher) => matcher.test(text))) {
        continue;
      }
      const price = extractPrice(text, market.pricePatterns);
      if (price === undefined) {
        continue;
      }
      const existing = signals.get(market.symbol);
      if (existing && Date.parse(existing.publishedAt) >= Date.parse(item.publishedAt)) {
        continue;
      }
      signals.set(market.symbol, {
        symbol: market.symbol,
        price,
        source: "fxstreet-rss",
        headline: item.title,
        link: item.link,
        publishedAt: item.publishedAt,
        updatedAt: now,
      });
    }
  }
  return [...signals.values()];
}

@Injectable()
export class FxstreetRssService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FxstreetRssService.name);
  private readonly enabled = process.env.FXSTREET_RSS_ENABLED !== "false";
  private readonly rssUrl = process.env.FXSTREET_RSS_URL ?? defaultRssUrl;
  private readonly pollMs = normalizePositiveMs(process.env.FXSTREET_RSS_REFRESH_MS, defaultPollMs);
  private readonly signalTtlMs = normalizePositiveMs(process.env.FXSTREET_RSS_SIGNAL_TTL_MS, defaultSignalTtlMs);
  private readonly signals = new Map<string, FxstreetPriceSignal>();
  private timer?: NodeJS.Timeout;
  private refreshing = false;
  private currentRefresh?: Promise<void>;
  private snapshot: FxstreetSnapshot = {
    updatedAt: null,
    source: this.rssUrl,
    status: this.enabled ? "idle" : "disabled",
    itemCount: 0,
    signalCount: 0,
  };

  async onModuleInit() {
    if (!this.enabled) {
      return;
    }
    await this.refreshNow("startup");
    this.timer = setInterval(() => void this.refreshNow("interval"), this.pollMs);
    this.timer.unref?.();
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async refreshNow(_reason: "startup" | "interval" | "request" = "request") {
    if (!this.enabled) {
      return this.getStatus();
    }
    if (this.refreshing && this.currentRefresh) {
      await this.currentRefresh;
      return this.getStatus();
    }
    this.refreshing = true;
    this.currentRefresh = this.performRefresh();
    await this.currentRefresh;
    return this.getStatus();
  }

  private async performRefresh() {
    try {
      const response = await fetch(this.rssUrl, {
        headers: {
          Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
          "User-Agent": "AiTraders/1.0 (+https://local.aitraders.dev)",
        },
      });
      const xml = await response.text();
      if (!response.ok) {
        throw new Error(`FXStreet RSS ${response.status}`);
      }
      const items = parseFxstreetRssItems(xml);
      const extracted = extractFxstreetPriceSignals(items);
      for (const signal of extracted) {
        this.signals.set(signal.symbol, signal);
      }
      this.pruneExpiredSignals();
      this.snapshot = {
        updatedAt: new Date().toISOString(),
        source: this.rssUrl,
        status: "ok",
        itemCount: items.length,
        signalCount: this.signals.size,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown FXStreet RSS error";
      this.snapshot = {
        ...this.snapshot,
        status: "error",
        error: message.slice(0, 180),
      };
      this.logger.warn(`FXStreet RSS refresh failed: ${message}`);
    } finally {
      this.refreshing = false;
      this.currentRefresh = undefined;
    }
  }

  getFreshPrice(symbol: string): FxstreetPriceSignal | undefined {
    const signal = this.signals.get(symbol.toUpperCase());
    if (!signal) {
      return undefined;
    }
    if (Date.now() - signal.updatedAt > this.signalTtlMs) {
      this.signals.delete(symbol.toUpperCase());
      return undefined;
    }
    return signal;
  }

  getSignals() {
    this.pruneExpiredSignals();
    return [...this.signals.values()].sort((a, b) => b.updatedAt - a.updatedAt);
  }

  getStatus() {
    return {
      ...this.snapshot,
      refreshIntervalSeconds: Math.round(this.pollMs / 1000),
      signalTtlSeconds: Math.round(this.signalTtlMs / 1000),
      signals: this.getSignals().map((signal) => ({
        symbol: signal.symbol,
        price: signal.price,
        headline: signal.headline,
        publishedAt: signal.publishedAt,
      })),
    };
  }

  private pruneExpiredSignals() {
    const now = Date.now();
    for (const [symbol, signal] of this.signals.entries()) {
      if (now - signal.updatedAt > this.signalTtlMs) {
        this.signals.delete(symbol);
      }
    }
  }
}

function normalizePositiveMs(value: string | undefined, fallback: number) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readXmlTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!match) {
    return "";
  }
  return decodeXml(match[1].replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim());
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeXml(value: string) {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (_, entity: string) => {
    if (entity.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    }
    if (entity.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    }
    return xmlEntityMap[entity] ?? `&${entity};`;
  });
}

function extractPrice(text: string, patterns: RegExp[]) {
  let latest: number | undefined;
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      if (!match[1]) {
        continue;
      }
      const price = Number(match[1].replace(/,/g, ""));
      if (Number.isFinite(price) && price > 0) {
        latest = price;
      }
      if (!pattern.global) {
        break;
      }
    }
  }
  return latest;
}
