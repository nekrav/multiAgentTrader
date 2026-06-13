import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../auth/admin.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RunsService } from "./runs.service";

@Controller()
export class RunsController {
  constructor(private readonly runs: RunsService) {}

  @Post("runs")
  @UseGuards(JwtAuthGuard)
  createRun(@CurrentUser() user: AuthUser, @Body() body: { agentId?: string; task?: string; payload?: Record<string, unknown> }) {
    this.runs.assertExecutionBlocked(String(body.agentId ?? ""));
    return this.runs.createRun(user, body);
  }

  @Get("runs")
  @UseGuards(JwtAuthGuard)
  listRuns(@CurrentUser() user: AuthUser, @Query("limit") limit?: string, @Query("before") before?: string) {
    return this.runs.listRuns(user, limit ? Number(limit) : 25, before);
  }

  @Get("runs/:id")
  @UseGuards(JwtAuthGuard)
  getRun(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.runs.getRun(user, id);
  }

  @Get("saved-analyses")
  @UseGuards(JwtAuthGuard)
  listSavedAnalyses(@CurrentUser() user: AuthUser, @Query("limit") limit?: string) {
    return this.runs.listSavedAnalyses(user, limit ? Number(limit) : 50);
  }

  @Post("saved-analyses")
  @UseGuards(JwtAuthGuard)
  saveAnalysis(
    @CurrentUser() user: AuthUser,
    @Body() body: { runId?: string; title?: string; notes?: string; tags?: string[]; setupId?: string | null },
  ) {
    return this.runs.saveAnalysis(user, body);
  }

  @Get("trade-setups")
  @UseGuards(JwtAuthGuard)
  listTradeSetups(@CurrentUser() user: AuthUser, @Query("limit") limit?: string) {
    return this.runs.listTradeSetups(user, limit ? Number(limit) : 50);
  }

  @Post("trade-setups")
  @UseGuards(JwtAuthGuard)
  createTradeSetup(
    @CurrentUser() user: AuthUser,
    @Body()
    body: { title?: string; asset?: string; direction?: string; thesis?: string; riskPlan?: string; status?: "draft" | "watching" | "ready" | "archived"; metadata?: Record<string, unknown> },
  ) {
    return this.runs.createTradeSetup(user, body);
  }

  @Post("trade-setups/:id")
  @UseGuards(JwtAuthGuard)
  updateTradeSetup(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body()
    body: Partial<{ title: string; asset: string; direction: string; thesis: string; riskPlan: string; status: "draft" | "watching" | "ready" | "archived"; metadata: Record<string, unknown> }>,
  ) {
    return this.runs.updateTradeSetup(user, id, body);
  }

  @Get("agent-chains")
  @UseGuards(JwtAuthGuard)
  listAgentChains(@CurrentUser() user: AuthUser, @Query("limit") limit?: string) {
    return this.runs.listAgentChains(user, limit ? Number(limit) : 25);
  }

  @Post("agent-chains")
  @UseGuards(JwtAuthGuard)
  createAgentChain(
    @CurrentUser() user: AuthUser,
    @Body() body: { setupId?: string; title?: string; asset?: string; direction?: string; eventTitle?: string; riskProfile?: string; strategies?: string[]; runBacktest?: boolean; backtestDays?: number },
  ) {
    return this.runs.createAgentChain(user, body);
  }

  @Get("agent-chains/:id")
  @UseGuards(JwtAuthGuard)
  getAgentChain(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.runs.getAgentChain(user, id);
  }

  @Get("admin/runs")
  @UseGuards(JwtAuthGuard, AdminGuard)
  listAdminRuns(@Query("limit") limit?: string) {
    return this.runs.listAdminRuns(limit ? Number(limit) : 50);
  }
}
