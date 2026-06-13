"use client";

import { useEffect, useState } from "react";
import { AgentResult } from "../agents-dashboard";
import { apiFetch } from "../lib/api";

type SavedAnalysis = {
  id: string;
  runId: string;
  setupId: string | null;
  title: string;
  notes: string;
  tags: string[];
  createdAt: string;
  run: {
    agentId: string;
    task: string;
    status: string;
    result: Record<string, unknown> | null;
    error: string | null;
    createdAt: string;
    finishedAt: string | null;
  };
};

export function SavedAnalysesClient() {
  const [items, setItems] = useState<SavedAnalysis[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void apiFetch<SavedAnalysis[]>("/saved-analyses")
      .then((next) => {
        setItems(next);
        setSelectedId(next[0]?.id ?? "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load saved analyses."));
  }, []);

  const selected = items.find((item) => item.id === selectedId) ?? items[0];

  return (
    <div className="workspacePage">
      <section className="sectionHeader compactHeader">
        <div>
          <p className="eyebrow">Saved analyses</p>
          <h1>Analysis History</h1>
        </div>
        <a className="secondaryButton linkButton" href="/run">
          Run New Analysis
        </a>
      </section>

      {error ? <p className="result error">{error}</p> : null}

      <div className="workspaceGrid">
        <section className="panelBlock">
          <div className="marketTop">
            <h3>Saved runs</h3>
            <span>{items.length} saved</span>
          </div>
          <div className="stackList">
            {items.map((item) => (
              <button className={`historyRow ${selected?.id === item.id ? "active" : ""}`} key={item.id} onClick={() => setSelectedId(item.id)} type="button">
                <span>{item.run.agentId}</span>
                <strong>{item.title}</strong>
                <small>
                  {item.run.task} · {new Date(item.createdAt).toLocaleString()}
                </small>
              </button>
            ))}
            {!items.length ? <p className="quiet">No saved analyses yet. Save a completed run from Run Analysis.</p> : null}
          </div>
        </section>

        <section className="panelBlock widePanel">
          {selected ? (
            <>
              <div className="marketTop">
                <div>
                  <span>{selected.run.agentId}</span>
                  <h3>{selected.title}</h3>
                </div>
                <span className={`status status-${selected.run.status}`}>{selected.run.status}</span>
              </div>
              <div className="tagRow">
                {selected.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              {selected.notes ? <p>{selected.notes}</p> : null}
              {selected.run.error ? <p className="result error">{selected.run.error}</p> : null}
              {selected.run.result ? <AgentResult agentId={selected.run.agentId} result={selected.run.result} /> : null}
            </>
          ) : (
            <p className="quiet">Select a saved analysis to review its result.</p>
          )}
        </section>
      </div>
    </div>
  );
}
