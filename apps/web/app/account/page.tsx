import { TopNav } from "../top-nav";

type Subscription = {
  plan: string;
  status: string;
  trialEndsAt: string;
  activeAgents: number;
  marketLimit: number;
  features: string[];
};

async function getSubscription(): Promise<Subscription | null> {
  const apiUrl = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  try {
    const response = await fetch(`${apiUrl}/account/subscription`, { cache: "no-store" });
    return response.ok ? ((await response.json()) as Subscription) : null;
  } catch {
    return null;
  }
}

export default async function AccountPage() {
  const subscription = await getSubscription();

  return (
    <main className="shell intelligenceShell">
      <TopNav />
      <a className="backLink" href="/">Back to dashboard</a>
      <section className="sectionHeader">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Billing And Feature Access</h1>
        </div>
      </section>
      <section className="dashboardColumns">
        <article className="panelBlock">
          <h3>Current Plan</h3>
          <div className="metricTile large">
            <span>{subscription?.status ?? "unavailable"}</span>
            <strong>{subscription?.plan ?? "No plan"}</strong>
          </div>
          <p>
            Trial ends{" "}
            {subscription?.trialEndsAt ? new Date(subscription.trialEndsAt).toLocaleDateString() : "when billing is configured"}.
          </p>
        </article>
        <article className="panelBlock">
          <h3>Active Access</h3>
          <div className="levelGrid">
            <div>
              <span>Agents</span>
              <strong>{subscription?.activeAgents ?? 0}</strong>
            </div>
            <div>
              <span>Markets</span>
              <strong>{subscription?.marketLimit ?? 0}</strong>
            </div>
          </div>
        </article>
        <article className="panelBlock">
          <h3>Enabled Features</h3>
          <ul className="featureList">
            {subscription?.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
