import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Pool } from "pg";
import { POSTGRES_POOL } from "../database/database.module";

function timeframeOrDefault(value?: string): string {
  return (value || "1H").toUpperCase();
}

@Injectable()
export class DerivativesService {
  constructor(@Inject(POSTGRES_POOL) private readonly postgres: Pool) {}

  async getFutureContracts(symbol: string) {
    const result = await this.postgres.query(
      "select underlying, symbol, exchange, expiry, contract_month, tick_size, multiplier, is_active from future_contracts where upper(underlying)=upper($1) order by expiry asc",
      [symbol],
    );
    return result.rows;
  }

  async getFutureCurve(symbol: string) {
    const result = await this.postgres.query(
      "select underlying, ts as timestamp, curve_json, front_contract, second_contract, third_contract, m1_price, m2_price, m3_price, m1_m2_spread, m2_m3_spread from future_curve_snapshots where upper(underlying)=upper($1) order by ts desc limit 1",
      [symbol],
    );
    if (!result.rowCount) throw new NotFoundException(`No futures curve for ${symbol}`);
    return result.rows[0];
  }

  async getFutureOpenInterest(symbol: string) {
    const result = await this.postgres.query(
      `select c.underlying, c.symbol, o.ts as timestamp, o.volume, o.open_interest, o.oi_change, o.volume_change
       from open_interest_snapshots o join future_contracts c on c.id = o.contract_id
       where upper(c.underlying)=upper($1) order by o.ts desc limit 50`,
      [symbol],
    );
    return result.rows;
  }

  async getFutureAgents(symbol: string, timeframe?: string) {
    return this.latestAgentOutputs("futures_agent_outputs", symbol, timeframeOrDefault(timeframe));
  }

  async getFutureConsensus(symbol: string, timeframe?: string) {
    return this.latestAgentOutput("futures_agent_outputs", symbol, timeframeOrDefault(timeframe), "futures_meta_consensus");
  }

  async getOptionExpiries(underlying: string) {
    const result = await this.postgres.query(
      "select distinct expiry from option_chain_snapshots where upper(underlying)=upper($1) order by expiry asc",
      [underlying],
    );
    return result.rows.map((row) => row.expiry);
  }

  async getOptionChain(underlying: string, expiry?: string) {
    const params: string[] = [underlying];
    let where = "upper(underlying)=upper($1)";
    if (expiry) {
      params.push(expiry);
      where += " and expiry=$2";
    }
    const result = await this.postgres.query(
      `select underlying, ts as timestamp, expiry, strike, option_type, bid, ask, mid, volume, open_interest, implied_vol, delta, gamma, theta, vega
       from option_chain_snapshots where ${where} order by expiry asc, strike asc, option_type asc`,
      params,
    );
    return result.rows;
  }

  async getOptionVolSurface(underlying: string) {
    const result = await this.postgres.query(
      "select underlying, ts as timestamp, surface_json, atm_term_structure_json, skew_score, smile_curvature, iv_rank, iv_percentile from vol_surface_snapshots where upper(underlying)=upper($1) order by ts desc limit 1",
      [underlying],
    );
    if (!result.rowCount) throw new NotFoundException(`No options vol surface for ${underlying}`);
    return result.rows[0];
  }

  async getOptionAgents(underlying: string, timeframe?: string) {
    return this.latestAgentOutputs("options_agent_outputs", underlying, timeframeOrDefault(timeframe || "1D"));
  }

  async getOptionConsensus(underlying: string, timeframe?: string) {
    return this.latestAgentOutput("options_agent_outputs", underlying, timeframeOrDefault(timeframe || "1D"), "options_meta_consensus");
  }

  async getOptionStrategies(underlying: string) {
    const result = await this.postgres.query(
      "select underlying, ts as timestamp, timeframe, strategy_family, confidence, rationale, risk_note, invalidation_note, features_json from strategy_recommendations where upper(underlying)=upper($1) order by ts desc limit 20",
      [underlying],
    );
    return result.rows;
  }

  private async latestAgentOutputs(table: "futures_agent_outputs" | "options_agent_outputs", market: string, timeframe: string) {
    const result = await this.postgres.query(
      `select distinct on (agent_key) market, timeframe, ts as timestamp, agent_key, bias, confidence, score, summary, risk_flags_json, features_json, model_version, input_hash
       from ${table} where upper(market)=upper($1) and upper(timeframe)=upper($2) order by agent_key, ts desc`,
      [market, timeframe],
    );
    return result.rows;
  }

  private async latestAgentOutput(table: "futures_agent_outputs" | "options_agent_outputs", market: string, timeframe: string, agentKey: string) {
    const result = await this.postgres.query(
      `select market, timeframe, ts as timestamp, agent_key, bias, confidence, score, summary, risk_flags_json, features_json, model_version, input_hash
       from ${table} where upper(market)=upper($1) and upper(timeframe)=upper($2) and agent_key=$3 order by ts desc limit 1`,
      [market, timeframe, agentKey],
    );
    if (!result.rowCount) throw new NotFoundException(`No ${agentKey} output for ${market}`);
    return result.rows[0];
  }
}
