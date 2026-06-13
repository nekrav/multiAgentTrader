import { TopNav } from "../top-nav";

type AdminAgent = {
  id: string;
  name: string;
  health: string;
  latestRun: string;
};

type IngestionHealth = {
  candles: { status: string; lagSeconds: number | null };
  news: { status: string; lagSeconds: number | null };
  calendar: { status: string; lagSeconds: number | null };
  dependencies: { status: string; count: number };
};

async function getJson<T>(path: string, fallback: T): Promise<T> {
  const apiUrl = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  try {
    const response = await fetch(`${apiUrl}${path}`, { cache: "no-store" });
    return response.ok ? ((await response.json()) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default async function AdminPage() {
  const [agents, health, runs] = await Promise.all([
    getJson<AdminAgent[]>("/admin/agents", []),
    getJson<IngestionHealth | null>("/admin/ingestion-health", null),
    getJson<Array<{ id: string; market: string; agent: string; status: string; confidence: number }>>(
      "/admin/agent-runs",
      [],
    ),
  ]);

  return (
    <main className="shell intelligenceShell">
      <TopNav />
      <a className="backLink" href="/">Back to dashboard</a>
      <section className="sectionHeader">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Operations, Agents, And Ingestion Health</h1>
        </div>
      </section>

      <section className="dashboardColumns">
        <article className="panelBlock">
          <h3>Ingestion Health</h3>
          <div className="eventList">
            {health
              ? Object.entries(health).map(([name, value]) => (
                  <div className="eventItem" key={name}>
                    <span>{name}</span>
                    <strong>{value.status}</strong>
                    <small>{"count" in value ? `${value.count} configured dependencies` : `lag ${value.lagSeconds ?? "n/a"}s`}</small>
                  </div>
                ))
              : null}
          </div>
        </article>
        <article className="panelBlock widePanel">
          <h3>Agent Health</h3>
          <div className="agentOutputGrid compact">
            {agents.map((agent) => (
              <div className="agentOutput" key={agent.id}>
                <div className="marketTop">
                  <strong>{agent.name}</strong>
                  <span>{agent.health}</span>
                </div>
                <small>Latest run: {new Date(agent.latestRun).toLocaleString()}</small>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panelBlock">
        <h3>Recent Runs</h3>
        <div className="adminTable">
          {runs.slice(0, 12).map((run) => (
            <div key={run.id}>
              <span>{run.market}</span>
              <span>{run.agent}</span>
              <span>{run.status}</span>
              <strong>{Math.round(run.confidence * 100)}%</strong>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
