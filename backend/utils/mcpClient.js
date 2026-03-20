// MCP Client - uses in-process tools for reliability
const {
  weatherTool,
  riskPredictionTool,
  claimTool,
  fraudDetectionTool,
  poolTool,
  paymentTool,
  zoneTool,
  locationTool,
  algorithmDowntimeTool,
} = require("./mcpTools");

// Map tool names to functions
const toolMap = {
  weather_tool: weatherTool,
  risk_prediction_tool: riskPredictionTool,
  claim_tool: claimTool,
  fraud_detection_tool: fraudDetectionTool,
  risk_pool_tool: poolTool,
  payment_tool: paymentTool,
  zone_recommendation_tool: zoneTool,
  location_tool: locationTool,
  algorithm_downtime_tool: algorithmDowntimeTool,
};

async function callMcpTool(toolName, args = {}) {
  const handler = toolMap[toolName];
  if (!handler) {
    throw new Error(`MCP tool ${toolName} not found`);
  }
  
  try {
    const result = await handler(args);
    return result;
  } catch (e) {
    console.log(`[MCP] Tool ${toolName} error:`, e.message);
    throw e;
  }
}

module.exports = { callMcpTool };
