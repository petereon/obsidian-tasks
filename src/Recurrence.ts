import type { RepeatRule } from "./types";

function lastDayOfMonth(year: number, monthIndex: number): number {
  // Day 0 of the following month is the last day of `monthIndex`.
  return new Date(year, monthIndex + 1, 0).getDate();
}

function addInterval(date: Date, rule: RepeatRule): Date {
  const next = new Date(date);

  switch (rule.unit) {
    case "day":
      next.setDate(next.getDate() + rule.count);
      return next;

    case "week":
      next.setDate(next.getDate() + rule.count * 7);
      return next;

    case "month":
    case "year": {
      const monthsToAdd = rule.unit === "year" ? rule.count * 12 : rule.count;
      const originalDay = next.getDate();
      const targetMonthIndex = next.getMonth() + monthsToAdd;
      const targetYear = next.getFullYear() + Math.floor(targetMonthIndex / 12);
      const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
      const clampedDay = Math.min(originalDay, lastDayOfMonth(targetYear, targetMonth));
      next.setFullYear(targetYear, targetMonth, clampedDay);
      return next;
    }
  }
}

export function nextOccurrence(due: Date, rule: RepeatRule, now: Date): Date {
  let next = addInterval(due, rule);
  while (next <= now) {
    next = addInterval(next, rule);
  }
  return next;
}
