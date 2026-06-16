export type AlphaVantageToolCategory =
  | "core_stock_apis"
  | "options_data_apis"
  | "alpha_intelligence"
  | "fundamental_data"
  | "forex"
  | "cryptocurrencies"
  | "commodities"
  | "economic_indicators"
  | "technical_indicators"
  | "ping";

export interface AlphaVantageTool {
  category: AlphaVantageToolCategory;
  name: string;
  available: boolean;
  required: string[];
  description: string;
}

export const ALPHA_VANTAGE_TOOLS: AlphaVantageTool[] = [
  {
    "category": "core_stock_apis",
    "name": "TIME_SERIES_INTRADAY",
    "available": true,
    "required": [
      "symbol",
      "interval"
    ],
    "description": "Returns current and 20+ years of historical intraday OHLCV time series of the equity specified.  Args:     symbol: The name of the equity. For example: symbol=IBM     interval: Time interval between consecutive data points. Supported: 1min, 5min, 15min, 30min, 60min     adjusted: By default True. Set False to query raw (as-traded) intraday values     extended_hours: By default True. Set False for regular trading hours only     month: Query specific month in YYYY-MM format. Example: 2009-01     outputsize: \"compact\" (100 data points) or \"full\" (30 days or full month)     datatype: By default, datatype=csv. Strings json and csv are accepted with the following specifications:              json returns the data in JSON format; csv returns the data as a CSV (comma separated value) file.           entitlement: \"delayed\" for 15-minute delayed data, \"realtime\" for realtime data          return_full_data: Set to true to return the complete response without preview truncation. Recommended default for clients that offload large tool results to files (e.g. Claude, Claude Code)."
  },
];
