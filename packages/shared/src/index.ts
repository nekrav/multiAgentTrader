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

export type RunStatus = "queued" | "running" | "succeeded" | "failed" | "refunded";

export interface CatalogItem {
  id: string;
  agentId: AgentId;
  agentName: string;
  agentDescription: string;
  task: string;
  displayName: string;
  description: string;
  creditCost: string;
  paramsSchema: Record<string, unknown>;
  endpointConfigured: boolean;
}

export interface CreditLedgerEntry {
  id: string;
  userId: string;
  amount: string;
  entryType: "grant" | "purchase" | "hold" | "hold_release" | "debit_settle" | "admin_adjust";
  runId: string | null;
  idempotencyKey: string;
  note: string | null;
  createdAt: string;
}

export interface AnalysisRun {
  id: string;
  userId: string;
  userEmail?: string;
  agentId: AgentId | string;
  task: string;
  payload: Record<string, unknown>;
  creditCost: string;
  status: RunStatus;
  result?: Record<string, unknown> | null;
  error: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface CreateRunRequest {
  agentId: AgentId | string;
  task: string;
  payload: Record<string, unknown>;
}

export interface CreateRunResponse {
  runId: string;
  status: RunStatus;
  creditCost: string;
  balance: string;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  role: "user" | "admin";
}
