import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import Ajv, { ErrorObject } from "ajv";
import { Pool } from "pg";
import { AGENTS } from "../agents/agent-registry";
import { AgentsService } from "../agents/agents.service";
import { POSTGRES_POOL } from "../database/database.module";

export interface CatalogPriceRow {
  id: string;
  agentId: string;
  task: string;
  displayName: string;
  description: string;
  creditCost: bigint;
  enabled: boolean;
  userInvocable: boolean;
  paramsSchema: Record<string, unknown>;
}

function toCatalogPrice(row: Record<string, unknown>): CatalogPriceRow {
  return {
    id: String(row.id),
    agentId: String(row.agent_id),
    task: String(row.task),
    displayName: String(row.display_name),
    description: String(row.description ?? ""),
    creditCost: BigInt(String(row.credit_cost ?? 0)),
    enabled: Boolean(row.enabled),
    userInvocable: Boolean(row.user_invocable),
    paramsSchema: (row.params_schema as Record<string, unknown>) ?? {},
  };
}

function ajvMessage(errors: ErrorObject[] | null | undefined) {
  return errors?.map((error) => `${error.instancePath || "payload"} ${error.message}`).join("; ") ?? "Invalid payload.";
}

@Injectable()
export class CatalogService {
  private readonly ajv = new Ajv({ allErrors: true, strict: false });

  constructor(
    @Inject(POSTGRES_POOL) private readonly postgres: Pool,
    private readonly agents: AgentsService,
  ) {}

  async listPublicCatalog() {
    const configured = new Set<string>(this.agents.listAgents().filter((agent) => agent.endpointConfigured).map((agent) => agent.id));
    const result = await this.postgres.query(
      `select id, agent_id, task, display_name, description, credit_cost, enabled, user_invocable, params_schema
       from agent_task_prices
       where enabled = true and user_invocable = true and agent_id <> 'execution'
       order by credit_cost asc, display_name asc`,
    );
    return result.rows.map((row) => {
      const price = toCatalogPrice(row);
      const agent = AGENTS.find((item) => item.id === price.agentId);
      return {
        id: price.id,
        agentId: price.agentId,
        agentName: agent?.name ?? price.agentId,
        agentDescription: agent?.description ?? "",
        task: price.task,
        displayName: price.displayName,
        description: price.description,
        creditCost: price.creditCost.toString(),
        paramsSchema: price.paramsSchema,
        endpointConfigured: configured.has(price.agentId),
      };
    });
  }

  async requireRunnableTask(agentId: string, task: string) {
    if (agentId === "execution") {
      throw new ForbiddenException("Execution agent is not user-invocable.");
    }
    const result = await this.postgres.query(
      `select id, agent_id, task, display_name, description, credit_cost, enabled, user_invocable, params_schema
       from agent_task_prices
       where agent_id = $1 and task = $2 and enabled = true and user_invocable = true`,
      [agentId, task],
    );
    if (!result.rows[0]) {
      throw new NotFoundException("No enabled catalog task found for this agent/task.");
    }
    return toCatalogPrice(result.rows[0]);
  }

  validatePayload(price: CatalogPriceRow, payload: unknown) {
    const text = JSON.stringify(payload ?? {});
    if (Buffer.byteLength(text, "utf8") > 16 * 1024) {
      throw new BadRequestException("Payload exceeds the 16 KB limit.");
    }
    const schema = Object.keys(price.paramsSchema).length ? price.paramsSchema : {};
    const validate = this.ajv.compile(schema);
    if (!validate(payload ?? {})) {
      throw new BadRequestException(ajvMessage(validate.errors));
    }
  }

  async updateCatalogItem(id: string, input: { creditCost?: number; enabled?: boolean; description?: string }) {
    const result = await this.postgres.query(
      `update agent_task_prices
       set credit_cost = coalesce($2, credit_cost),
           enabled = coalesce($3, enabled),
           description = coalesce($4, description)
       where id = $1
       returning id, agent_id, task, display_name, description, credit_cost, enabled, user_invocable, params_schema`,
      [
        id,
        input.creditCost === undefined ? null : Math.max(0, Math.floor(input.creditCost)),
        input.enabled === undefined ? null : input.enabled,
        input.description === undefined ? null : input.description,
      ],
    );
    if (!result.rows[0]) {
      throw new NotFoundException("Catalog item not found.");
    }
    const item = toCatalogPrice(result.rows[0]);
    return { ...item, creditCost: item.creditCost.toString() };
  }
}
