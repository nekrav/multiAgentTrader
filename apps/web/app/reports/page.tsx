import { TopNav } from "../top-nav";

type Report = {
  id: string;
  title: string;
  cadence: string;
  markets: string[];
  summary: string;
  createdAt: string;
};

async function getReports(): Promise<Report[]> {
  const apiUrl = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  try {
    const response = await fetch(`${apiUrl}/reports`, { cache: "no-store" });
    return response.ok ? ((await response.json()) as Report[]) : [];
  } catch {
    return [];
  }
}

export default async function ReportsPage() {
  const reports = await getReports();

  return (
    <main className="shell intelligenceShell">
      <TopNav />
      <a className="backLink" href="/">Back to dashboard</a>
      <section className="sectionHeader">
        <div>
          <p className="eyebrow">Reports</p>
          <h1>Daily And Intraday Intelligence</h1>
        </div>
      </section>
      <section className="reportGrid">
        {reports.map((report) => (
          <article className="reportCard" id={report.id} key={report.id}>
            <span>{report.cadence}</span>
            <h2>{report.title}</h2>
            <p>{report.summary}</p>
            <div className="tagRow">
              {report.markets.map((market) => (
                <a href={`/markets/${market}`} key={market}>
                  {market}
                </a>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
