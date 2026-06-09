type Agent = {
  id: string;
  name: string;
  description: string;
  canExecuteOrders: boolean;
  endpointConfigured: boolean;
};

async function getAgents(): Promise<Agent[]> {
  const apiUrl = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  try {
    const response = await fetch(`${apiUrl}/agents`, { cache: "no-store" });
    if (!response.ok) {
      return [];
    }
    return (await response.json()) as Agent[];
  } catch {
    return [];
  }
}

export default async function Home() {
  const agents = await getAgents();

  return (
    <main className="shell">
      <section className="toolbar">
        <div>
          <p className="eyebrow">AiTraders</p>
          <h1>Multi-Agent Trading Analytics</h1>
        </div>
        <a className="apiLink" href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/health`}>
          API health
        </a>
      </section>

      <section className="grid">
        {agents.length === 0 ? (
          <div className="empty">
            <h2>API not connected</h2>
            <p>Start the NestJS API on port 4000 or run the full Docker Compose stack.</p>
          </div>
        ) : (
          agents.map((agent) => (
            <article className="agent" key={agent.id}>
              <div className="agentTop">
                <h2>{agent.name}</h2>
                <span className={agent.endpointConfigured ? "status on" : "status off"}>
                  {agent.endpointConfigured ? "Connected" : "Unconfigured"}
                </span>
              </div>
              <p>{agent.description}</p>
              <div className="meta">
                <span>{agent.id}</span>
                <span>{agent.canExecuteOrders ? "Execution gated" : "No order authority"}</span>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
