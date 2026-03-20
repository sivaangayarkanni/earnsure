export const definition = {
  name: "risk_prediction_tool",
  description: "Call the risk model service to predict risk score and premium.",
  inputSchema: {
    type: "object",
    properties: {
      city: { type: "string" },
      rain_probability: { type: "number", minimum: 0, maximum: 1 },
      AQI: { type: "number", minimum: 0 },
      temperature: { type: "number" },
    },
    required: ["city", "rain_probability", "AQI", "temperature"],
  },
};

export async function handler({ city, rain_probability, AQI, temperature }) {
  const baseUrl =
    process.env.RISK_PREDICTION_URL ||
    "http://localhost:8000/risk/predict";

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      city,
      rain_probability,
      AQI,
      temperature,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Risk prediction request failed: ${text}`);
  }

  const data = await response.json();
  const riskScore = Number(data?.risk_score);
  const premium = Number(data?.recommended_weekly_premium);

  if (Number.isNaN(riskScore) || Number.isNaN(premium)) {
    throw new Error("Risk prediction response missing required fields.");
  }

  return {
    risk_score: riskScore,
    recommended_weekly_premium: premium,
  };
}
