import prisma from '../../config/prisma';
import { SubscriptionStatus, InvoiceStatus, PaymentStatus, BillingFrequency } from '@prisma/client';

export class AnalyticsService {
  /**
   * High-performance dashboard summary with sub-2-second target latency.
   * Leverages indexed fields (status, dueDate, paymentDate).
   */
  public static async getDashboardSummary() {
    const startTime = performance.now();

    const [
      subscriptionsByStatus,
      activeSubscriptionsWithPlan,
      paymentAggregate,
      overdueInvoices,
      totalCustomers,
      recentSubscriptions,
    ] = await Promise.all([
      // 1. Subscription count grouped by status
      prisma.subscription.groupBy({
        by: ['status'],
        _count: { id: true },
      }),

      // 2. Active subscriptions for MRR & ARR calculation (indexed on status)
      prisma.subscription.findMany({
        where: { status: SubscriptionStatus.ACTIVE },
        select: {
          quantity: true,
          unitPrice: true,
          plan: {
            select: { billingFrequency: true },
          },
        },
      }),

      // 3. Total paid revenue aggregate
      prisma.payment.aggregate({
        where: { status: PaymentStatus.SUCCESS },
        _sum: { amount: true },
        _count: { id: true },
      }),

      // 4. Overdue invoices aggregate (due date in past and not paid)
      prisma.invoice.aggregate({
        where: {
          OR: [
            { status: InvoiceStatus.OVERDUE },
            {
              status: { in: [InvoiceStatus.CONFIRMED, InvoiceStatus.DRAFT] },
              dueDate: { lt: new Date() },
            },
          ],
        },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),

      // 5. Total customers count
      prisma.user.count({
        where: { role: 'CUSTOMER' },
      }),

      // 6. Recent 5 subscriptions for quick feed
      prisma.subscription.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, email: true, companyName: true } },
          plan: { select: { name: true, billingFrequency: true } },
        },
      }),
    ]);

    // Calculate MRR (Monthly Recurring Revenue)
    let mrr = 0;
    for (const sub of activeSubscriptionsWithPlan) {
      const subMonthlyValue = Number(sub.unitPrice) * sub.quantity;
      switch (sub.plan.billingFrequency) {
        case BillingFrequency.DAILY:
          mrr += subMonthlyValue * 30;
          break;
        case BillingFrequency.WEEKLY:
          mrr += subMonthlyValue * 4.33;
          break;
        case BillingFrequency.MONTHLY:
          mrr += subMonthlyValue;
          break;
        case BillingFrequency.YEARLY:
          mrr += subMonthlyValue / 12;
          break;
      }
    }

    const arr = mrr * 12;

    const statusCounts: Record<string, number> = {
      DRAFT: 0,
      QUOTATION: 0,
      CONFIRMED: 0,
      ACTIVE: 0,
      PAUSED: 0,
      CLOSED: 0,
    };

    subscriptionsByStatus.forEach((item) => {
      statusCounts[item.status] = item._count.id;
    });

    const executionTimeMs = Math.round(performance.now() - startTime);

    return {
      metrics: {
        activeSubscriptions: statusCounts.ACTIVE || 0,
        totalCustomers,
        mrr: Math.round(mrr * 100) / 100,
        arr: Math.round(arr * 100) / 100,
        totalRevenueCollected: Number(paymentAggregate._sum.amount || 0),
        totalPaymentsCount: paymentAggregate._count.id || 0,
        overdueInvoicesCount: overdueInvoices._count.id || 0,
        overdueInvoicesAmount: Number(overdueInvoices._sum.totalAmount || 0),
      },
      statusDistribution: statusCounts,
      recentSubscriptions,
      performance: {
        executionTimeMs,
        targetUnderMs: 2000,
      },
    };
  }

  /**
   * Monthly revenue trend over the past 6 calendar months
   */
  public static async getRevenueTrends() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const payments = await prisma.payment.findMany({
      where: {
        status: PaymentStatus.SUCCESS,
        paymentDate: { gte: sixMonthsAgo },
      },
      select: {
        amount: true,
        paymentDate: true,
      },
      orderBy: { paymentDate: 'asc' },
    });

    // Group by Month Year
    const monthlyMap: Record<string, number> = {};

    payments.forEach((p) => {
      const monthYear = p.paymentDate.toLocaleString('default', { month: 'short', year: 'numeric' });
      monthlyMap[monthYear] = (monthlyMap[monthYear] || 0) + Number(p.amount);
    });

    return Object.entries(monthlyMap).map(([month, revenue]) => ({
      month,
      revenue,
    }));
  }
}
