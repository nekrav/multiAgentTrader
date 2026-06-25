# AiTraders UI Development Brief for Claude / AI Agents

This document gives an AI coding agent enough product, system, and UX context to improve the AiTraders web UI without first reverse-engineering the whole app.

## Mission

AiTraders is a multi-agent trading intelligence platform. It helps traders answer one core question:

> “What should I watch, avoid, or prepare to trade — and why?”

The UI should feel modern, calm, beginner-friendly, and useful. Avoid making it look like a raw terminal or dense pro-only trading cockpit. The product can show advanced data, but it must explain what matters in plain language.

## Repository

- Repo path: `/Users/vlad/Documents/AppDev/multiAgentTrader`
- App names used by the user: `AiTraders`, `multiAgentTrader`, “multi trader agents app”
- Package manager: `npm` workspaces
- Main web app: `apps/web` — Next.js App Router on port `3000`
- Main API: `apps/api` — NestJS on port `4000`
- Shared types: `packages/shared`
- Python agents: `agents/*`
- Infra: Docker Compose with Postgres and Redis

## Default local commands

From repo root:

```bash
npm install
npm run build --workspace @aitraders/web
npm run build --workspace @aitraders/api
docker compose up --build -d
```

Health checks:

```bash
curl -fsS http://localhost:4000/health
curl -fsS -I http://localhost:3000 | head -n 1
curl -fsS http://localhost:4000/admin/ingestion-health
```

Agent status checks:

```bash
for p in 7001 7002 7003 7004 7005 7006; do
  echo "--agent $p"
  curl -fsS "http://127.0.0.1:${p}/status" | head -c 220
  echo
done
```

## What the system does

AiTraders combines market data, research, risk scoring, trade setup management, backtesting, saved analysis, and agent-chain runs.

Core product loop:

1. User scans markets.
2. System highlights strongest opportunities, risks, conflicts, and news/events.
3. User opens a market or creates a trade setup.
4. User runs one or more agents.
5. System returns a readable analysis with risk warnings, rationale, and next steps.
6. User saves the analysis or turns it into a setup/watch item.

## Important safety model

The agents may:

- research
- summarize
- explain
- rank
- warn
- propose
- veto
- backtest
- review trades

The agents must not bypass deterministic risk/execution gates. Live order placement, if ever surfaced in UI, must be visually and technically separated from agent suggestions.

Design implication: the UI should say “suggested,” “watch,” “avoid,” “risk warning,” “needs confirmation,” not “guaranteed” or “auto-trade.”

## Main users

### Primary user: beginner-to-intermediate trader

Needs:

- plain English explanations
- clear “what should I do next?” guidance
- strong warnings when risk is high
- less jargon by default
- confidence/risk signals that are easy to read
- ability to drill into technical details only when wanted

### Secondary user: technical trader

Needs:

- raw signals and agent outputs
- strategy metrics
- candles/charts
- backtesting details
- agent-chain traceability
- saved analysis history

The app already has a design-mode toggle:

- `Technical`
- `Beginner`

Keep this concept. Use it to decide whether copy and density should be simpler or more technical.

## Existing UI structure

Main navigation lives in:

- `apps/web/app/top-nav.tsx`

Current nav groups:

- Dashboard
- Markets
  - Forex
  - Crypto
  - Stocks
  - Futures & Options
  - Cross-Market
- Strategy
  - Decision Support
  - Playbook
  - Reports
- Operations
  - Run Analysis
  - Backtesting
  - Trade Setups
  - Saved Analyses
  - Alerts
  - Admin
- Help
  - Tutorial
  - FAQ

Main routes/pages:

- `/` — dashboard, live market intelligence, watchlist, recommendations
- `/forex`, `/crypto`, `/stocks`, `/derivatives`, `/cross-market` — market category pages
- `/markets/[symbol]` — individual market detail
- `/decision-support` — decision guidance
- `/strategies` — strategy playbook
- `/reports` — reports
- `/run` — run agent analysis
- `/backtesting` — strategy backtesting
- `/setups` — trade setup workspace
- `/history` — saved analyses
- `/alerts` — alerts
- `/account` — account and subscription info
- `/login`, `/register` — auth screens
- `/admin` — admin dashboard
- `/tutorial`, `/faq` — education/help
- `/pricing-sources` — market data provenance

## Current frontend files that matter most

