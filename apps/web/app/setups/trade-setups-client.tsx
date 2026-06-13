"use client";

import { FormEvent, useEffect, useState } from "react";
import { AgentResult } from "../agents-dashboard";
import { ApiError, apiFetch } from "../lib/api";

type TradeSetup = {
  id: string;
  title: string;
  asset: string;
  direction: string;
  status: "draft" | "watching" | "ready" | "archived";
  thesis: string;
  riskPlan: string;
  metadata: Record<string, unknown>;
  updatedAt: string;
};

type ChainStep = {
  id: string;
  stepIndex: number;
  title: string;
  agentId: string;
  task: string;
  runId: string | null;
  status: string;
  result: Record<string, unknown> | null;
  error: string | null;
};

type AgentChain = {
  id: string;
  setupId: string | null;
  title: string;
  status: string;
  totalCreditCost: string;
  error: string | null;
  createdAt: string;
  steps?: ChainStep[];
};

const ASSET_OPTIONS = [
  { value: "BTC", label: "BTC/USD", group: "Crypto" },
  { value: "ETH", label: "ETH/USD", group: "Crypto" },
  { value: "EUR/USD", label: "EUR/USD", group: "Forex" },
  { value: "GBP/USD", label: "GBP/USD", group: "Forex" },
  { value: "USD/JPY", label: "USD/JPY", group: "Forex" },
  { value: "AUD/USD", label: "AUD/USD", group: "Forex" },
  { value: "USD/CAD", label: "USD/CAD", group: "Forex" },
  { value: "USD/CHF", label: "USD/CHF", group: "Forex" },
  { value: "NZD/USD", label: "NZD/USD", group: "Forex" },
  { value: "EUR/GBP", label: "EUR/GBP", group: "Forex" },
  { value: "EUR/JPY", label: "EUR/JPY", group: "Forex" },
  { value: "GBP/JPY", label: "GBP/JPY", group: "Forex" },
];

const STRATEGY_OPTIONS = [
  { value: "trend_momentum_continuation", label: "Trend + Momentum" },
  { value: "london_session_breakout", label: "London Breakout" },
  { value: "ny_session_reversal", label: "NY Reversal" },
  { value: "mean_reversion_exhaustion", label: "Mean Reversion" },
  { value: "squeeze_breakout_confirmation", label: "Squeeze Breakout" },
  { value: "pattern_breakout_with_trend_filter", label: "Pattern Breakout" },
  { value: "reversal_confluence", label: "Reversal Confluence" },
  { value: "market_favorite_90", label: "Market Favorite 90" },
  { value: "market_favorite_95", label: "Market Favorite 95" },
];

const defaultSetup = {
  title: "EUR/USD event-driven setup",
  asset: "EUR/USD",
  direction: "long",
  thesis: "Track whether current market structure supports a clean, risk-gated trade.",
  riskPlan: "Avoid entries during high volatility, wide spreads, or weak expected value.",
  strategies: ["trend_momentum_continuation", "london_session_breakout"],
  runBacktest: true,
  backtestDays: 90,
};

