import { TopNav } from "../top-nav";

const tutorialSteps = [
  {
    title: "Start from the dashboard",
    image: "/tutorial/dashboard-overview.png",
    alt: "AiTraders dashboard with live market desk and grouped trading workspace cards.",
    copy:
      "Use the dashboard as the command center. The live trade desk shows current market bias, confidence, risk, alerts, events, and grouped cards that open the focused pages.",
    actions: ["Check the primary trade setup first.", "Open a grouped workspace when you need deeper detail.", "Use Alerts and Reports for follow-up work."],
  },
  {
    title: "Use Decision Support before trusting a setup",
    image: "/tutorial/decision-support-phases.png",
    alt: "Decision Support page with phase cards, market opportunity scanner, and trade decision panels.",
    copy:
      "Decision Support is the pre-trade review page. Phase 1 ranks markets and compares strategies, Phase 2 checks timing and events, Phase 3 checks exposure overlap, and Phase 4 checks execution readiness.",
    actions: ["Click a phase card to jump to that section.", "Start with the Market Opportunity Scanner.", "Review the trade ticket and readiness checklist before acting."],
  },
  {
    title: "Run a focused agent analysis",
    image: "/tutorial/run-analysis-workbench.png",
    alt: "Run Analysis workbench with task selector, guided controls, and advanced JSON payload drawer.",
    copy:
      "Run Analysis lets you choose a task, fill out guided inputs, and execute a deterministic agent workflow. Use this when you want a market snapshot, risk evaluation, strategy proposal, strategy sweep, or event study.",
    actions: ["Select the task on the left.", "Use presets and dropdowns before editing JSON.", "Read the formatted result, then open raw JSON only when needed."],
  },
];

export default function TutorialPage() {
  return (
    <main className="shell helpShell" id="main-content">
      <TopNav />

      <section className="helpHero">
        <div>
          <p className="eyebrow">Tutorial</p>
          <h1>How to use AiTraders without getting lost</h1>
          <p>
            Follow this workflow: scan the dashboard, validate the setup in Decision Support, then run a focused agent
            analysis when you need a deeper answer.
          </p>
        </div>
        <aside className="helpHeroCard">
          <span>Recommended flow</span>
          <strong>Dashboard {">"} Decision Support {">"} Run Analysis</strong>
          <p>Use the pages in that order for cleaner pre-trade decisions.</p>
        </aside>
      </section>

      <section className="tutorialSteps" aria-label="AiTraders tutorial steps">
        {tutorialSteps.map((step, index) => (
          <article className="tutorialStep" key={step.title}>
            <div className="tutorialStepCopy">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h2>{step.title}</h2>
              <p>{step.copy}</p>
              <ul>
                {step.actions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </div>
            <figure className="tutorialScreenshot">
              <img src={step.image} alt={step.alt} />
              <figcaption>{step.title}</figcaption>
            </figure>
          </article>
        ))}
      </section>

      <section className="helpNextPanel">
        <div>
          <p className="eyebrow">Next step</p>
          <h2>Try an Event Study Analysis</h2>
          <p>
            The newest agent compares a current macro, earnings, or crypto event with similar historical event templates,
            then returns cross-market impact, trade guidance, and risk controls.
          </p>
        </div>
        <a className="backLink" href="/run">
          Open Run Analysis
        </a>
      </section>
    </main>
  );
}
