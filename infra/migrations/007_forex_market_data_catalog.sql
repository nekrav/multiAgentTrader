update agent_task_prices
set params_schema = '{
  "type":"object",
  "properties":{
    "asset":{
      "type":"string",
      "enum":["BTC","ETH","EUR/USD","GBP/USD","USD/JPY","AUD/USD","USD/CAD","USD/CHF","NZD/USD","EUR/GBP","EUR/JPY","GBP/JPY"]
    },
    "granularity":{"type":"integer","enum":[60,300,900,3600]},
    "limit":{"type":"integer","minimum":10,"maximum":300}
  },
  "required":["asset"]
}'::jsonb,
description = 'Spot crypto candles or major forex daily rates, with trend, realized volatility, and fast-move metrics.'
where agent_id = 'market-data' and task = 'snapshot';
