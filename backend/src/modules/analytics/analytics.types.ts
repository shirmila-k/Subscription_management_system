import { z } from 'zod';
import { BadRequestError } from '../../utils/errors';

export const AnalyticsPeriodEnum = z.enum([
  'last7Days',
  'last30Days',
  'currentMonth',
  'previousMonth',
  'last6Months',
  'last12Months',
  'all',
  'custom',
]);

export type AnalyticsPeriod = z.infer<typeof AnalyticsPeriodEnum>;

export const AnalyticsFilterSchema = z
  .object({
    period: AnalyticsPeriodEnum.optional().default('last30Days'),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.period === 'custom') {
        return !!data.startDate && !!data.endDate;
      }
      return true;
    },
    {
      message: "Custom period requires both 'startDate' and 'endDate' in YYYY-MM-DD format",
      path: ['startDate'],
    }
  );

export interface ParsedDateRange {
  startDate: Date;
  endDate: Date;
  period: AnalyticsPeriod;
  periodLabel: string;
}

/**
 * Validates and converts request query into a safe, bounded Date range.
 * End date is inclusive (extended to 23:59:59.999).
 */
export function parseAnalyticsDateRange(query: any): ParsedDateRange {
  const parsed = AnalyticsFilterSchema.safeParse(query);
  if (!parsed.success) {
    const errorDetails = parsed.error.errors.map((e) => e.message).join('; ');
    throw new BadRequestError(`Invalid analytics query parameters: ${errorDetails}`);
  }

  const { period, startDate: customStart, endDate: customEnd } = parsed.data;
  const now = new Date();

  let start: Date;
  let end: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  let label = 'Last 30 Days';

  switch (period) {
    case 'last7Days': {
      start = new Date(now);
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      label = 'Last 7 Days';
      break;
    }
    case 'last30Days': {
      start = new Date(now);
      start.setDate(now.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      label = 'Last 30 Days';
      break;
    }
    case 'currentMonth': {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      label = 'Current Month';
      break;
    }
    case 'previousMonth': {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      // Last day of previous month
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      label = 'Previous Month';
      break;
    }
    case 'last6Months': {
      start = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
      label = 'Last 6 Months';
      break;
    }
    case 'last12Months': {
      start = new Date(now.getFullYear(), now.getMonth() - 11, 1, 0, 0, 0, 0);
      label = 'Last 12 Months';
      break;
    }
    case 'all': {
      start = new Date(2020, 0, 1, 0, 0, 0, 0);
      label = 'All Time';
      break;
    }
    case 'custom': {
      if (!customStart || !customEnd) {
        throw new BadRequestError("Both 'startDate' and 'endDate' are required for custom period");
      }

      start = new Date(customStart);
      end = new Date(customEnd);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new BadRequestError('Invalid date format for custom period. Please use YYYY-MM-DD');
      }

      if (start > end) {
        throw new BadRequestError("Invalid date range: 'startDate' cannot be after 'endDate'");
      }

      // Max 5 years limit to prevent unbounded query execution
      const fiveYearsMs = 5 * 365.25 * 24 * 60 * 60 * 1000;
      if (end.getTime() - start.getTime() > fiveYearsMs) {
        throw new BadRequestError('Date range exceeds maximum allowed limit of 5 years');
      }

      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      label = `${customStart} to ${customEnd}`;
      break;
    }
    default: {
      start = new Date(now);
      start.setDate(now.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      label = 'Last 30 Days';
    }
  }

  return {
    startDate: start,
    endDate: end,
    period,
    periodLabel: label,
  };
}
