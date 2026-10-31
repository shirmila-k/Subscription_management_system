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
  canCloseEarly: boolean;
  autoRenew: boolean;
  trialDays: number;
  isActive: boolean;
  product?: Product;
  variant?: ProductVariant;
  createdAt?: string;
  updatedAt?: string;
}

export type Customer = User;

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
    companyName?: string | null;
  };
  invoice?: {
    invoiceNumber: string;
    totalAmount: number;
    status: InvoiceStatus;
  };
}

export interface AnalyticsOverview {
  executionTimeMs: number;
  mrr?: number;
  arr?: number;
  activeSubscriptions?: number;
  totalRevenue?: number;
  totalSubscriptions?: number;
  kpis: {
    totalSubscriptions: number;
    activeSubscriptions: number;
    quotationsPending: number;
    draftSubscriptions: number;
    pausedSubscriptions: number;
    closedSubscriptions: number;
    cancelledSubscriptions?: number;
    mrr: number;
    arr: number;
    grossCollectedRevenue?: number;
    totalRefunded?: number;
    netCollectedRevenue?: number;
    totalCollectedRevenue: number;
    totalPaymentsCount: number;
    totalRefundsCount?: number;
    overdueInvoicesCount: number;
    overdueInvoicesAmount: number;
    outstandingBalanceTotal: number;
    totalInvoiced?: number;
    realizationRate?: number;
    arpu?: number;
    churnRate?: number;
    activeCustomersCount?: number;
  };
  statusDistribution: Record<string, number>;
  topPlans: {
    planId: string;
    planName: string;
    billingFrequency?: string;
    price: number;
    subscribersCount: number;
    estimatedMRR?: number;
  }[];
  recentActivity: any[];
  dataQuality?: {
    persistedPaymentsTracked: boolean;
    hasSufficientHistory: boolean;
  };
}

export interface MonthlyRevenueTrendItem {
  month: string;
  grossRevenue: number;
  refunds: number;
  revenue: number;
  netRevenue: number;
  paymentCount: number;
  refundCount: number;
}

export interface ChurnAnalytics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  closedSubscriptions: number;
  cancelledSubscriptions: number;
  pausedSubscriptions: number;
  otherSubscriptions: number;
  churnRatePercentage: number;
  retentionRatePercentage: number;
  activeMRR: number;
  churnedMRRLoss: number;
  cancellationReasons: { reason: string; count: number }[];
  insufficientHistory: boolean;
}

export interface PaymentMethodItem {
  method: string;
  grossCollected: number;
  refundedAmount: number;
  netCollected: number;
  transactionCount: number;
  successCount: number;
  refundCount: number;
  percentage: number;
}

export interface PaymentMethodBreakdownResponse {
  totalNetCollected: number;
  methods: PaymentMethodItem[];
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

// -------------------------------------------------------------
// PHASE 6: NOTIFICATIONS & EMAIL AUTOMATION
// -------------------------------------------------------------

export type NotificationStatus = 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED' | 'CANCELLED';

export type NotificationEventType =
  | 'SUBSCRIPTION_QUOTATION'
  | 'SUBSCRIPTION_CONFIRMED'
  | 'SUBSCRIPTION_ACTIVATED'
  | 'SUBSCRIPTION_PAUSED'
  | 'SUBSCRIPTION_RESUMED'
  | 'SUBSCRIPTION_CLOSED'
  | 'SUBSCRIPTION_RENEWED'
  | 'SUBSCRIPTION_EXPIRING_SOON'
  | 'INVOICE_GENERATED'
  | 'INVOICE_DUE_SOON'
  | 'INVOICE_OVERDUE'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_REFUNDED';

export interface NotificationItem {
  id: string;
  customerId?: string | null;
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    companyName?: string | null;
  } | null;
  recipientEmail: string;
  recipientName?: string | null;
  eventType: NotificationEventType;
  subject: string;
  bodyText?: string | null;
  bodyHtml?: string | null;
  status: NotificationStatus;
  attemptCount: number;
  maxAttempts: number;
  scheduledAt: string;
  sentAt?: string | null;
  lastAttemptAt?: string | null;
  nextRetryAt?: string | null;
  relatedSubscriptionId?: string | null;
  relatedInvoiceId?: string | null;
  relatedPaymentId?: string | null;
  idempotencyKey?: string | null;
  providerMessageId?: string | null;
  lastError?: string | null;
  isSimulated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationStats {
  total: number;
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  cancelled: number;
}

