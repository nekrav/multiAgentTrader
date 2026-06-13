import { TopNav } from "../top-nav";

const faqGroups = [
  {
    title: "Getting started",
    items: [
      {
        question: "What should I open first?",
        answer:
          "Start on the dashboard. It gives you the live trade desk, grouped workspaces, market bias, alerts, event context, and quick links to the deeper pages.",
      },
      {
        question: "What is Decision Support for?",
        answer:
          "Decision Support is the pre-trade review area. It ranks markets, builds trade tickets, compares strategies, checks news timing, checks portfolio overlap, and reviews execution readiness.",
      },
      {
        question: "What is Run Analysis for?",
        answer:
          "Run Analysis is the guided agent workbench. Use it when you want to run a specific task like Market Snapshot, Risk Evaluation, Strategy Proposal, Strategy Sweep, or Event Study Analysis.",
      },
    ],
  },
  {
    title: "Agents and analysis",
    items: [
      {
        question: "What does the Event Analysis Agent do?",
        answer:
          "It takes a current macro, earnings, or crypto event, compares it with similar historical event templates, scores the closest matches, and returns likely forex, stock, and crypto impact with risk controls.",
      },
      {
        question: "Are the agents allowed to execute trades?",
        answer:
          "No. The current agents are advisory or gated. They can propose, analyze, compare, veto, and review, but execution remains deterministic and must stay behind safety checks.",
      },
      {
        question: "Why are there multiple agents instead of one agent?",
        answer:
          "Specialized agents are easier to verify. Market data, event analysis, risk, strategy research, execution readiness, and post-trade review each have a different job and can be checked independently.",
      },
      {
        question: "How should I read an Event Study result?",
        answer:
          "Read the summary first, then check the closest comparable event, cross-asset impact, preferred action, and risk controls. Treat weak similarity or high event risk as a reason to wait or reduce size.",
      },
    ],
  },
  {
    title: "Trading workflow",
    items: [
      {
        question: "What is the safest workflow before considering a trade?",
        answer:
          "Use Dashboard to find the setup, Decision Support to compare and check timing, Run Analysis for a deeper agent task, then review risk controls before doing anything outside the app.",
      },
      {
        question: "What do the buy and sell colors mean?",
        answer:
          "Buy readiness cards use green and sell readiness cards use red. The readiness status still matters, but the main visual direction now follows the trade side.",
      },
      {
        question: "When should I avoid a setup?",
        answer:
          "Avoid or wait when event risk is high, spreads are wide, liquidity is thin, strategies disagree, correlation exposure is duplicated, or the readiness checklist says Wait.",
      },
      {
        question: "What is a trade ticket?",
        answer:
          "A trade ticket summarizes the proposed side, entry zone, stop, targets, risk/reward, position risk note, and invalidation condition so the setup can be reviewed quickly.",
      },
    ],
  },
  {
    title: "Data, credits, and limits",
    items: [
      {
        question: "Why do some pages show estimates?",
        answer:
          "Some decision-support panels use the current dashboard feed and deterministic estimates rather than broker-grade live execution data. They are useful for review, not final order routing.",
      },
      {
        question: "What are credits used for?",
        answer:
          "Credits price agent tasks in the catalog. Lightweight tasks cost fewer credits, while heavier analysis like strategy sweeps or event studies costs more.",
      },
      {
        question: "Can I edit the raw JSON payload?",
        answer:
          "Yes. Run Analysis keeps advanced JSON available for custom inputs, but the guided controls should cover the common workflow first.",
      },
      {
        question: "Is this financial advice?",
        answer:
          "No. The application is a decision-support and research tool. It does not replace your own judgment, risk controls, or broker-side execution checks.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <main className="shell helpShell" id="main-content">
      <TopNav />

      <section className="helpHero faqHero">
        <div>
          <p className="eyebrow">FAQ</p>
          <h1>Answers for using AiTraders day to day</h1>
          <p>
            Quick explanations for the dashboard, decision-support phases, analysis agents, trade tickets, event studies,
            credits, and safety boundaries.
          </p>
        </div>
        <a className="helpHeroCard faqTutorialLink" href="/tutorial">
          <span>Need the walkthrough?</span>
          <strong>Open the screenshot tutorial</strong>
          <p>Use the tutorial when you want to see the workflow page by page.</p>
        </a>
      </section>

      <section className="faqGrid" aria-label="Frequently asked questions">
        {faqGroups.map((group) => (
          <article className="faqGroup" key={group.title}>
            <h2>{group.title}</h2>
            <div className="faqList">
              {group.items.map((item) => (
                <details className="faqItem" key={item.question}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
