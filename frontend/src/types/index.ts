export type Role = 'ADMIN' | 'STAFF' | 'CUSTOMER';

export type BillingFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export type SubscriptionStatus =
  | 'DRAFT'
  | 'QUOTATION'
  | 'CONFIRMED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'CLOSED';

export type InvoiceStatus =
  | 'DRAFT'
  | 'CONFIGURED'
  | 'CONFIRMED'
  | 'PAID'
  | 'OVERDUE'
  | 'VOID';

export type PaymentMethod =
  | 'RAZORPAY'
  | 'STRIPE'
  | 'CREDIT_CARD'
  | 'BANK_TRANSFER'
  | 'CASH';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  companyName?: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  attributes?: Record<string, any>;
  extraCost: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  brand?: string;
  category?: string;
  isActive: boolean;
  variants?: ProductVariant[];
  plans?: Plan[];
}

export interface Plan {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  description?: string;
  billingFrequency: BillingFrequency;
  cost: number;
  currency: string;
  minimumQuantity: number;
  validFrom?: string;
  validUntil?: string;
  autoClose: boolean;
  autoRenew: boolean;
  pauseAllowed: boolean;
  trialPeriodDays: number;
  gracePeriodDays: number;
  isActive: boolean;
  product?: Product;
  variant?: ProductVariant;
}

export interface SubscriptionItem {
  id: string;
  subscriptionId: string;
  variantId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Subscription {
  id: string;
  subscriptionNumber: string;
  customerId: string;
  planId: string;
  status: SubscriptionStatus;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  totalAmount: number;
  paymentTerms: string;
  startDate?: string;
  expiryDate?: string;
  nextBillingDate?: string;
  lastBilledDate?: string;
  cancellationReason?: string;
  quotationNotes?: string;
  quotationExpiresAt?: string;
  createdAt: string;
  customer?: User;
  plan?: Plan;
  discount?: Discount;
  items?: SubscriptionItem[];
  invoices?: Invoice[];
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  subscriptionId?: string;
  customerId: string;
  status: InvoiceStatus;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  paidAt?: string;
  customer?: User;
  subscription?: Subscription;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  customerId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  transactionReference?: string;
  paymentDate: string;
  notes?: string;
}

export interface Discount {
  id: string;
  code: string;
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
  minQuantity: number;
  minPurchaseAmount: number;
  startDate: string;
  endDate: string;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
}

export interface AnalyticsSummary {
  metrics: {
    activeSubscriptions: number;
    totalCustomers: number;
    mrr: number;
    arr: number;
    totalRevenueCollected: number;
    totalPaymentsCount: number;
    overdueInvoicesCount: number;
    overdueInvoicesAmount: number;
  };
  statusDistribution: Record<string, number>;
  recentSubscriptions: Subscription[];
  performance: {
    executionTimeMs: number;
    targetUnderMs: number;
  };
}
