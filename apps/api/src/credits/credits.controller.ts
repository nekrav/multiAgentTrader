import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../auth/admin.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreditsService } from "./credits.service";

@Controller()
export class CreditsController {
  constructor(private readonly credits: CreditsService) {}

  @Get("credits/balance")
  @UseGuards(JwtAuthGuard)
  getBalance(@CurrentUser() user: AuthUser) {
    return this.credits.getBalance(user.id);
  }

  @Get("credits/ledger")
  @UseGuards(JwtAuthGuard)
  listLedger(@CurrentUser() user: AuthUser, @Query("limit") limit?: string, @Query("before") before?: string) {
    return this.credits.listLedger(user.id, limit ? Number(limit) : 50, before);
  }

  @Post("admin/credits/grant")
  @UseGuards(JwtAuthGuard, AdminGuard)
  async grant(@Body() body: { userId?: string; amount?: number; note?: string }) {
    if (!body.userId || !body.amount || body.amount <= 0) {
      return { error: "userId and positive amount are required" };
    }
    const result = await this.credits.grant(body.userId, BigInt(Math.floor(body.amount)), body.note ?? "Admin credit grant.");
    return { applied: result.applied, balance: result.balance.toString() };
  }
}
