import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import Redis from "ioredis";
import { Pool } from "pg";
import { AGENTS, AgentId } from "./agent-registry";
import { POSTGRES_POOL, REDIS_CLIENT } from "../database/database.module";

export interface AgentInvocationRequest {
  task: string;
  payload?: Record<string, unknown>;
}

@Injectable()
export class AgentsService {
  private readonly endpoints: Partial<Record<AgentId, string>>;

  constructor(
    @Inject(POSTGRES_POOL) private readonly postgres: Pool,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    this.endpoints = this.parseEndpoints(process.env.AGENT_ENDPOINTS_JSON);
  }

  listAgents() {
    return AGENTS.map((agent) => ({
      ...agent,
      endpointConfigured: Boolean(this.endpoints[agent.id]),
    }));
  }

  async getStatus(agentId: string) {
    const agent = this.requireAgent(agentId);
    const endpoint = this.endpoints[agent.id];
    if (!endpoint) {
      return { agentId: agent.id, status: "unconfigured", message: "No local endpoint configured." };
    }

    return this.callAgent(endpoint, "/status", { method: "GET" }, agent.id);
  }

  async invoke(agentId: string, request: AgentInvocationRequest) {
    const agent = this.requireAgent(agentId);
    const endpoint = this.endpoints[agent.id];
    if (!endpoint) {
      const response = {
        agentId: agent.id,
        status: "unavailable",
        result: {},
        message: "No local endpoint configured for this agent.",
      };
      await this.recordInvocation(agent.id, "unavailable", request, response);
      return response;
    }

    const response = await this.callAgent(
      endpoint,
      "/invoke",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      },
      agent.id,
    );
    await this.recordInvocation(agent.id, response.status, request, response);
    return response;
  }

  private requireAgent(agentId: string) {
    const agent = AGENTS.find((item) => item.id === agentId);
    if (!agent) {
      throw new NotFoundException(`Unknown agent: ${agentId}`);
    }
    return agent;
  }

  private parseEndpoints(raw?: string): Partial<Record<AgentId, string>> {
    if (!raw) {
      return {
        "market-data": "http://localhost:7001",
        "strategy-research": "http://localhost:7002",
        risk: "http://localhost:7003",
      };
    }
    try {
      return JSON.parse(raw) as Partial<Record<AgentId, string>>;
    } catch {
      return {};
    }
  }

  private async callAgent(endpoint: string, path: string, init: RequestInit, agentId: AgentId) {
    const url = `${endpoint.replace(/\/$/, "")}${path}`;
    try {
      const response = await fetch(url, init);
      const result = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      return {
        agentId,
        status: response.ok ? "ok" : "error",
        result,
      };
    } catch (error) {
      return {
        agentId,
        status: "unavailable",
        result: {},
        message: error instanceof Error ? error.message : "Agent request failed.",
      };
    }
  }

  private async recordInvocation(
    agentId: AgentId,
    status: string,
    request: AgentInvocationRequest,
    response: Record<string, unknown>,
  ) {
    await this.redis.set(`agent:${agentId}:last-status`, status, "EX", 3600).catch(() => undefined);
    await this.postgres
      .query(
        "insert into agent_invocations(agent_id, status, request, response) values ($1, $2, $3, $4)",
        [agentId, status, request, response],
      )
      .catch(() => undefined);
  }
}