- `apps/web/app/page.tsx`
  - Main dashboard server component.
  - Fetches `/dashboard`, `/catalog`, and candle data.
  - Contains many dashboard subcomponents.

- `apps/web/app/live-home-dashboard.tsx`
  - Live dashboard client behavior.

- `apps/web/app/terminal-chart-panel-client.tsx`
  - Chart panel.

- `apps/web/app/signal-carousel.tsx`
  - Signal carousel / recommendation presentation.

- `apps/web/app/dashboard-workspace-menu.tsx`
  - Collapsible dashboard workspace navigation.

- `apps/web/app/run/run-console.tsx`
  - Agent run interface.

- `apps/web/app/setups/trade-setups-client.tsx`
  - Trade setup workspace.

- `apps/web/app/history/saved-analyses-client.tsx`
  - Saved analyses.

- `apps/web/app/login/login-form.tsx`
  - Login/register form logic.

- `apps/web/app/auth-provider.tsx`
  - Client auth context.

- `apps/web/app/styles.css`
  - Global design system and most UI styling.

## Current API endpoints relevant to UI

Base URL defaults:

- Browser/public: `NEXT_PUBLIC_API_URL` or `http://localhost:4000`
- Server/internal: `API_INTERNAL_URL` or public API URL

Public/intelligence endpoints:

- `GET /health`
- `GET /dashboard`
- `GET /markets`
- `GET /markets/:symbol`
- `GET /markets/:symbol/candles`
- `GET /markets/:symbol/agents`
- `GET /markets/:symbol/consensus`
- `GET /reports`
- `GET /reports/:id`
- `GET /alerts`
- `POST /alerts`
- `PATCH /alerts/:id`
- `DELETE /alerts/:id`
- `GET /catalog`
- `GET /plans`
- `GET /admin/ingestion-health`

Auth endpoints:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

Authenticated user workflow endpoints:

- `POST /runs`
- `GET /runs`
- `GET /runs/:id`
- `GET /saved-analyses`
- `POST /saved-analyses`
- `GET /trade-setups`
- `POST /trade-setups`
- `POST /trade-setups/:id`
- `GET /agent-chains`
- `POST /agent-chains`
- `GET /agent-chains/:id`

Agent endpoints through API:

- `GET /agents`
- `GET /agents/:agentId/status`
- `POST /agents/:agentId/invoke`

## Authentication model

The app uses HttpOnly cookie auth:

- `auth-token` cookie
- `refresh-token` cookie
- DB-backed refresh sessions
- frontend requests should include `credentials: "include"`
- frontend API helper retries through `/auth/refresh` on `401`

Do not reintroduce localStorage JWT auth.

## Current known product direction from Vlad

Use these as hard UX preferences:

- Beginner-friendly over terminal-like.
- Modern and clear, not dense just for density’s sake.
- Collapsed workspace sidebars should have clear icon-only items with hover/title labels.
- Keep public source/reference links removed from user-facing pages unless explicitly requested.
- Auth buttons should have consistent form and border radius.
- UI changes should be verified end-to-end when possible.

## UX north star

The UI should feel like a friendly trading decision assistant, not a Bloomberg clone.

Good mental model:

- “AI-assisted trading control room for humans.”
- “Signal scanner + risk coach + research notebook.”
- “Shows what matters now, then lets users drill down.”

Avoid:

- wall-of-cards dashboard with equal visual weight everywhere
- terminal-green-on-black gimmick styling
- tiny labels that only expert traders understand
- unlabeled icon-only navigation
- overuse of cyan/green accent colors
- raw JSON as a primary UI
- hiding warnings in small text

## Recommended UI architecture

### 1. Dashboard should answer 3 questions fast

Top of `/` should clearly answer:

1. What is the best current opportunity?
2. What is too risky or conflicted?
3. What should I watch next?

Suggested layout:

- Hero summary card:
  - “Best setup right now”
  - market, direction, confidence, risk, reason
  - buttons: View Market, Run Analysis, Save Setup

- Risk strip:
  - High-risk count
  - Conflict count
  - Major events/news count
  - Stale data/source warning if any

- Watchlist / opportunities:
  - ranked list with simple states: Trade Setup, Watch, Avoid

- Drill-down sections below:
  - charts
  - agent consensus
  - market categories
  - reports
  - strategy performance

### 2. Use beginner copy by default

