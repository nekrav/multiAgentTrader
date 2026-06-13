import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { IntelligenceService } from "./intelligence.service";

@Controller()
export class IntelligenceController {
  constructor(private readonly intelligence: IntelligenceService) {}

  @Get("markets")
  getMarkets() {
    return this.intelligence.getMarkets();
  }

  @Get("plans")
  getPlans() {
    return this.intelligence.getPlans();
  }

  @Post("billing/create-checkout-session")
  createCheckoutSession(@Body() body: Record<string, unknown>) {
    return this.intelligence.createCheckoutSession(body);
  }

  @Get("dashboard")
  getDashboard() {
    return this.intelligence.getDashboard();
  }

  @Get("markets/:symbol/candles")
  getCandles(@Param("symbol") symbol: string) {
    return this.intelligence.getCandles(symbol);
  }

  @Get("markets/:symbol/agents")
  getMarketAgents(@Param("symbol") symbol: string) {
    return this.intelligence.getMarketAgents(symbol);
  }

  @Get("markets/:symbol/consensus")
  getConsensus(@Param("symbol") symbol: string) {
    return this.intelligence.getConsensus(symbol);
  }

  @Get("markets/:symbol")
  getMarket(@Param("symbol") symbol: string) {
    return this.intelligence.getMarket(symbol);
  }

  @Get("reports")
  getReports() {
    return this.intelligence.getReports();
  }

  @Get("reports/:id")
  getReport(@Param("id") id: string) {
    return this.intelligence.getReport(id);
  }

  @Get("alerts")
  getAlerts() {
    return this.intelligence.getAlerts();
  }

  @Post("alerts")
  createAlert(@Body() body: Record<string, unknown>) {
    return this.intelligence.createAlert(body);
  }

  @Patch("alerts/:id")
  updateAlert(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.intelligence.updateAlert(id, body);
  }

  @Delete("alerts/:id")
  deleteAlert(@Param("id") id: string) {
    return this.intelligence.deleteAlert(id);
  }

  @Get("account/subscription")
  getSubscription() {
    return this.intelligence.getSubscription();
  }

  @Get("admin/users")
  getAdminUsers() {
    return this.intelligence.getAdminUsers();
  }

  @Get("admin/subscriptions")
  getAdminSubscriptions() {
    return this.intelligence.getAdminSubscriptions();
  }

  @Get("admin/agents")
  getAdminAgents() {
    return this.intelligence.getAdminAgents();
  }

  @Get("admin/ingestion-health")
  getIngestionHealth() {
    return this.intelligence.getIngestionHealth();
  }

  @Get("admin/agent-runs")
  getAgentRuns() {
    return this.intelligence.getAgentRuns();
  }

  @Patch("admin/agents/:id")
  updateAdminAgent(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.intelligence.updateAdminAgent(id, body);
  }
}
