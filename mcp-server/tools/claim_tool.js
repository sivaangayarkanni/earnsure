import { createClaim, updateClaimStatus, getClaim } from "../services/claim_service.js";

export const definition = {
  name: "claim_tool",
  description: "Create parametric claims when disruption events occur.",
  inputSchema: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["create", "get", "update"] },
      policy_id: { type: "string" },
      event_type: { type: "string" },
      claim_id: { type: "string" },
      claim_status: { type: "string" },
    },
    required: ["action"],
  },
};

export async function handler({
  action,
  policy_id,
  event_type,
  claim_id,
  claim_status,
}) {
  if (action === "create") {
    if (!policy_id || !event_type) {
      throw new Error("policy_id and event_type are required for create.");
    }
    const claim = await createClaim({ policy_id, event_type });
    return { claim };
  }

  if (action === "get") {
    if (!claim_id) throw new Error("claim_id is required for get.");
    const claim = await getClaim(claim_id);
    return { claim };
  }

  if (action === "update") {
    if (!claim_id || !claim_status) {
      throw new Error("claim_id and claim_status are required for update.");
    }
    const claim = await updateClaimStatus({ claim_id, claim_status });
    return { claim };
  }

  throw new Error(`Unsupported action: ${action}`);
}
