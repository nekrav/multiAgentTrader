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

export interface AgentInvocationRequest {
  task: string;
  payload?: Record<string, unknown>;
}

export interface AgentInvocationResponse {
  agentId: AgentId;
  status: "ok" | "unavailable" | "error";
  result: Record<string, unknown>;
  message?: string;
}
