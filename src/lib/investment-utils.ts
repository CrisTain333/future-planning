/**
 * Calculate compound interest maturity amount.
 * A = P × (1 + r/n)^(n × t)
 */
export function calculateMaturityAmount(
  principal: number,
  annualRate: number,
  compoundingFrequency: "quarterly" | "monthly" | "yearly",
  tenureMonths: number
): number {
  const n =
    compoundingFrequency === "quarterly"
      ? 4
      : compoundingFrequency === "monthly"
        ? 12
        : 1;
  const r = annualRate / 100;
  const t = tenureMonths / 12;
  const amount = principal * Math.pow(1 + r / n, n * t);
  return Math.round(amount * 100) / 100;
}

/**
 * Calculate accrued value at a given number of days since start.
 */
export function calculateValueAtDay(
  principal: number,
  annualRate: number,
  compoundingFrequency: "quarterly" | "monthly" | "yearly",
  daysSinceStart: number
): number {
  const n =
    compoundingFrequency === "quarterly"
      ? 4
      : compoundingFrequency === "monthly"
        ? 12
        : 1;
  const r = annualRate / 100;
  const t = daysSinceStart / 365;
  const amount = principal * Math.pow(1 + r / n, n * t);
  return Math.round(amount * 100) / 100;
}

/**
 * Calculate maturity date from start date + tenure in months.
 */
export function calculateMaturityDate(
  startDate: Date,
  tenureMonths: number
): Date {
  const maturity = new Date(startDate);
  maturity.setMonth(maturity.getMonth() + tenureMonths);
  return maturity;
}
