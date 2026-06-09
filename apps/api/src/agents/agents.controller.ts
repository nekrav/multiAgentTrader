import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { AgentsService, AgentInvocationRequest } from "./agents.service";

@Controller("agents")
export class AgentsController {
  constructor(private readonly agents: AgentsService) {}

  @Get()
  listAgents() {
    return this.agents.listAgents();
  }

  @Get(":agentId/status")
  getStatus(@Param("agentId") agentId: string) {
    return this.agents.getStatus(agentId);
  }

  @Post(":agentId/invoke")
  invokeAgent(@Param("agentId") agentId: string, @Body() body: AgentInvocationRequest) {
    return this.agents.invoke(agentId, body);
  }
}
