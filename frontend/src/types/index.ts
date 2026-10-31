export type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyName?: string | null;
  phone?: string | null;
  address?: string | null;
  taxId?: string | null;
  isActive: boolean;
  createdAt: string;
}

export type BillingFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export type SubscriptionStatus =
  | 'DRAFT'
  | 'QUOTATION'
  | 'CONFIRMED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'CLOSED'
  | 'CANCELLED';

export type PaymentTerms = 'IMMEDIATE' | 'NET_15' | 'NET_30' | 'NET_60';

export type InvoiceStatus = 'DRAFT' | 'CONFIRMED' | 'PAID' | 'OVERDUE' | 'VOID';

export type DiscountType = 'PERCENTAGE' | 'FIXED';

export type PaymentMethod =
  | 'CREDIT_CARD'
  | 'BANK_TRANSFER'
  | 'UPI'
  | 'RAZORPAY'
  | 'STRIPE'
  | 'CASH';

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  priceAdjustment: number;
  attributes?: Record<string, any>;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  category?: string | null;
  brand?: string | null;
  isActive: boolean;
  variants?: ProductVariant[];
  plans?: Plan[];
  createdAt: string;
}

export interface Plan {
  id: string;
  productId: string;
  variantId?: string | null;
  name: string;
  code: string;
  description?: string | null;
  billingFrequency: BillingFrequency;
  billingCycleDays: number;
  price: number;
  currency: string;
  minQuantity: number;
  availableFrom?: string | null;
  availableTo?: string | null;
  autoCloseOnExpiry: boolean;
  canPause: boolean;
  autoRenew: boolean;
  trialDays: number;
  isActive: boolean;
  product?: Product;
  variant?: ProductVariant;
}

export interface Discount {
  id: string;
  name?: string | null;
  code: string;
  description?: string | null;
  type: DiscountType;
  value: number;
  minQuantity: number;
  minPurchaseAmount?: number | null;
  maxDiscountAmount?: number | null;
  startDate: string;
  endDate?: string | null;
  validFrom?: string | null;
  validUntil?: string | null;
  usageLimit?: number | null;
  maxUsage?: number | null;
  timesUsed: number;
  usedCount?: number;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  subscriptionNumber: string;
  customerId: string;
  planId: string;
  status: SubscriptionStatus;
  quantity: number;
  unitPrice: number;
  discountId?: string | null;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  totalAmount: number;
  paymentTerms: PaymentTerms;
  startDate: string;
  nextBillingDate?: string | null;
  expiryDate?: string | null;
  autoRenew: boolean;
  quotationSentAt?: string | null;
  quotationAcceptedAt?: string | null;
  confirmedAt?: string | null;
  activatedAt?: string | null;
  pausedAt?: string | null;
  closedAt?: string | null;
  cancellationReason?: string | null;
  notes?: string | null;
  createdAt: string;
  customer?: User;
  plan?: Plan;
  product?: Product;
  discount?: Discount | null;
  invoices?: Invoice[];
  lifecycleLogs?: {
    id: string;
    fromStatus: SubscriptionStatus;
    toStatus: SubscriptionStatus;
    action: string;
    notes?: string | null;
    createdAt: string;
  }[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  subscriptionId: string;
  customerId: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  notes?: string | null;
  customer?: User;
  items?: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
  subscription?: {
    subscriptionNumber: string;
    status: SubscriptionStatus;
  };
}

export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  customerId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: string;
  paymentDate: string;
  transactionReference?: string | null;
  transactionRef?: string | null;
  notes?: string | null;
  customer?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  invoice?: {
    invoiceNumber: string;
    totalAmount: number;
    status: InvoiceStatus;
  };
}

export interface AnalyticsOverview {
  executionTimeMs: number;
  period: string;
  periodLabel: string;
  startDate: string;
  endDate: string;
  currency: string;
  currencySymbol: string;
  mrr?: number;
  arr?: number;
  activeSubscriptions?: number;
  totalRevenue?: number;
  totalSubscriptions?: number;
  kpis: {
    totalCollectedRevenue: number;
    currentMonthRevenue: number;
    previousMonthRevenue: number;
    revenueGrowthPercent: number;
    mrr: number;
    arr: number;
    totalSubscriptions: number;
    activeSubscriptions: number;
    quotationsPending: number;
    draftSubscriptions: number;
    pausedSubscriptions: number;
    closedSubscriptions: number;
    cancelledSubscriptions: number;
    totalCustomers: number;
    newCustomersThisMonth: number;
    newCustomersPrevMonth: number;
    totalInvoicedAmount: number;
    totalInvoicesCount: number;
    outstandingBalanceTotal: number;
    overdueInvoicesCount: number;
    overdueInvoicesAmount: number;
    totalPaymentsCount: number;
  };
  statusDistribution: Record<string, number>;
  topPlans: {
    planId: string;
    planName: string;
    price: number;
    billingFrequency: string;
    subscribersCount: number;
  }[];
  recentSubscriptions: any[];
  recentPayments: any[];
  upcomingRenewals: any[];
}

