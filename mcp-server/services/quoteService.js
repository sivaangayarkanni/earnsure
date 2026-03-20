export function quotePolicy({ coverageAmountCents, riskScore, termDays, currency = "USD" }) {
  const normalizedRisk = Math.min(Math.max(Number(riskScore) || 0, 0), 1);
  const safeTermDays = Math.max(Number(termDays) || 1, 1);
  const safeCoverage = Math.max(Number(coverageAmountCents) || 0, 1);

  const baseAnnualRate = 0.012; // 1.2% base premium per year.
  const riskMultiplier = 1 + normalizedRisk * 1.8;
  const termFactor = safeTermDays / 365;
  const rate = baseAnnualRate * riskMultiplier * termFactor;
  const premiumCents = Math.round(safeCoverage * rate);

  return {
    coverageAmountCents: safeCoverage,
    currency,
    riskScore: normalizedRisk,
    termDays: safeTermDays,
    annualBaseRate: baseAnnualRate,
    appliedRate: rate,
    premiumCents,
  };
}