Examples:

- Instead of `bearish bias / invalidation`, show:
  - “Leaning down. This idea is wrong if price breaks above X.”

- Instead of `risk veto`, show:
  - “Do not trade yet: volatility is too high.”

- Instead of `agreement score`, show:
  - “Agents mostly agree” or “Agents disagree.”

Technical mode can show the raw terms next to the human explanation.

### 3. Use clear status language

Recommended labels:

- `Trade setup` — potential action, still needs user confirmation
- `Watch` — not ready, monitor
- `Avoid` — risk or conflict too high
- `Needs confirmation` — signal exists but missing evidence
- `High risk` — user should slow down
- `Data stale` — do not trust as live
- `Agent disagreement` — confidence reduced

### 4. Make risk visually dominant

Risk warnings should be more prominent than opportunity hype.

Use:

- red/amber risk bands
- plain-language warning summary
- “why this could fail” bullets
- invalidation level
- event/news risk
- source freshness

Never bury risk in hover text only.

### 5. Give every card one job

A card should have one primary purpose:

- recommend
- warn
- explain
- compare
- launch action
- show history

Avoid cards that mix charts, copy, action buttons, alerts, reports, and explanations all together.

### 6. Progressive disclosure

Surface beginner summary first. Let technical users expand.

Pattern:

```text
Summary: “Watch EUR/USD. Agents disagree and CPI is near.”
Details: confidence, agreement score, invalidation, candle stats, raw agent output.
```

### 7. Clear action buttons

Primary actions:

- Run Analysis
- Save Setup
- View Market
- Create Alert
- Backtest Strategy

Secondary actions:

- View Details
- Open Report
- See Source
- Edit Setup

Do not put more than 2–3 actions in one card.

## Design system direction

### Visual style

Modern, clean, slightly premium SaaS/trading style.

Recommended look:

- layered cards
- soft but clear borders
- strong spacing hierarchy
- readable type sizes
- calm dark mode
- good light mode parity
- accent colors used sparingly

### Colors

Keep semantic colors consistent:

- Blue: primary/navigation/action
- Green: positive/up/healthy/pass
- Amber/yellow: caution/watch/medium risk
- Red: danger/high risk/veto/down
- Gray: inactive/secondary/system copy

Avoid making every important thing green. In trading UIs, green can imply profit/up/pass; reserve it for that.

### Typography

- Prefer readable UI font sizing over tiny dense labels.
- Use mono fonts only for prices, tickers, IDs, timestamps, and exact numeric metrics.
- Avoid all-caps everywhere.
- Headings should explain the section, not just label it.

### Layout

- Desktop: use a left workspace rail + main content + optional right detail/risk rail where useful.
- Mobile: single-column, action-first, no horizontal overflow.
- Cards should collapse gracefully.
- Keep `min-width: 0` in flex/grid children to avoid overflow.

### Accessibility

- Use actual buttons for actions and anchors for navigation.
- Preserve visible focus states.
- Do not rely on color alone for risk or direction.
- Add clear text labels to icons or accessible names.
- Keep hover behavior on full button/card targets, not just text.

## Data model summary for designers

Dashboard market objects include fields like:

- `symbol`
- `label`
- `assetClass`
- `price`
- `changePct`
- `bias`: bullish/bearish/neutral
- `confidence`
- `regime`
- `risk`
- `summary`
- `consensus.finalBias`
- `consensus.finalConfidence`
- `consensus.agreementScore`
- `consensus.invalidation`
- `dependency.confirmationScore`
- `dependency.conflictScore`
- `dependency.summary`

Dashboard also includes:

- `watchlist`
- `strongestBullish`
- `strongestBearish`
- `conflicts`
- `events`
- `alerts`
- `reports`
- `plans`

Trade setup objects include:

- title
- asset
- direction
- thesis
- risk plan
- status: draft / watching / ready / archived
- metadata

Agent-chain creation can include:

- setup id
- title
- asset
- direction
- event title
- risk profile
- strategies
- backtest options

## Suggested redesign priorities

### Priority 1 — Dashboard clarity

Goal: make `/` immediately understandable.

Tasks:

- Create a clear top “Best current setup / Watch / Avoid” region.
- Reduce equal-weight card clutter.
- Group dashboard sections by user intent.
- Ensure the page works in both Beginner and Technical modes.

### Priority 2 — Trade setup workflow

