import { TopNav } from "../top-nav";

type Alert = {
  id: string;
  market: string;
  type: string;
  severity: string;
  message: string;
  createdAt: string;
};

async function getAlerts(): Promise<Alert[]> {
  const apiUrl = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  try {
    const response = await fetch(`${apiUrl}/alerts`, { cache: "no-store" });
    return response.ok ? ((await response.json()) as Alert[]) : [];
  } catch {
    return [];
  }
}

export default async function AlertsPage() {
  const alerts = await getAlerts();

  return (
    <main className="shell intelligenceShell">
      <TopNav />
      <a className="backLink" href="/">Back to dashboard</a>
      <section className="sectionHeader">
        <div>
          <p className="eyebrow">Alerts</p>
          <h1>Consensus, Level, Event, And Risk Alerts</h1>
        </div>
      </section>
      <section className="dashboardColumns">
        <article className="panelBlock">
          <h3>Rule Templates</h3>
          <div className="eventList">
            <div className="eventItem">
              <span>Consensus</span>
              <strong>Notify when final confidence changes by 10%.</strong>
            </div>
            <div className="eventItem">
              <span>Levels</span>
              <strong>Notify when support or resistance breaks.</strong>
            </div>
            <div className="eventItem">
              <span>Risk</span>
              <strong>Notify when event risk moves to high-risk.</strong>
            </div>
          </div>
        </article>
        <article className="panelBlock widePanel">
          <h3>Alert History</h3>
          <div className="eventList">
            {alerts.map((alert) => (
              <div className={`eventItem severity-${alert.severity}`} key={alert.id}>
                <span>
                  {alert.market} · {alert.type.replaceAll("_", " ")}
                </span>
                <strong>{alert.message}</strong>
                <small>{new Date(alert.createdAt).toLocaleString()}</small>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
