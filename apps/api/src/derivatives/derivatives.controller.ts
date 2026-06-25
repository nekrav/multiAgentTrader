import { Controller, Get, Param, Query } from "@nestjs/common";
import { DerivativesService } from "./derivatives.service";

@Controller()
export class DerivativesController {
  constructor(private readonly derivatives: DerivativesService) {}

  @Get("futures/:symbol/contracts")
  getFutureContracts(@Param("symbol") symbol: string) {
    return this.derivatives.getFutureContracts(symbol);
  }

  @Get("futures/:symbol/curve")
  getFutureCurve(@Param("symbol") symbol: string) {
    return this.derivatives.getFutureCurve(symbol);
  }

  @Get("futures/:symbol/open-interest")
  getFutureOpenInterest(@Param("symbol") symbol: string) {
    return this.derivatives.getFutureOpenInterest(symbol);
  }

  @Get("futures/:symbol/agents")
  getFutureAgents(@Param("symbol") symbol: string, @Query("timeframe") timeframe?: string) {
    return this.derivatives.getFutureAgents(symbol, timeframe);
  }

  @Get("futures/:symbol/consensus")
  getFutureConsensus(@Param("symbol") symbol: string, @Query("timeframe") timeframe?: string) {
    return this.derivatives.getFutureConsensus(symbol, timeframe);
  }

  @Get("options/:underlying/expiries")
  getOptionExpiries(@Param("underlying") underlying: string) {
    return this.derivatives.getOptionExpiries(underlying);
  }

  @Get("options/:underlying/chain")
  getOptionChain(@Param("underlying") underlying: string, @Query("expiry") expiry?: string) {
    return this.derivatives.getOptionChain(underlying, expiry);
  }

  @Get("options/:underlying/vol-surface")
  getOptionVolSurface(@Param("underlying") underlying: string) {
    return this.derivatives.getOptionVolSurface(underlying);
  }

  @Get("options/:underlying/agents")
  getOptionAgents(@Param("underlying") underlying: string, @Query("timeframe") timeframe?: string) {
    return this.derivatives.getOptionAgents(underlying, timeframe);
  }

  @Get("options/:underlying/consensus")
  getOptionConsensus(@Param("underlying") underlying: string, @Query("timeframe") timeframe?: string) {
    return this.derivatives.getOptionConsensus(underlying, timeframe);
  }

  @Get("options/:underlying/strategies")
  getOptionStrategies(@Param("underlying") underlying: string) {
    return this.derivatives.getOptionStrategies(underlying);
  }
}