Goal: users can save and manage ideas without feeling lost.

Tasks:

- Make `/setups` feel like a trading notebook.
- Status lanes: Draft, Watching, Ready, Archived.
- Add clear empty states.
- Make “Run analysis on this setup” obvious.

### Priority 3 — Run Analysis flow

Goal: agent execution should feel guided, not like a raw API console.

Tasks:

- Replace raw form feeling with guided steps:
  1. Pick market/setup
  2. Pick analysis type
  3. Choose risk/backtest options
  4. Run
  5. Save result
- Show cost/credits clearly where relevant.
- Show progress and result summary before raw detail.

### Priority 4 — Saved analysis/history

Goal: saved analyses should be useful later.

Tasks:

- Filter by market, date, setup, tag, status.
- Show short summary and original decision.
- Link back to related setup or market.

### Priority 5 — Auth/account polish

Goal: onboarding should feel trustworthy.

Tasks:

- Keep login/register simple.
- Consistent buttons and focus states.
- Explain credits in plain language.
- Make account/subscription screens clear.

## Component patterns to use

### Recommendation card

Should include:

- market ticker + readable name
- action state: Trade Setup / Watch / Avoid
- direction/bias
- confidence
- risk level
- one-sentence reason
- invalidation
- primary CTA

### Risk card

Should include:

- severity
- why it matters
- what would reduce risk
- affected markets
- timestamp/source freshness

### Agent consensus card

Should include:

- which agents agree/disagree
- final consensus
- confidence
- top reason
- expandable technical details

### Trade setup card

Should include:

- setup title
- asset/direction
- current status
- thesis summary
- risk plan summary
- last analysis date
- CTA: Run Analysis / Edit / Archive

## Copywriting rules

Use plain, decisive text.

Good:

- “Watch, but do not enter yet.”
- “Agents disagree. Confidence reduced.”
- “High volatility: use smaller size or wait.”
- “This setup fails if price breaks below 1.0820.”

Bad:

- “Leverage multi-agent synergy to unlock robust alpha.”
- “This market is experiencing dynamic cross-market conditions.”
- “Proceed with caution” without saying why.

## Development rules for AI agents

Before editing:

1. Confirm you are in `/Users/vlad/Documents/AppDev/multiAgentTrader`.
2. Inspect the exact page/component you will edit.
3. Check `apps/web/app/styles.css` for existing tokens/classes before adding new style systems.
4. Preserve unrelated dirty files.
5. If changing real TypeScript symbols, use GitNexus impact analysis if available in the environment.

When editing UI:

- Prefer improving existing components over creating duplicate copies.
- Keep server/client boundaries correct for Next App Router.
- Use `"use client"` only where hooks/browser APIs are needed.
- Keep API calls using existing helpers and cookie auth patterns.
- Do not re-add localStorage JWT auth.
- Do not introduce a new styling framework unless explicitly requested.
- Preserve both light and dark theme behavior.
- Preserve Beginner/Technical design-mode behavior.

After editing:

```bash
npm run build --workspace @aitraders/web
```

If API types/routes changed:

```bash
npm run build --workspace @aitraders/api
```

For live stack changes:

```bash
docker compose up -d --build
curl -fsS http://localhost:4000/health
curl -fsS -I http://localhost:3000 | head -n 1
```

## What “good” looks like

A successful UI pass should make the app easier to understand in 10 seconds:

- User sees best opportunity, biggest risk, and next action.
- Beginner mode reads like a coach.
- Technical mode preserves expert detail.
- Risk warnings are obvious.
- Buttons are consistent and have full-target hover/focus states.
- Navigation is understandable.
- The app feels like a polished product, not an internal prototype.

## Prompt to give Claude or another AI

Use this prompt after attaching or linking this document:

```text
You are improving the AiTraders / multiAgentTrader web UI.
Read docs/AI_UI_DEVELOPMENT_BRIEF.md first and follow it as product context.
Work in /Users/vlad/Documents/AppDev/multiAgentTrader.
Focus on a modern, beginner-friendly, polished trading decision UI.
Do not make it terminal-like.
Preserve existing Next.js App Router structure, cookie auth, light/dark theme, and Beginner/Technical design mode.
Before changing a page, inspect its component and apps/web/app/styles.css.
After changes, run npm run build --workspace @aitraders/web and report concise results.
```
