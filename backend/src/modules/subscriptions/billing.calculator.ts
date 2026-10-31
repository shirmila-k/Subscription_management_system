import { BillingFrequency } from '@prisma/client';

export interface BillingPeriodResult {
  periodStart: Date;
  periodEnd: Date;
  nextBillingDate: Date;
}

/**
 * Checks if a given year is a leap year
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Returns the maximum number of days in a given month of a given year (1-based month: 1 = Jan, 12 = Dec)
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Safely adds months to a date, preserving month-end behavior and avoiding month roll-over
 * Example: Jan 31 + 1 month -> Feb 28 (or Feb 29 in leap year)
 * Example: Mar 31 + 1 month -> Apr 30
 */
export function addMonthsSafe(date: Date, monthsToAdd: number): Date {
  const currentDay = date.getDate();
  const currentMonth = date.getMonth(); // 0-based
  const currentYear = date.getFullYear();

  // Target month and year calculation
  const totalMonths = currentMonth + monthsToAdd;
  const targetYear = currentYear + Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12; // 0-based

  // Max days in the target month (targetMonth + 1 for 1-based month index)
  const maxDays = getDaysInMonth(targetYear, targetMonth + 1);

  // Day is capped at the maximum days of the target month
  const targetDay = Math.min(currentDay, maxDays);

  return new Date(
    targetYear,
    targetMonth,
    targetDay,
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds()
  );
}

/**
 * Safely adds years to a date, specifically handling leap-year Feb 29
 * Example: Feb 29, 2024 + 1 year -> Feb 28, 2025 (non-leap year)
 * Example: Feb 29, 2024 + 4 years -> Feb 29, 2028 (leap year)
 */
export function addYearsSafe(date: Date, yearsToAdd: number): Date {
  const currentDay = date.getDate();
  const currentMonth = date.getMonth(); // 0 = Jan, 1 = Feb
  const currentYear = date.getFullYear();

  const targetYear = currentYear + yearsToAdd;

  let targetDay = currentDay;
  let targetMonth = currentMonth;

  if (currentMonth === 1 && currentDay === 29) {
    if (!isLeapYear(targetYear)) {
      targetDay = 28;
    }
  }

  return new Date(
    targetYear,
    targetMonth,
    targetDay,
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds()
  );
}

/**
 * Computes the next billing date and billing period boundaries based on plan frequency
 */
export function calculateNextBillingPeriod(
  startDate: Date,
  frequency: BillingFrequency,
  cycleDaysOverride?: number
): BillingPeriodResult {
  const periodStart = new Date(startDate);
  let nextBillingDate: Date;

  switch (frequency) {
    case BillingFrequency.DAILY: {
      nextBillingDate = new Date(periodStart);
      nextBillingDate.setDate(nextBillingDate.getDate() + 1);
      break;
    }
    case BillingFrequency.WEEKLY: {
      nextBillingDate = new Date(periodStart);
      nextBillingDate.setDate(nextBillingDate.getDate() + 7);
      break;
    }
    case BillingFrequency.MONTHLY: {
      nextBillingDate = addMonthsSafe(periodStart, 1);
      break;
    }
    case BillingFrequency.YEARLY: {
      nextBillingDate = addYearsSafe(periodStart, 1);
      break;
    }
    default: {
      const days = cycleDaysOverride && cycleDaysOverride > 0 ? cycleDaysOverride : 30;
      nextBillingDate = new Date(periodStart);
      nextBillingDate.setDate(nextBillingDate.getDate() + days);
      break;
    }
  }

  const periodEnd = new Date(nextBillingDate);

  return {
    periodStart,
    periodEnd,
    nextBillingDate,
  };
}

/**
 * Calculates line-item totals, tax, and discount using decimal-safe rounding
 */
export function calculateMonetaryBreakdown(params: {
  unitPrice: number;
  quantity: number;
  discountAmount?: number;
  taxRatePercent?: number;
}) {
  const quantity = Math.max(1, params.quantity);
  const unitPrice = Math.max(0, params.unitPrice);

  const subtotal = Math.round(unitPrice * quantity * 100) / 100;
  const discountAmount = Math.min(subtotal, Math.max(0, params.discountAmount || 0));
  const taxableAmount = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

  const taxRate = params.taxRatePercent !== undefined ? params.taxRatePercent : 18.0;
  const taxAmount = Math.round(((taxableAmount * taxRate) / 100) * 100) / 100;
  const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxRate,
    taxAmount,
    totalAmount,
  };
}
