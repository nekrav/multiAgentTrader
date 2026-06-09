export type AgentId =
  | "market-data"
  | "strategy-research"
  | "risk"
  | "execution"
  | "post-trade-review";

export interface AgentDescriptor {
  id: AgentId;
  name: string;
  description: string;
  canExecuteOrders: boolean;
}

export const AGENTS: AgentDescriptor[] = [
  {
    id: "market-data",
    name: "Market Data Agent",
    description: "Normalizes Polymarket CLOB, candles, price history, spread, liquidity, and volatility.",
    canExecuteOrders: false,
  },
  {
    id: "strategy-research",
    name: "Strategy Research Agent",
    description: "Runs Strategy Lab sweeps and proposes parameter changes with out-of-sample checks.",
    canExecuteOrders: false,
  },
  {
    id: "risk",
    name: "Risk Agent",
    description: "Vetoes bad volatility, liquidity, EV, spread, and recent-performance conditions.",
    canExecuteOrders: false,
  },
  {
    id: "execution",
    name: "Execution Agent",
    description: "Submits orders only after deterministic gates pass.",
    canExecuteOrders: true,
  },
  {
    id: "post-trade-review",
    name: "Post-Trade Review Agent",
    description: "Explains wins/losses and records lessons for strategy improvement.",
    canExecuteOrders: false,
  },
];
