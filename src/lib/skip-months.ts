interface SkippedMonth {
  month: number;
  year: number;
  reason?: string;
}

export function isMonthSkipped(month: number, year: number, skippedMonths: SkippedMonth[]): boolean {
  return skippedMonths.some(s => s.month === month && s.year === year);
}

export function countExpectedMonths(
  startMonth: number,
  startYear: number,
  endMonth: number,
  endYear: number,
  skippedMonths: SkippedMonth[]
): number {
  let count = 0;
  let m = startMonth, y = startYear;
  while (y < endYear || (y === endYear && m <= endMonth)) {
    if (!isMonthSkipped(m, y, skippedMonths)) {
      count++;
    }
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return count;
}
