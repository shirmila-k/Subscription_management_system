import prisma from '../../config/db';
import {
  SubscriptionStatus,
  InvoiceStatus,
  PaymentStatus,
  BillingFrequency,
  UserRole,
} from '@prisma/client';
import { ParsedDateRange, parseAnalyticsDateRange } from './analytics.types';
import { buildCsv, generateAnalyticsPdf, PdfReportData } from './reportGenerator';

export class AnalyticsService {
  /**
   * Executive Dashboard Overview Metrics
   */
  async getExecutiveDashboardMetrics(query?: any) {
    const range = parseAnalyticsDateRange(query);
    const startTime = Date.now();

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [
      subscriptionCountsByStatus,
      activeSubsWithPlans,
      overdueInvoicesAgg,
      unpaidInvoicesAgg,
      totalPaymentsAgg,
      currentMonthPaymentsAgg,
      prevMonthPaymentsAgg,
      totalInvoicedAgg,
      totalCustomersCount,
      newCustomersThisMonth,
      newCustomersPrevMonth,
      recentSubscriptions,
      planDistribution,
      recentPayments,
      upcomingRenewalsList,
    ] = await Promise.all([
      // 1. Group subscriptions by status (filtered by created date within range if custom)
      prisma.subscription.groupBy({
        by: ['status'],
        where: {
          createdAt: {
            gte: range.startDate,
            lte: range.endDate,
          },
        },
        _count: { id: true },
      }),

      // 2. Normalized MRR from currently ACTIVE subscriptions
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

      // 3. Overdue invoices aggregate (due date passed and balanceDue > 0)
      prisma.invoice.aggregate({
        where: {
          OR: [
            { status: InvoiceStatus.OVERDUE },
            {
              status: InvoiceStatus.CONFIRMED,
              dueDate: { lt: now },
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

      // 5. Total all-time and range collected revenue from SUCCESS payments
      prisma.payment.aggregate({
        where: {
          status: PaymentStatus.SUCCESS,
          paymentDate: {
            gte: range.startDate,
            lte: range.endDate,
          },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),

      // Current Month collected revenue
      prisma.payment.aggregate({
        where: {
          status: PaymentStatus.SUCCESS,
          paymentDate: { gte: currentMonthStart },
        },
        _sum: { amount: true },
      }),

      // Previous Month collected revenue
      prisma.payment.aggregate({
        where: {
          status: PaymentStatus.SUCCESS,
          paymentDate: { gte: prevMonthStart, lte: prevMonthEnd },
        },
        _sum: { amount: true },
      }),

      // Total Invoiced volume in range
      prisma.invoice.aggregate({
        where: {
          issueDate: {
            gte: range.startDate,
            lte: range.endDate,
          },
        },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),

      // Total registered customers (strictly role = CUSTOMER)
      prisma.user.count({
        where: { role: UserRole.CUSTOMER },
      }),

      // New customers current month
      prisma.user.count({
        where: {
          role: UserRole.CUSTOMER,
          createdAt: { gte: currentMonthStart },
        },
      }),

      // New customers previous month
      prisma.user.count({
        where: {
          role: UserRole.CUSTOMER,
          createdAt: { gte: prevMonthStart, lte: prevMonthEnd },
        },
      }),

      // Recent 5 subscriptions
      prisma.subscription.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { firstName: true, lastName: true, email: true, companyName: true },
          },
          plan: {
            select: { name: true, billingFrequency: true, price: true },
          },
        },
      }),

      // Top subscription plans
      prisma.subscription.groupBy({
        by: ['planId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),

      // Recent 5 verified successful payments
      prisma.payment.findMany({
        where: { status: PaymentStatus.SUCCESS },
        take: 5,
        orderBy: { paymentDate: 'desc' },
        include: {
          customer: {
            select: { firstName: true, lastName: true, companyName: true, email: true },
          },
          invoice: {
            select: { invoiceNumber: true },
          },
        },
      }),

      // Subscriptions due for renewal in next 30 days
      prisma.subscription.findMany({
        where: {
          status: SubscriptionStatus.ACTIVE,
          nextBillingDate: {
            gte: now,
            lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
        },
        take: 10,
        orderBy: { nextBillingDate: 'asc' },
        include: {
          customer: {
            select: { firstName: true, lastName: true, email: true, companyName: true },
          },
          plan: {
            select: { name: true, price: true, billingFrequency: true },
          },
        },
      }),
    ]);

    // Format status distribution
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

    // Normalized MRR calculation
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

    // Plans Info
    const planIds = planDistribution.map((p) => p.planId);
    const plansInfo = await prisma.plan.findMany({
      where: { id: { in: planIds } },
      select: { id: true, name: true, price: true, billingFrequency: true },
    });

    const planStats = planDistribution.map((item) => {
      const p = plansInfo.find((plan) => plan.id === item.planId);
      return {
        planId: item.planId,
        planName: p?.name || 'Unknown Plan',
        price: p?.price ? Number(p.price) : 0,
        billingFrequency: p?.billingFrequency || BillingFrequency.MONTHLY,
        subscribersCount: item._count.id,
      };
    });

    const currentMoRev = Number(currentMonthPaymentsAgg._sum.amount || 0);
    const prevMoRev = Number(prevMonthPaymentsAgg._sum.amount || 0);
    const revenueMoMGrowth =
      prevMoRev > 0
        ? Math.round(((currentMoRev - prevMoRev) / prevMoRev) * 1000) / 10
        : currentMoRev > 0
        ? 100
        : 0;

    const totalCollected = Number(totalPaymentsAgg._sum.amount || 0);
    const totalInvoiced = Number(totalInvoicedAgg._sum.totalAmount || 0);
    const outstanding = Number(unpaidInvoicesAgg._sum.balanceDue || 0);

    return {
      executionTimeMs: Date.now() - startTime,
      period: range.period,
      periodLabel: range.periodLabel,
      startDate: range.startDate.toISOString(),
      endDate: range.endDate.toISOString(),
      currency: 'INR',
      currencySymbol: '₹',
      kpis: {
        totalCollectedRevenue: totalCollected,
        currentMonthRevenue: currentMoRev,
        previousMonthRevenue: prevMoRev,
        revenueGrowthPercent: revenueMoMGrowth,
        mrr,
        arr,
        totalSubscriptions: Object.values(statusMap).reduce((a, b) => a + b, 0),
        activeSubscriptions: statusMap.ACTIVE,
        quotationsPending: statusMap.QUOTATION,
        draftSubscriptions: statusMap.DRAFT,
        pausedSubscriptions: statusMap.PAUSED,
        closedSubscriptions: statusMap.CLOSED,
        cancelledSubscriptions: statusMap.CANCELLED,
        totalCustomers: totalCustomersCount,
        newCustomersThisMonth,
        newCustomersPrevMonth,
        totalInvoicedAmount: totalInvoiced,
        totalInvoicesCount: totalInvoicedAgg._count.id,
        outstandingBalanceTotal: Math.max(0, outstanding),
        overdueInvoicesCount: overdueInvoicesAgg._count.id,
        overdueInvoicesAmount: Number(overdueInvoicesAgg._sum.balanceDue || 0),
        totalPaymentsCount: totalPaymentsAgg._count.id,
      },
      statusDistribution: statusMap,
      topPlans: planStats,
      recentSubscriptions,
      recentPayments,
      upcomingRenewals: upcomingRenewalsList,
    };
  }

  /**
   * Detailed Revenue Analytics (Filtered by Range)
   */
  async getRevenueAnalytics(query?: any) {
    const range = parseAnalyticsDateRange(query);

    const [
      successfulPayments,
      refundedPayments,
      paymentsWithHierarchy,
      allPaymentsGroupedByMethod,
    ] = await Promise.all([
      // 1. Successful payments in date range
      prisma.payment.findMany({
        where: {
          status: PaymentStatus.SUCCESS,
          paymentDate: {
            gte: range.startDate,
            lte: range.endDate,
          },
        },
        select: {
          id: true,
          amount: true,
          paymentDate: true,
          paymentMethod: true,
          paymentNumber: true,
        },
        orderBy: { paymentDate: 'asc' },
      }),

      // 2. Refunded payments in date range
      prisma.payment.aggregate({
        where: {
          status: PaymentStatus.REFUNDED,
          paymentDate: {
            gte: range.startDate,
            lte: range.endDate,
          },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),

      // 3. Payments with Invoice -> Subscription -> Plan -> Product hierarchy
      prisma.payment.findMany({
        where: {
          status: PaymentStatus.SUCCESS,
          paymentDate: {
            gte: range.startDate,
            lte: range.endDate,
          },
        },
        select: {
          amount: true,
          invoice: {
            select: {
              subscription: {
                select: {
                  plan: {
                    select: {
                      id: true,
                      name: true,
                      product: {
                        select: {
                          id: true,
                          name: true,
                          code: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),

      // 4. Grouped by payment method
      prisma.payment.groupBy({
        by: ['paymentMethod'],
        where: {
          status: PaymentStatus.SUCCESS,
          paymentDate: {
            gte: range.startDate,
            lte: range.endDate,
          },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    const totalCollected = successfulPayments.reduce((acc, p) => acc + Number(p.amount), 0);
    const totalRefunded = Number(refundedPayments._sum.amount || 0);
    const netRevenue = Math.max(0, totalCollected - totalRefunded);

    // Revenue Trend: Daily if <= 31 days, otherwise Monthly
    const diffDays = Math.ceil((range.endDate.getTime() - range.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const isDaily = diffDays <= 31;

    const trendMap: Record<string, { label: string; revenue: number; count: number }> = {};

    if (isDaily) {
      // Build daily buckets
      const curr = new Date(range.startDate);
      while (curr <= range.endDate) {
        const key = curr.toISOString().split('T')[0];
        const label = curr.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        trendMap[key] = { label, revenue: 0, count: 0 };
        curr.setDate(curr.getDate() + 1);
      }

      successfulPayments.forEach((p) => {
        const key = p.paymentDate.toISOString().split('T')[0];
        if (trendMap[key]) {
          trendMap[key].revenue += Number(p.amount);
          trendMap[key].count += 1;
        }
      });
    } else {
      // Build monthly buckets
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const curr = new Date(range.startDate.getFullYear(), range.startDate.getMonth(), 1);
      const endLimit = new Date(range.endDate.getFullYear(), range.endDate.getMonth(), 1);

      while (curr <= endLimit) {
        const key = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}`;
        const label = `${monthNames[curr.getMonth()]} ${curr.getFullYear()}`;
        trendMap[key] = { label, revenue: 0, count: 0 };
        curr.setMonth(curr.getMonth() + 1);
      }

      successfulPayments.forEach((p) => {
        const key = `${p.paymentDate.getFullYear()}-${String(p.paymentDate.getMonth() + 1).padStart(2, '0')}`;
        if (trendMap[key]) {
          trendMap[key].revenue += Number(p.amount);
          trendMap[key].count += 1;
        }
      });
    }

    const revenueTrend = Object.values(trendMap).map((item) => ({
      ...item,
      revenue: Math.round(item.revenue * 100) / 100,
    }));

    // Revenue by Product & Plan
    const productRevenueMap: Record<string, { name: string; code: string; revenue: number; count: number }> = {};
    const planRevenueMap: Record<string, { name: string; revenue: number; count: number }> = {};

    paymentsWithHierarchy.forEach((p) => {
      const plan = p.invoice?.subscription?.plan;
      const product = plan?.product;
      const amount = Number(p.amount);

      if (product) {
        if (!productRevenueMap[product.id]) {
          productRevenueMap[product.id] = { name: product.name, code: product.code, revenue: 0, count: 0 };
        }
        productRevenueMap[product.id].revenue += amount;
        productRevenueMap[product.id].count += 1;
      }

      if (plan) {
        if (!planRevenueMap[plan.id]) {
          planRevenueMap[plan.id] = { name: plan.name, revenue: 0, count: 0 };
        }
        planRevenueMap[plan.id].revenue += amount;
        planRevenueMap[plan.id].count += 1;
      }
    });

    const revenueByProduct = Object.values(productRevenueMap).sort((a, b) => b.revenue - a.revenue);
    const revenueByPlan = Object.values(planRevenueMap).sort((a, b) => b.revenue - a.revenue);

    const revenueByPaymentMethod = allPaymentsGroupedByMethod.map((item) => ({
      method: item.paymentMethod,
      revenue: Number(item._sum.amount || 0),
      count: item._count.id,
    }));

    return {
      period: range.period,
      periodLabel: range.periodLabel,
      startDate: range.startDate.toISOString(),
      endDate: range.endDate.toISOString(),
      currency: 'INR',
      currencySymbol: '₹',
      totalCollectedRevenue: totalCollected,
      refundedRevenue: totalRefunded,
      netRevenue,
      paymentTransactionsCount: successfulPayments.length,
      revenueTrend,
      revenueByProduct,
      revenueByPlan,
      revenueByPaymentMethod,
    };
  }

  /**
   * Subscription Analytics & Lifecycle Breakdown
   */
  async getSubscriptionAnalytics(query?: any) {
    const range = parseAnalyticsDateRange(query);
    const now = new Date();

    const [
      statusGroups,
      subscriptionsCreatedList,
      upcomingRenewals,
      totalCount,
    ] = await Promise.all([
      prisma.subscription.groupBy({
        by: ['status'],
        where: {
          createdAt: {
            gte: range.startDate,
            lte: range.endDate,
          },
        },
        _count: { id: true },
      }),

      prisma.subscription.findMany({
        where: {
          createdAt: {
            gte: range.startDate,
            lte: range.endDate,
          },
        },
        select: {
          createdAt: true,
          status: true,
        },
        orderBy: { createdAt: 'asc' },
      }),

      prisma.subscription.findMany({
        where: {
          status: SubscriptionStatus.ACTIVE,
          nextBillingDate: {
            gte: now,
            lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          customer: {
            select: { id: true, firstName: true, lastName: true, companyName: true, email: true },
          },
          plan: {
            select: { id: true, name: true, billingFrequency: true, price: true },
          },
        },
        orderBy: { nextBillingDate: 'asc' },
      }),

      prisma.subscription.count({
        where: {
          createdAt: {
            gte: range.startDate,
            lte: range.endDate,
          },
        },
      }),
    ]);

    const statusCounts: Record<string, number> = {
      DRAFT: 0,
      QUOTATION: 0,
      CONFIRMED: 0,
      ACTIVE: 0,
      PAUSED: 0,
      CLOSED: 0,
      CANCELLED: 0,
    };

    statusGroups.forEach((g) => {
      statusCounts[g.status] = g._count.id;
    });

    // Subscriptions created over time
    const trendMap: Record<string, { label: string; count: number }> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    subscriptionsCreatedList.forEach((sub) => {
      const key = `${sub.createdAt.getFullYear()}-${String(sub.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[sub.createdAt.getMonth()]} ${sub.createdAt.getFullYear()}`;
      if (!trendMap[key]) {
        trendMap[key] = { label, count: 0 };
      }
      trendMap[key].count += 1;
    });

    const retentionRate =
      totalCount > 0
        ? Math.round(((statusCounts.ACTIVE + statusCounts.PAUSED) / totalCount) * 1000) / 10
        : 100;

    return {
      period: range.period,
      periodLabel: range.periodLabel,
      totalSubscriptions: totalCount,
      activeSubscriptions: statusCounts.ACTIVE,
      pendingSubscriptions: statusCounts.DRAFT + statusCounts.QUOTATION + statusCounts.CONFIRMED,
      pausedSubscriptions: statusCounts.PAUSED,
      closedSubscriptions: statusCounts.CLOSED,
      cancelledSubscriptions: statusCounts.CANCELLED,
      retentionRate,
      statusCounts,
      subscriptionsCreatedTrend: Object.values(trendMap),
      upcomingRenewals: upcomingRenewals.map((sub) => ({
        id: sub.id,
        subscriptionNumber: sub.subscriptionNumber,
        customerName: `${sub.customer.firstName} ${sub.customer.lastName}`.trim(),
        companyName: sub.customer.companyName,
        email: sub.customer.email,
        planName: sub.plan.name,
        price: Number(sub.unitPrice),
        nextBillingDate: sub.nextBillingDate,
        autoRenew: sub.autoRenew,
      })),
    };
  }

  /**
   * Customer Analytics & Growth
   */
  async getCustomerAnalytics(query?: any) {
    const range = parseAnalyticsDateRange(query);
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [
      totalCustomers,
      newCustomersThisMonth,
      newCustomersPrevMonth,
      customersInRange,
      activeSubscriptions,
      overdueInvoices,
    ] = await Promise.all([
      // Total registered customers (strictly role = CUSTOMER)
      prisma.user.count({
        where: { role: UserRole.CUSTOMER },
      }),

      // New customers current month
      prisma.user.count({
        where: {
          role: UserRole.CUSTOMER,
          createdAt: { gte: currentMonthStart },
        },
      }),

      // New customers previous month
      prisma.user.count({
        where: {
          role: UserRole.CUSTOMER,
          createdAt: { gte: prevMonthStart, lte: prevMonthEnd },
        },
      }),

      // Customers created in range for growth trend
      prisma.user.findMany({
        where: {
          role: UserRole.CUSTOMER,
          createdAt: {
            gte: range.startDate,
            lte: range.endDate,
          },
        },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),

      // Customers with active subscriptions
      prisma.subscription.findMany({
        where: { status: SubscriptionStatus.ACTIVE },
        select: { customerId: true },
        distinct: ['customerId'],
      }),

      // Overdue invoices with customer details
      prisma.invoice.findMany({
        where: {
          OR: [
            { status: InvoiceStatus.OVERDUE },
            {
              status: InvoiceStatus.CONFIRMED,
              dueDate: { lt: now },
              balanceDue: { gt: 0 },
            },
          ],
        },
        include: {
          customer: {
            select: { id: true, firstName: true, lastName: true, companyName: true, email: true },
          },
        },
      }),
    ]);

    // Customer growth trend
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const growthMap: Record<string, { label: string; count: number }> = {};

    customersInRange.forEach((c) => {
      const key = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[c.createdAt.getMonth()]} ${c.createdAt.getFullYear()}`;
      if (!growthMap[key]) {
        growthMap[key] = { label, count: 0 };
      }
      growthMap[key].count += 1;
    });

    // Aggregate overdue customer map
    const overdueCustomerMap = new Map<
      string,
      {
        customerId: string;
        customerName: string;
        companyName: string | null;
        email: string;
        overdueInvoiceCount: number;
        totalOverdueAmount: number;
      }
    >();

    overdueInvoices.forEach((inv) => {
      const cust = inv.customer;
      const existing = overdueCustomerMap.get(cust.id);
      const balance = Number(inv.balanceDue);

      if (existing) {
        existing.overdueInvoiceCount += 1;
        existing.totalOverdueAmount += balance;
      } else {
        overdueCustomerMap.set(cust.id, {
          customerId: cust.id,
          customerName: `${cust.firstName} ${cust.lastName}`.trim(),
          companyName: cust.companyName,
          email: cust.email,
          overdueInvoiceCount: 1,
          totalOverdueAmount: balance,
        });
      }
    });

    const customerGrowthMoM =
      newCustomersPrevMonth > 0
        ? Math.round(((newCustomersThisMonth - newCustomersPrevMonth) / newCustomersPrevMonth) * 1000) / 10
        : newCustomersThisMonth > 0
        ? 100
        : 0;

    return {
      period: range.period,
      periodLabel: range.periodLabel,
      totalCustomers,
      newCustomersThisMonth,
      newCustomersPrevMonth,
      customerGrowthMoM,
      customersWithActiveSubscriptions: activeSubscriptions.length,
      customersWithOverduePaymentsCount: overdueCustomerMap.size,
      customerGrowthTrend: Object.values(growthMap),
      overdueCustomers: Array.from(overdueCustomerMap.values()).sort(
        (a, b) => b.totalOverdueAmount - a.totalOverdueAmount
      ),
    };
  }

  /**
   * Billing & Receivables Analytics
   */
  async getBillingAnalytics(query?: any) {
    const range = parseAnalyticsDateRange(query);
    const now = new Date();

    const [
      invoiceStatusGroups,
      invoiceTotals,
      overdueAgg,
      paymentStatusGroups,
    ] = await Promise.all([
      // Invoice counts by status in range
      prisma.invoice.groupBy({
        by: ['status'],
        where: {
          issueDate: {
            gte: range.startDate,
            lte: range.endDate,
          },
        },
        _count: { id: true },
        _sum: { totalAmount: true, balanceDue: true, amountPaid: true },
      }),

      // Overall invoice totals
      prisma.invoice.aggregate({
        where: {
          issueDate: {
            gte: range.startDate,
            lte: range.endDate,
          },
        },
        _sum: { totalAmount: true, balanceDue: true, amountPaid: true },
        _count: { id: true },
      }),

      // Overdue invoices
      prisma.invoice.aggregate({
        where: {
          OR: [
            { status: InvoiceStatus.OVERDUE },
            {
              status: InvoiceStatus.CONFIRMED,
              dueDate: { lt: now },
              balanceDue: { gt: 0 },
            },
          ],
        },
        _count: { id: true },
        _sum: { balanceDue: true },
      }),

      // Payment counts and amounts by status
      prisma.payment.groupBy({
        by: ['status'],
        where: {
          paymentDate: {
            gte: range.startDate,
            lte: range.endDate,
          },
        },
        _count: { id: true },
        _sum: { amount: true },
      }),
    ]);

    const invoiceStatusCounts: Record<string, number> = {
      DRAFT: 0,
      CONFIRMED: 0,
      PAID: 0,
      OVERDUE: 0,
      VOID: 0,
    };

    invoiceStatusGroups.forEach((g) => {
      invoiceStatusCounts[g.status] = g._count.id;
    });

    const paymentStatusCounts: Record<string, { count: number; amount: number }> = {
      PENDING: { count: 0, amount: 0 },
      SUCCESS: { count: 0, amount: 0 },
      FAILED: { count: 0, amount: 0 },
      REFUNDED: { count: 0, amount: 0 },
    };

    paymentStatusGroups.forEach((g) => {
      paymentStatusCounts[g.status] = {
        count: g._count.id,
        amount: Number(g._sum.amount || 0),
      };
    });

    const totalInvoiced = Number(invoiceTotals._sum.totalAmount || 0);
    const totalCollected = paymentStatusCounts.SUCCESS.amount;
    const totalOutstanding = Math.max(0, Number(invoiceTotals._sum.balanceDue || 0));
    const collectionEfficiency =
      totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 1000) / 10 : 100;

    return {
      period: range.period,
      periodLabel: range.periodLabel,
      currency: 'INR',
      currencySymbol: '₹',
      totalInvoices: invoiceTotals._count.id,
      paidInvoices: invoiceStatusCounts.PAID,
      unpaidInvoices: invoiceStatusCounts.CONFIRMED,
      overdueInvoices: overdueAgg._count.id,
      draftInvoices: invoiceStatusCounts.DRAFT,
      voidInvoices: invoiceStatusCounts.VOID,
      invoiceStatusDistribution: invoiceStatusCounts,
      totalInvoicedAmount: totalInvoiced,
      totalCollectedRevenue: totalCollected,
      totalOutstandingBalance: totalOutstanding,
      overdueInvoicesAmount: Number(overdueAgg._sum.balanceDue || 0),
      collectionEfficiencyPercent: collectionEfficiency,
      paymentsSummary: {
        totalPayments: Object.values(paymentStatusCounts).reduce((a, b) => a + b.count, 0),
        successful: paymentStatusCounts.SUCCESS,
        pending: paymentStatusCounts.PENDING,
        failed: paymentStatusCounts.FAILED,
        refunded: paymentStatusCounts.REFUNDED,
      },
    };
  }

  /**
   * Product & Subscription Plan Performance Analytics
   */
  async getProductAnalytics() {
    const [allProducts, allPlans, subscriptions] = await Promise.all([
      prisma.product.findMany({
        include: {
          variants: true,
          plans: true,
        },
      }),

      prisma.plan.findMany({
        include: {
          product: {
            select: { id: true, name: true, code: true, brand: true },
          },
        },
      }),

      prisma.subscription.findMany({
        select: {
          id: true,
          planId: true,
          status: true,
          subtotal: true,
          totalAmount: true,
          plan: {
            select: { productId: true },
          },
        },
      }),
    ]);

    // Map plans subscription stats
    const planStats = allPlans.map((plan) => {
      const planSubs = subscriptions.filter((s) => s.planId === plan.id);
      const activeSubs = planSubs.filter((s) => s.status === SubscriptionStatus.ACTIVE);
      const totalRevenue = planSubs.reduce((acc, curr) => acc + Number(curr.totalAmount), 0);

      return {
        id: plan.id,
        name: plan.name,
        code: plan.code,
        price: Number(plan.price),
        currency: plan.currency,
        billingFrequency: plan.billingFrequency,
        productName: plan.product?.name || 'Unknown',
        productBrand: plan.product?.brand || 'Brightloop',
        activeSubscribersCount: activeSubs.length,
        totalSubscribersCount: planSubs.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        hasActiveSubscriptions: activeSubs.length > 0,
      };
    });

    // Map products subscription stats
    const productStats = allProducts.map((prod) => {
      const prodSubs = subscriptions.filter((s) => s.plan?.productId === prod.id);
      const activeSubs = prodSubs.filter((s) => s.status === SubscriptionStatus.ACTIVE);
      const totalRevenue = prodSubs.reduce((acc, curr) => acc + Number(curr.totalAmount), 0);

      return {
        id: prod.id,
        name: prod.name,
        code: prod.code,
        category: prod.category || 'General',
        brand: prod.brand || 'Brightloop',
        variantsCount: prod.variants.length,
        plansCount: prod.plans.length,
        activeSubscribersCount: activeSubs.length,
        totalSubscribersCount: prodSubs.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        hasActiveSubscriptions: activeSubs.length > 0,
      };
    });

    const topPlans = [...planStats].sort((a, b) => b.activeSubscribersCount - a.activeSubscribersCount);
    const topProducts = [...productStats].sort((a, b) => b.activeSubscribersCount - a.activeSubscribersCount);
    const unusedPlans = planStats.filter((p) => !p.hasActiveSubscriptions);
    const unusedProducts = productStats.filter((p) => !p.hasActiveSubscriptions);

    return {
      totalProducts: allProducts.length,
      totalPlans: allPlans.length,
      topProducts,
      topPlans,
      unusedProducts,
      unusedPlans,
    };
  }

  /**
   * Monthly Revenue Trend (Last 6 months or 12 months)
   */
  async getMonthlyRevenueTrend(monthsCount = 6) {
    const months = Math.min(Math.max(monthsCount, 3), 24);
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - (months - 1));
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const payments = await prisma.payment.findMany({
      where: {
        status: PaymentStatus.SUCCESS,
        paymentDate: { gte: startDate },
      },
      select: {
        amount: true,
        paymentDate: true,
      },
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap: Record<string, { month: string; revenue: number; count: number }> = {};

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthlyMap[key] = { month: label, revenue: 0, count: 0 };
    }

    payments.forEach((p) => {
      const key = `${p.paymentDate.getFullYear()}-${String(p.paymentDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[key]) {
        monthlyMap[key].revenue += Number(p.amount);
        monthlyMap[key].count += 1;
      }
    });

    return Object.values(monthlyMap).map((item) => ({
      ...item,
      revenue: Math.round(item.revenue * 100) / 100,
    }));
  }

  /**
   * CSV Report Export
   */
  async exportCsvReport(type = 'summary', query?: any): Promise<{ filename: string; csv: string }> {
    const range = parseAnalyticsDateRange(query);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    if (type === 'revenue') {
      const payments = await prisma.payment.findMany({
        where: {
          paymentDate: { gte: range.startDate, lte: range.endDate },
        },
        include: {
          customer: { select: { firstName: true, lastName: true, companyName: true, email: true } },
          invoice: { select: { invoiceNumber: true } },
        },
        orderBy: { paymentDate: 'desc' },
      });

      const headers = [
        'Payment Number',
        'Invoice Number',
        'Customer Name',
        'Customer Email',
        'Company',
        'Payment Date',
        'Method',
        'Status',
        'Currency',
        'Amount',
        'Transaction Ref',
      ];

      const rows = payments.map((p) => [
        p.paymentNumber,
        p.invoice?.invoiceNumber || '',
        `${p.customer.firstName} ${p.customer.lastName}`.trim(),
        p.customer.email,
        p.customer.companyName || '',
        p.paymentDate.toISOString(),
        p.paymentMethod,
        p.status,
        p.currency,
        Number(p.amount),
        p.transactionReference || '',
      ]);

      return {
        filename: `brightloop-revenue-report-${timestamp}.csv`,
        csv: buildCsv(headers, rows),
      };
    }

    if (type === 'subscriptions') {
      const subscriptions = await prisma.subscription.findMany({
        where: {
          createdAt: { gte: range.startDate, lte: range.endDate },
        },
        include: {
          customer: { select: { firstName: true, lastName: true, companyName: true, email: true } },
          plan: { select: { name: true, billingFrequency: true, currency: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const headers = [
        'Subscription Number',
        'Customer Name',
        'Customer Email',
        'Company',
        'Plan Name',
        'Frequency',
        'Status',
        'Quantity',
        'Unit Price',
        'Subtotal',
        'Tax Amount',
        'Total Amount',
        'Start Date',
        'Next Billing Date',
        'Auto Renew',
      ];

      const rows = subscriptions.map((s) => [
        s.subscriptionNumber,
        `${s.customer.firstName} ${s.customer.lastName}`.trim(),
        s.customer.email,
        s.customer.companyName || '',
        s.plan.name,
        s.plan.billingFrequency,
        s.status,
        s.quantity,
        Number(s.unitPrice),
        Number(s.subtotal),
        Number(s.taxAmount),
        Number(s.totalAmount),
        s.startDate.toISOString(),
        s.nextBillingDate ? s.nextBillingDate.toISOString() : '',
        s.autoRenew ? 'YES' : 'NO',
      ]);

      return {
        filename: `brightloop-subscriptions-report-${timestamp}.csv`,
        csv: buildCsv(headers, rows),
      };
    }

    if (type === 'invoices') {
      const invoices = await prisma.invoice.findMany({
        where: {
          issueDate: { gte: range.startDate, lte: range.endDate },
        },
        include: {
          customer: { select: { firstName: true, lastName: true, companyName: true, email: true } },
        },
        orderBy: { issueDate: 'desc' },
      });

      const headers = [
        'Invoice Number',
        'Customer Name',
        'Customer Email',
        'Company',
        'Issue Date',
        'Due Date',
        'Status',
        'Subtotal',
        'Tax Rate (%)',
        'Tax Amount',
        'Total Amount',
        'Amount Paid',
        'Balance Due',
      ];

      const rows = invoices.map((inv) => [
        inv.invoiceNumber,
        `${inv.customer.firstName} ${inv.customer.lastName}`.trim(),
        inv.customer.email,
        inv.customer.companyName || '',
        inv.issueDate.toISOString(),
        inv.dueDate.toISOString(),
        inv.status,
        Number(inv.subtotal),
        Number(inv.taxRate),
        Number(inv.taxAmount),
        Number(inv.totalAmount),
        Number(inv.amountPaid),
        Number(inv.balanceDue),
      ]);

      return {
        filename: `brightloop-invoices-report-${timestamp}.csv`,
        csv: buildCsv(headers, rows),
      };
    }

    // Default Summary Report
    const overview = await this.getExecutiveDashboardMetrics(query);
    const headers = ['Metric Category', 'Key Performance Indicator', 'Value', 'Unit / Currency'];
    const rows = [
      ['Financials', 'Total Collected Revenue (Range)', overview.kpis.totalCollectedRevenue, 'INR'],
      ['Financials', 'Current Month Revenue', overview.kpis.currentMonthRevenue, 'INR'],
      ['Financials', 'Previous Month Revenue', overview.kpis.previousMonthRevenue, 'INR'],
      ['Financials', 'Normalized Monthly Recurring Revenue (MRR)', overview.kpis.mrr, 'INR'],
      ['Financials', 'Annualized Run Rate (ARR)', overview.kpis.arr, 'INR'],
      ['Financials', 'Total Invoiced Volume (Range)', overview.kpis.totalInvoicedAmount, 'INR'],
      ['Financials', 'Outstanding Balance (Receivables)', overview.kpis.outstandingBalanceTotal, 'INR'],
      ['Financials', 'Overdue Invoices Balance', overview.kpis.overdueInvoicesAmount, 'INR'],
      ['Subscriptions', 'Active Subscriptions Count', overview.kpis.activeSubscriptions, 'Count'],
      ['Subscriptions', 'Total Subscriptions in Portfolio', overview.kpis.totalSubscriptions, 'Count'],
      ['Subscriptions', 'Draft Subscriptions', overview.kpis.draftSubscriptions, 'Count'],
      ['Subscriptions', 'Pending Quotations', overview.kpis.quotationsPending, 'Count'],
      ['Subscriptions', 'Paused Subscriptions', overview.kpis.pausedSubscriptions, 'Count'],
      ['Subscriptions', 'Closed Subscriptions', overview.kpis.closedSubscriptions, 'Count'],
      ['Customers', 'Total Registered Customers', overview.kpis.totalCustomers, 'Count'],
      ['Customers', 'New Customers (Current Month)', overview.kpis.newCustomersThisMonth, 'Count'],
      ['Customers', 'New Customers (Previous Month)', overview.kpis.newCustomersPrevMonth, 'Count'],
      ['Invoices & Billing', 'Total Invoices Count', overview.kpis.totalInvoicesCount, 'Count'],
      ['Invoices & Billing', 'Overdue Invoices Count', overview.kpis.overdueInvoicesCount, 'Count'],
      ['Payments', 'Verified Successful Payments Count', overview.kpis.totalPaymentsCount, 'Count'],
    ];

    return {
      filename: `brightloop-analytics-summary-${timestamp}.csv`,
      csv: buildCsv(headers, rows),
    };
  }

  /**
   * PDF Report Export
   */
  async exportPdfReport(query?: any, userName = 'Administrator'): Promise<{ filename: string; buffer: Buffer }> {
    const overview = await this.getExecutiveDashboardMetrics(query);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    const topPlansWithFrequency = overview.topPlans.map((p) => ({
      name: p.planName,
      subscribersCount: p.subscribersCount,
      revenue: p.price * p.subscribersCount,
      billingFrequency: p.billingFrequency,
    }));

    const recentPaymentsFormatted = overview.recentPayments.map((p) => ({
      paymentNumber: p.paymentNumber,
      customerName: `${p.customer.firstName} ${p.customer.lastName}`.trim() || p.customer.email,
      amount: Number(p.amount),
      date: p.paymentDate.toISOString(),
      method: p.paymentMethod,
    }));

    const pdfData: PdfReportData = {
      title: 'Executive Financial & Subscription Analytics Report',
      periodLabel: overview.periodLabel,
      generatedAt: new Date(),
      generatedBy: userName,
      currency: 'INR',
      kpis: {
        totalRevenue: overview.kpis.totalCollectedRevenue,
        currentMonthRevenue: overview.kpis.currentMonthRevenue,
        mrr: overview.kpis.mrr,
        arr: overview.kpis.arr,
        totalSubscriptions: overview.kpis.totalSubscriptions,
        activeSubscriptions: overview.kpis.activeSubscriptions,
        totalCustomers: overview.kpis.totalCustomers,
        newCustomersThisMonth: overview.kpis.newCustomersThisMonth,
        invoicedTotal: overview.kpis.totalInvoicedAmount,
        outstandingBalance: overview.kpis.outstandingBalanceTotal,
        overdueInvoicesCount: overview.kpis.overdueInvoicesCount,
      },
      subscriptionStatusCounts: overview.statusDistribution,
      topPlans: topPlansWithFrequency,
      recentPayments: recentPaymentsFormatted,
    };

    const buffer = await generateAnalyticsPdf(pdfData);

    return {
      filename: `brightloop-executive-report-${timestamp}.pdf`,
      buffer,
    };
  }
}

export const analyticsService = new AnalyticsService();