export function TradeSetupsClient() {
  const [setups, setSetups] = useState<TradeSetup[]>([]);
  const [chains, setChains] = useState<AgentChain[]>([]);
  const [selectedSetupId, setSelectedSetupId] = useState("");
  const [selectedChain, setSelectedChain] = useState<AgentChain | null>(null);
  const [form, setForm] = useState(defaultSetup);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!selectedChain || !["queued", "running"].includes(selectedChain.status)) {
      return;
    }
    const timer = setInterval(() => {
      void apiFetch<AgentChain>(`/agent-chains/${selectedChain.id}`).then(setSelectedChain).catch(() => undefined);
      void apiFetch<AgentChain[]>("/agent-chains").then(setChains).catch(() => undefined);
    }, 2500);
    return () => clearInterval(timer);
  }, [selectedChain]);

  const selectedSetup = setups.find((setup) => setup.id === selectedSetupId) ?? setups[0];

  async function load() {
    try {
      const [nextSetups, nextChains] = await Promise.all([apiFetch<TradeSetup[]>("/trade-setups"), apiFetch<AgentChain[]>("/agent-chains")]);
      setSetups(nextSetups);
      setChains(nextChains);
      setSelectedSetupId(nextSetups[0]?.id ?? "");
      if (nextChains[0]) {
        setSelectedChain(await apiFetch<AgentChain>(`/agent-chains/${nextChains[0].id}`));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load trade setup workspace.");
    }
  }

  async function createSetup(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const created = await apiFetch<TradeSetup>("/trade-setups", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          metadata: { strategies: form.strategies, runBacktest: form.runBacktest, backtestDays: form.backtestDays },
          status: "watching",
        }),
      });
      setSetups([created, ...setups]);
      setSelectedSetupId(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create setup.");
    } finally {
      setBusy(false);
    }
  }

  async function startChain() {
    const setup = selectedSetup;
    if (!setup) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const created = await apiFetch<{ chainId: string }>("/agent-chains", {
        method: "POST",
        body: JSON.stringify({
          setupId: setup.id,
          title: `${setup.asset} setup agent chain`,
          asset: setup.asset,
          direction: setup.direction,
          eventTitle: setup.thesis,
          strategies: setupStrategies(setup),
          runBacktest: setupBacktestEnabled(setup),
          backtestDays: setupBacktestDays(setup),
        }),
      });
      const chain = await apiFetch<AgentChain>(`/agent-chains/${created.chainId}`);
      setSelectedChain(chain);
      setChains([chain, ...chains]);
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        setError("Insufficient credits for the full agent chain.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to start agent chain.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function saveStep(step: ChainStep) {
    if (!step.runId) {
      return;
    }
    await apiFetch("/saved-analyses", {
      method: "POST",
      body: JSON.stringify({
        runId: step.runId,
        setupId: selectedSetup?.id,
        title: `${selectedSetup?.asset ?? "Setup"} ${step.title}`,
        tags: [step.agentId, "chain"],
      }),
    });
  }

  return (
    <div className="workspacePage">
      <section className="sectionHeader compactHeader">
        <div>
          <p className="eyebrow">Trade setup</p>
          <h1>Setup Workspace</h1>
        </div>
        <button className="primaryButton" disabled={busy || !selectedSetup} onClick={startChain} type="button">
          {busy ? "Working..." : "Run Agent Chain"}
        </button>
      </section>

      {error ? <p className="result error">{error}</p> : null}

      <div className="workspaceGrid">
        <section className="panelBlock">
          <div className="marketTop">
            <h3>Setups</h3>
            <span>{setups.length} active</span>
          </div>
          <div className="stackList">
            {setups.map((setup) => (
              <button className={`historyRow ${selectedSetup?.id === setup.id ? "active" : ""}`} key={setup.id} onClick={() => setSelectedSetupId(setup.id)} type="button">
                <span>{setup.asset} · {setup.direction}</span>
                <strong>{setup.title}</strong>
                <small>{setup.status} · {new Date(setup.updatedAt).toLocaleString()}</small>
              </button>
            ))}
          </div>

          <form className="setupForm" onSubmit={createSetup}>
            <div className="formSectionTitle">New setup</div>
            <div className="paramGrid">
              <label>
                Title
                <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
              </label>
              <label>
                Asset
                <select value={form.asset} onChange={(event) => setForm({ ...form, asset: event.target.value })}>
                  <option>BTC</option>
                  <option>ETH</option>
                  {ASSET_OPTIONS.filter((option) => option.group === "Forex").map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Direction
                <select value={form.direction} onChange={(event) => setForm({ ...form, direction: event.target.value })}>
                  <option value="long">Long</option>
                  <option value="short">Short</option>
                  <option value="watch">Watch</option>
                </select>
              </label>
            </div>
            <fieldset className="checkboxPanel compactCheckboxPanel">
              <legend>Strategies</legend>
              <div>
                {STRATEGY_OPTIONS.map((strategy) => {
                  const checked = form.strategies.includes(strategy.value);
                  return (
                    <label className={checked ? "checked" : ""} key={strategy.value}>
                      <input
                        checked={checked}
                        onChange={() =>
                          setForm({
                            ...form,
                            strategies: checked
                              ? form.strategies.filter((value) => value !== strategy.value)
                              : [...form.strategies, strategy.value],
                          })
                        }
                        type="checkbox"
                      />
                      <span>{strategy.label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <div className="paramGrid">
              <label>
                Real-history backtest
                <select value={String(form.runBacktest)} onChange={(event) => setForm({ ...form, runBacktest: event.target.value === "true" })}>
                  <option value="true">Run before proposal</option>
                  <option value="false">Skip backtest</option>
                </select>
              </label>
              <label>
                History window
                <input
                  max={365}
                  min={5}
                  onChange={(event) => setForm({ ...form, backtestDays: Number(event.target.value) })}
                  type="number"
                  value={form.backtestDays}
                />
              </label>
            </div>
            <label className="textareaLabel">
              Thesis
              <textarea value={form.thesis} onChange={(event) => setForm({ ...form, thesis: event.target.value })} />
            </label>
            <label className="textareaLabel">
              Risk plan
              <textarea value={form.riskPlan} onChange={(event) => setForm({ ...form, riskPlan: event.target.value })} />
            </label>
            <button className="secondaryButton" disabled={busy} type="submit">
              Add Setup
            </button>
          </form>
        </section>

        <section className="panelBlock widePanel">
          <div className="marketTop">
            <div>
              <span>{selectedSetup ? `${selectedSetup.asset} · ${selectedSetup.direction}` : "No setup selected"}</span>
              <h3>{selectedSetup?.title ?? "Create a setup"}</h3>
            </div>
            {selectedSetup ? <span className="status status-queued">{selectedSetup.status}</span> : null}
          </div>
          {selectedSetup ? (
            <div className="setupSummaryGrid">
              <div>
                <span>Thesis</span>
                <p>{selectedSetup.thesis}</p>
              </div>
              <div>
                <span>Risk plan</span>
                <p>{selectedSetup.riskPlan}</p>
              </div>
              <div>
                <span>Strategies</span>
                <p>{setupStrategies(selectedSetup).map(formatStrategy).join(", ")}</p>
              </div>
              <div>
                <span>Backtest</span>
                <p>{setupBacktestEnabled(selectedSetup) ? `${setupBacktestDays(selectedSetup)} days of real history before proposal` : "Skipped for this setup"}</p>
              </div>
            </div>
          ) : null}

          <div className="marketTop">
            <h3>Agent chain runs</h3>
            <span>{chains.length} runs</span>
          </div>
          <div className="chainList">
            {chains.map((chain) => (
              <button className={`chainPill ${selectedChain?.id === chain.id ? "active" : ""}`} key={chain.id} onClick={() => apiFetch<AgentChain>(`/agent-chains/${chain.id}`).then(setSelectedChain)} type="button">
                <strong>{chain.title}</strong>
                <span className={`status status-${chain.status}`}>{chain.status}</span>
              </button>
            ))}
          </div>

          {selectedChain ? (
            <section className="chainTimeline">
              {(selectedChain.steps ?? []).map((step) => (
                <article className="chainStep" key={step.id}>
                  <div className="marketTop">
                    <div>
                      <span>Step {step.stepIndex} · {step.agentId}</span>
                      <h3>{step.title}</h3>
                    </div>
                    <span className={`status status-${step.status}`}>{step.status}</span>
                  </div>
                  {step.error ? <p className="result error">{step.error}</p> : null}
                  {step.result ? (
                    <>
                      <div className="resultActions">
                        <button className="secondaryButton" onClick={() => void saveStep(step)} type="button">
                          Save Step
                        </button>
                      </div>
                      <AgentResult agentId={step.agentId} result={step.result} />
                    </>
                  ) : null}
                </article>
              ))}
            </section>
          ) : (
            <p className="quiet">Run an agent chain to move a setup through event analysis, market data, risk, and strategy proposal.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function setupStrategies(setup: TradeSetup) {
  const stored = setup.metadata?.strategies;
  if (Array.isArray(stored) && stored.length) {
    return stored.map(String);
  }
  return isForex(setup.asset)
    ? ["trend_momentum_continuation", "london_session_breakout"]
    : ["market_favorite_90", "market_favorite_95"];
}

function formatStrategy(strategy: string) {
  return STRATEGY_OPTIONS.find((option) => option.value === strategy)?.label ?? strategy;
}

function isForex(asset: string) {
  return asset.includes("/");
}

function setupBacktestEnabled(setup: TradeSetup) {
  return setup.metadata?.runBacktest !== false;
}

function setupBacktestDays(setup: TradeSetup) {
  const days = Number(setup.metadata?.backtestDays ?? 90);
  return Number.isFinite(days) ? Math.max(5, Math.min(365, days)) : 90;
}
