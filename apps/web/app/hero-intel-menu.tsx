"use client";

import { useMemo, useState } from "react";
import type { NewsItem, TradeSignal } from "./market-category-page";

type HeroIntelTab = "news" | "trades" | "latest";

const tabs: Array<{ id: HeroIntelTab; label: string }> = [
  { id: "news", label: "News" },
  { id: "trades", label: "Top Trades" },
  { id: "latest", label: "Latest" },
];

export function HeroIntelMenu({
  topNews,
  latestNews,
  topTrades,
}: {
  topNews: NewsItem[];
  latestNews: NewsItem[];
  topTrades: TradeSignal[];
}) {
  const [activeTab, setActiveTab] = useState<HeroIntelTab>("news");
  const activePanel = useMemo(() => {
    if (activeTab === "trades") {
      return <TradeSignalList trades={topTrades.slice(0, 5)} />;
    }

    if (activeTab === "latest") {
      return <NewsList items={latestNews.slice(0, 5)} empty="No latest news yet." />;
    }

    return <NewsList items={topNews.slice(0, 5)} empty="No top news yet." />;
  }, [activeTab, latestNews, topNews, topTrades]);

  return (
    <section className="heroIntelMenu" aria-label="Market news and trade signals">
      <div className="heroTabs" role="tablist" aria-label="Hero market intelligence">
        {tabs.map((tab) => (
          <button
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? "active" : ""}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="heroIntelPanel" role="tabpanel">
        {activePanel}
      </div>
    </section>
  );
}

function NewsList({ items, empty }: { items: NewsItem[]; empty: string }) {
  if (items.length === 0) {
    return <p className="heroIntelEmpty">{empty}</p>;
  }

  return (
    <div className="newsList">
      {items.map((item) =>
        item.href ? (
          <a className={`newsItem news-${item.tone}`} href={item.href} key={item.id}>
            <NewsItemContent item={item} />
          </a>
        ) : (
          <article className={`newsItem news-${item.tone}`} key={item.id}>
            <NewsItemContent item={item} />
          </article>
        ),
      )}
    </div>
  );
}

function TradeSignalList({ trades }: { trades: TradeSignal[] }) {
  if (trades.length === 0) {
    return <p className="heroIntelEmpty">No trade signals yet.</p>;
  }

  return (
    <div className="newsList">
      {trades.map((trade) => (
        <a className={`newsItem trade-${trade.tone}`} href={trade.href} key={trade.id}>
          <span>
            {trade.move} · {formatPercent(trade.confidence)}
          </span>
          <strong>{trade.label}</strong>
          <small>{trade.summary}</small>
        </a>
      ))}
    </div>
  );
}

function NewsItemContent({ item }: { item: NewsItem }) {
  return (
    <>
      <span>{item.kicker}</span>
      <strong>{item.title}</strong>
      <small>{item.summary}</small>
    </>
  );
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}