export interface RevenueAnalytics {
  period: string;
  periodLabel: string;
  startDate: string;
  endDate: string;
  currency: string;
  currencySymbol: string;
  totalCollectedRevenue: number;
  refundedRevenue: number;
  netRevenue: number;
  paymentTransactionsCount: number;
  revenueTrend: Array<{ label: string; revenue: number; count: number }>;
  revenueByProduct: Array<{ name: string; code: string; revenue: number; count: number }>;
  revenueByPlan: Array<{ name: string; revenue: number; count: number }>;
  revenueByPaymentMethod: Array<{ method: string; revenue: number; count: number }>;
}

export interface SubscriptionAnalytics {
  period: string;
  periodLabel: string;
  totalSubscriptions: number;
  activeSubscriptions: number;
  pendingSubscriptions: number;
  pausedSubscriptions: number;
  closedSubscriptions: number;
  cancelledSubscriptions: number;
  retentionRate: number;
  statusCounts: Record<string, number>;
  subscriptionsCreatedTrend: Array<{ label: string; count: number }>;
  upcomingRenewals: Array<{
    id: string;
    subscriptionNumber: string;
    customerName: string;
    companyName?: string | null;
    email: string;
    planName: string;
    price: number;
    nextBillingDate?: string | null;
    autoRenew: boolean;
  }>;
}

export interface CustomerAnalytics {
  period: string;
  periodLabel: string;
  totalCustomers: number;
  newCustomersThisMonth: number;
  newCustomersPrevMonth: number;
  customerGrowthMoM: number;
  customersWithActiveSubscriptions: number;
  customersWithOverduePaymentsCount: number;
  customerGrowthTrend: Array<{ label: string; count: number }>;
  overdueCustomers: Array<{
    customerId: string;
    customerName: string;
    companyName: string | null;
    email: string;
    overdueInvoiceCount: number;
    totalOverdueAmount: number;
  }>;
}

export interface BillingAnalytics {
  period: string;
  periodLabel: string;
  currency: string;
  currencySymbol: string;
  totalInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  overdueInvoices: number;
  draftInvoices: number;
  voidInvoices: number;
  invoiceStatusDistribution: Record<string, number>;
  totalInvoicedAmount: number;
  totalCollectedRevenue: number;
  totalOutstandingBalance: number;
  overdueInvoicesAmount: number;
  collectionEfficiencyPercent: number;
  paymentsSummary: {
    totalPayments: number;
    successful: { count: number; amount: number };
    pending: { count: number; amount: number };
    failed: { count: number; amount: number };
    refunded: { count: number; amount: number };
  };
}

export interface ProductAnalytics {
  totalProducts: number;
  totalPlans: number;
  topProducts: Array<{
    id: string;
    name: string;
    code: string;
    category: string;
    brand: string;
    variantsCount: number;
    plansCount: number;
    activeSubscribersCount: number;
    totalSubscribersCount: number;
    totalRevenue: number;
    hasActiveSubscriptions: boolean;
  }>;
  topPlans: Array<{
    id: string;
    name: string;
    code: string;
    price: number;
    currency: string;
    billingFrequency: string;
    productName: string;
    productBrand: string;
    activeSubscribersCount: number;
    totalSubscribersCount: number;
    totalRevenue: number;
    hasActiveSubscriptions: boolean;
  }>;
  unusedProducts: any[];
  unusedPlans: any[];
}

export type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED';

export interface QuotationItem {
  id?: string;
  quotationId?: string;
  productId?: string | null;
  product?: Product;
  variantId?: string | null;
  variant?: ProductVariant;
  planId?: string | null;
  plan?: Plan;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxAmount?: number;
  lineTotal: number;
}

export interface QuotationTemplate {
  id: string;
  name: string;
  description?: string | null;
  defaultTerms?: string | null;
  defaultValidityDays: number;
  defaultItems?: any[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  customer?: User;
  createdById?: string | null;
  createdBy?: User;
  templateId?: string | null;
  template?: QuotationTemplate;
  status: QuotationStatus;
  quotationDate: string;
  expiryDate: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  terms?: string | null;
  notes?: string | null;
  items: QuotationItem[];
  subscription?: {
    id: string;
    subscriptionNumber: string;
    status: SubscriptionStatus;
  } | null;
  createdAt: string;
  updatedAt: string;
}
