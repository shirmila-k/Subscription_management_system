import prisma from '../../config/db';
import { SubscriptionStatus, InvoiceStatus, PaymentStatus, BillingFrequency } from '@prisma/client';

export class AnalyticsService {
  /**
   * High-performance executive overview metrics optimized for < 2-second response times.
   * Runs all aggregate and index-backed queries concurrently via Promise.all.
   */
  async getExecutiveDashboardMetrics() {
    const startTime = Date.now();

    const [
      subscriptionCountsByStatus,
      activeSubsWithPlans,
      overdueInvoicesAgg,
      unpaidInvoicesAgg,
      totalPaymentsAgg,
      recentSubscriptions,
      planDistribution,
    ] = await Promise.all([
      // 1. Group subscriptions by status (indexed on status)
      prisma.subscription.groupBy({
        by: ['status'],
        _count: { id: true },
      }),

      // 2. Fetch active subscriptions with plan frequencies to compute normalized MRR
      prisma.subscription.findMany({
        where: { status: SubscriptionStatus.ACTIVE },
        select: {
          subtotal: true,
          quantity: true,
          plan: {
            select: {
              billingFrequency: true,
            },
          },
        },
      }),

      // 3. Overdue invoices aggregate (indexed on status and dueDate)
      prisma.invoice.aggregate({
        where: {
          OR: [
            { status: InvoiceStatus.OVERDUE },
            {
              status: InvoiceStatus.CONFIRMED,
              dueDate: { lt: new Date() },
              balanceDue: { gt: 0 },
            },
          ],
        },
        _count: { id: true },
        _sum: { balanceDue: true },
      }),

      // 4. Total outstanding unpaid invoices (CONFIRMED or OVERDUE)
      prisma.invoice.aggregate({
        where: {
          status: { in: [InvoiceStatus.CONFIRMED, InvoiceStatus.OVERDUE] },
        },
        _count: { id: true },
        _sum: { balanceDue: true },
      }),

      // 5. Total all-time collected revenue from successful payments
      prisma.payment.aggregate({
        where: { status: PaymentStatus.SUCCESS },
        _sum: { amount: true },
        _count: { id: true },
      }),

      // 6. Recent 5 subscription events
      prisma.subscription.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { firstName: true, lastName: true, email: true, companyName: true },
          },
          plan: {
            select: { name: true, billingFrequency: true },
          },
        },
      }),

      // 7. Plan popularity count
      prisma.subscription.groupBy({
        by: ['planId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);

    // Format status counts map
    const statusMap: Record<string, number> = {
      DRAFT: 0,
      QUOTATION: 0,
      CONFIRMED: 0,
      ACTIVE: 0,
      PAUSED: 0,
      CLOSED: 0,
      CANCELLED: 0,
    };
    subscriptionCountsByStatus.forEach((item) => {
      statusMap[item.status] = item._count.id;
    });

    // Calculate Normalized Monthly Recurring Revenue (MRR)
    let calculatedMRR = 0;
    activeSubsWithPlans.forEach((sub) => {
      const amount = Number(sub.subtotal);
      switch (sub.plan.billingFrequency) {
        case BillingFrequency.MONTHLY:
          calculatedMRR += amount;
          break;
        case BillingFrequency.YEARLY:
          calculatedMRR += amount / 12;
          break;
        case BillingFrequency.WEEKLY:
          calculatedMRR += amount * 4.33;
          break;
        case BillingFrequency.DAILY:
          calculatedMRR += amount * 30;
          break;
      }
    });

    const mrr = Math.round(calculatedMRR * 100) / 100;
    const arr = Math.round(mrr * 12 * 100) / 100;

    // Fetch plan names for plan distribution
    const planIds = planDistribution.map((p) => p.planId);
    const plansInfo = await prisma.plan.findMany({
      where: { id: { in: planIds } },
      select: { id: true, name: true, price: true },
    });

    const planStats = planDistribution.map((item) => {
      const p = plansInfo.find((plan) => plan.id === item.planId);
      return {
        planId: item.planId,
        planName: p?.name || 'Unknown Plan',
        price: p?.price ? Number(p.price) : 0,
        subscribersCount: item._count.id,
      };
    });

    const queryExecutionTimeMs = Date.now() - startTime;

    return {
      executionTimeMs: queryExecutionTimeMs,
      kpis: {
        totalSubscriptions: Object.values(statusMap).reduce((a, b) => a + b, 0),
        activeSubscriptions: statusMap.ACTIVE,
        quotationsPending: statusMap.QUOTATION,
        draftSubscriptions: statusMap.DRAFT,
        pausedSubscriptions: statusMap.PAUSED,
        closedSubscriptions: statusMap.CLOSED,
        mrr,
        arr,
        totalCollectedRevenue: Number(totalPaymentsAgg._sum.amount || 0),
        totalPaymentsCount: totalPaymentsAgg._count.id,
        overdueInvoicesCount: overdueInvoicesAgg._count.id,
        overdueInvoicesAmount: Number(overdueInvoicesAgg._sum.balanceDue || 0),
        outstandingBalanceTotal: Number(unpaidInvoicesAgg._sum.balanceDue || 0),
      },
      statusDistribution: statusMap,
      topPlans: planStats,
      recentActivity: recentSubscriptions,
    };
  }

  /**
   * Monthly Revenue Trend (Last 6 months)
   */
  async getMonthlyRevenueTrend() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const payments = await prisma.payment.findMany({
      where: {
        status: PaymentStatus.SUCCESS,
        paymentDate: { gte: sixMonthsAgo },
      },
      select: {
        amount: true,
        paymentDate: true,
      },
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap: Record<string, number> = {};

    // Initialize 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthlyMap[key] = 0;
    }

    payments.forEach((p) => {
      const key = `${monthNames[p.paymentDate.getMonth()]} ${p.paymentDate.getFullYear()}`;
      if (monthlyMap[key] !== undefined) {
        monthlyMap[key] += Number(p.amount);
      }
    });

    return Object.entries(monthlyMap).map(([month, revenue]) => ({
      month,
      revenue: Math.round(revenue * 100) / 100,
    }));
  }
}

export const analyticsService = new AnalyticsService();
