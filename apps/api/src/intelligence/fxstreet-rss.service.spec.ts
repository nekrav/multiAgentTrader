import { describe, expect, it } from "@jest/globals";
import { extractFxstreetPriceSignals, FxstreetRssService, parseFxstreetRssItems } from "./fxstreet-rss.service";

const rssFixture = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0"><channel>
  <item>
    <title>EUR/USD holds above 1.0850 as US Dollar softens</title>
    <link>https://www.fxstreet.com/news/eurusd-demo</link>
    <description>EUR/USD trades near 1.0864 during the European session.</description>
    <pubDate>Tue, 23 Jun 2026 05:01:36 Z</pubDate>
  </item>
  <item>
    <title>Gold weakens back below $4,150 amid Iran uncertainty</title>
    <link>https://www.fxstreet.com/news/gold-demo</link>
    <description>XAU/USD pulls back to $4,145 after reaching $4,200.</description>
    <pubDate>Tue, 23 Jun 2026 04:52:06 Z</pubDate>
  </item>
</channel></rss>`;

describe("FxstreetRssService parsing", () => {
  it("normalizes RSS items without trusting raw XML shape", () => {
    const items = parseFxstreetRssItems(rssFixture);

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      title: "EUR/USD holds above 1.0850 as US Dollar softens",
      link: "https://www.fxstreet.com/news/eurusd-demo",
    });
    expect(items[0].publishedAt).toBe("2026-06-23T05:01:36.000Z");
  });

  it("extracts usable market prices from FXStreet RSS text", () => {
    const signals = extractFxstreetPriceSignals(parseFxstreetRssItems(rssFixture));

    expect(signals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ symbol: "EURUSD", price: 1.0864, source: "fxstreet-rss" }),
        expect.objectContaining({ symbol: "XAUUSD", price: 4145, source: "fxstreet-rss" }),
      ]),
    );
  });

  it("uses a news-safe RSS cadence and stale window by default", () => {
    delete process.env.FXSTREET_RSS_REFRESH_MS;
    delete process.env.FXSTREET_RSS_SIGNAL_TTL_MS;

    const status = new FxstreetRssService().getStatus();

    expect(status.refreshIntervalSeconds).toBe(300);
    expect(status.signalTtlSeconds).toBe(1800);
  });
});
