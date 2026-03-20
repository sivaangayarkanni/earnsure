import { definition as weatherDefinition, handler as weatherHandler } from "./weather_tool.js";
import { definition as riskPredictionDefinition, handler as riskPredictionHandler } from "./risk_prediction_tool.js";
import { definition as claimDefinition, handler as claimHandler } from "./claim_tool.js";
import { definition as fraudDefinition, handler as fraudHandler } from "./fraud_detection_tool.js";
import { definition as poolDefinition, handler as poolHandler } from "./risk_pool_tool.js";
import { definition as paymentDefinition, handler as paymentHandler } from "./payment_tool.js";
import { definition as zoneDefinition, handler as zoneHandler } from "./zone_recommendation_tool.js";
import { definition as locationDefinition, handler as locationHandler } from "./location_tool.js";
import { definition as algorithmDowntimeDefinition, handler as algorithmDowntimeHandler } from "./algorithm_downtime_tool.js";
import { definition as stabilityDefinition, handler as stabilityHandler } from "./income_stability_tool.js";

export const tools = [
  weatherDefinition,
  riskPredictionDefinition,
  claimDefinition,
  fraudDefinition,
  poolDefinition,
  paymentDefinition,
  zoneDefinition,
  locationDefinition,
  algorithmDowntimeDefinition,
  stabilityDefinition,
];

export const toolHandlers = {
  [weatherDefinition.name]: weatherHandler,
  [riskPredictionDefinition.name]: riskPredictionHandler,
  [claimDefinition.name]: claimHandler,
  [fraudDefinition.name]: fraudHandler,
  [poolDefinition.name]: poolHandler,
  [paymentDefinition.name]: paymentHandler,
  [zoneDefinition.name]: zoneHandler,
  [locationDefinition.name]: locationHandler,
  [algorithmDowntimeDefinition.name]: algorithmDowntimeHandler,
  [stabilityDefinition.name]: stabilityHandler,
};
