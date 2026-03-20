export const definition = {
  name: "risk_prediction_tool",
  description: "Call the ML service to predict risk score and premium.",
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

// Fallback risk calculation (demo mode)
function calculateRiskFallback(city, rain_probability, AQI, temperature) {
  // Normalize AQI to 0-1 (cap at 500)
  const aqi_score = Math.min(AQI / 500, 1.0);

  // Temperature risk: extreme heat (>40°C) or cold (<10°C) raises risk
  let temp_score = 0;
  if (temperature > 40) {
    temp_score = Math.min((temperature - 40) / 20, 1.0);
  } else if (temperature < 10) {
    temp_score = Math.min((10 - temperature) / 20, 1.0);
  }

  // Weighted risk score
  const risk_score = Math.min(
    (rain_probability * 0.5) + (aqi_score * 0.3) + (temp_score * 0.2),
    1.0
  );

  // Risk level + weekly premium tiers
  let premium;
  if (risk_score < 0.35) {
    premium = 25.0;
  } else if (risk_score < 0.65) {
    premium = 35.0;
  } else {
    premium = 50.0;
  }

  const breakdown = buildPremiumBreakdown({
    risk_score,
    rain_probability,
    AQI,
    temperature,
    premium,
  });

  return { risk_score, premium, breakdown };
}

function buildPremiumBreakdown({ risk_score, rain_probability, AQI, temperature, premium }) {
  const base_premium = 20;
  const risk_component = Number((risk_score * 30).toFixed(2));
  const weather_adjustment = Number((Math.min(rain_probability, 1) * 8).toFixed(2));
  const aqi_adjustment = Number((Math.min(AQI / 500, 1) * 6).toFixed(2));
  let temp_adjustment = 0;
  if (temperature > 40) temp_adjustment = Math.min((temperature - 40) / 10, 1) * 4;
  if (temperature < 10) temp_adjustment = Math.min((10 - temperature) / 10, 1) * 4;
  temp_adjustment = Number(temp_adjustment.toFixed(2));

  const adjustments = weather_adjustment + aqi_adjustment + temp_adjustment;
  const model_adjustment = Number((premium - base_premium - risk_component - adjustments).toFixed(2));

  return {
    base_premium,
    risk_component,
    weather_adjustment,
    aqi_adjustment,
    temperature_adjustment: temp_adjustment,
    model_adjustment,
    total: Number(premium.toFixed(2)),
  };
}

export async function handler({ city, rain_probability, AQI, temperature }) {
  const baseUrl = process.env.RISK_PREDICTION_URL;

  // If no AI service URL, use fallback calculation
  if (!baseUrl) {
    console.log("[Risk Prediction] No AI service - using fallback calculation");
    const { risk_score, premium, breakdown } = calculateRiskFallback(
      city,
      rain_probability,
      AQI,
      temperature
    );
    return {
      risk_score,
      recommended_weekly_premium: premium,
      premium_breakdown: breakdown,
    };
  }

  try {
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

    const breakdown = buildPremiumBreakdown({
      risk_score: riskScore,
      rain_probability,
      AQI,
      temperature,
      premium,
    });

    return {
      risk_score: riskScore,
      recommended_weekly_premium: premium,
      premium_breakdown: breakdown,
    };
  } catch (err) {
    console.log("[Risk Prediction] AI service unavailable, using fallback:", err.message);
    const { risk_score, premium, breakdown } = calculateRiskFallback(
      city,
      rain_probability,
      AQI,
      temperature
    );
    return {
      risk_score,
      recommended_weekly_premium: premium,
      premium_breakdown: breakdown,
    };
  }
}
