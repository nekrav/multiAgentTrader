import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../auth/admin.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AgentsService, AgentInvocationRequest } from "./agents.service";

@Controller("agents")
@UseGuards(JwtAuthGuard, AdminGuard)
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
