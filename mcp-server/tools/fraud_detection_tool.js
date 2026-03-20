import { evaluateFraud } from "../services/fraud_service.js";

export const definition = {
  name: "fraud_detection_tool",
  description: "Detect fraudulent claims using rule-based checks.",
  inputSchema: {
    type: "object",
    properties: {
      worker_id: { type: "string" },
      claim_id: { type: "string" },
    },
    required: ["worker_id", "claim_id"],
  },
};

export async function handler({ worker_id, claim_id }) {
  return evaluateFraud({ worker_id, claim_id });
}
