import axiosClient from '../api/axiosClient';
import {
  User,
  Product,
  Plan,
  Subscription,
  Invoice,
  Payment,
  Discount,
  Quotation,
  QuotationTemplate,
  AnalyticsOverview,
  RevenueAnalytics,
  SubscriptionAnalytics,
  CustomerAnalytics,
  BillingAnalytics,
  ProductAnalytics,
} from '../types';

export const authService = {
  login: (data: { email: string; password: string }) =>
    axiosClient.post<{ user: User; token: string }>('/auth/login', data) as unknown as Promise<{
      user: User;
      token: string;
    }>,
  register: (data: any) =>
    axiosClient.post<{ user: User; token: string }>('/auth/register', data) as unknown as Promise<{
      user: User;
      token: string;
    }>,
  getMe: () => axiosClient.get<User>('/auth/me') as unknown as Promise<User>,
  forgotPassword: (email: string) =>
    axiosClient.post<{ message: string }>('/auth/forgot-password', { email }) as unknown as Promise<{
      message: string;
    }>,
  resetPassword: (data: any) =>
    axiosClient.post<{ message: string }>('/auth/reset-password', data) as unknown as Promise<{
      message: string;
    }>,
};

export const productService = {
  getProducts: (params?: any) =>
    axiosClient.get<Product[]>('/products', { params }) as unknown as Promise<Product[]>,
  getAll: (params?: any) =>
    axiosClient.get<Product[]>('/products', { params }) as unknown as Promise<Product[]>,
  getProductById: (id: string) =>
    axiosClient.get<Product>(`/products/${id}`) as unknown as Promise<Product>,
  createProduct: (data: any) =>
    axiosClient.post<Product>('/products', data) as unknown as Promise<Product>,
  create: (data: any) =>
    axiosClient.post<Product>('/products', data) as unknown as Promise<Product>,
  updateProduct: (id: string, data: any) =>
    axiosClient.put<Product>(`/products/${id}`, data) as unknown as Promise<Product>,
  deleteProduct: (id: string) =>
    axiosClient.delete(`/products/${id}`) as unknown as Promise<void>,
  addVariant: (productId: string, data: any) =>
    axiosClient.post(`/products/${productId}/variants`, data) as unknown as Promise<any>,
};

export const planService = {
  getPlans: (params?: any) =>
    axiosClient.get<Plan[]>('/plans', { params }) as unknown as Promise<Plan[]>,
  getAll: (params?: any) =>
    axiosClient.get<Plan[]>('/plans', { params }) as unknown as Promise<Plan[]>,
  getPlanById: (id: string) =>
    axiosClient.get<Plan>(`/plans/${id}`) as unknown as Promise<Plan>,
  createPlan: (data: any) =>
    axiosClient.post<Plan>('/plans', data) as unknown as Promise<Plan>,
  create: (data: any) =>
    axiosClient.post<Plan>('/plans', data) as unknown as Promise<Plan>,
  updatePlan: (id: string, data: any) =>
    axiosClient.put<Plan>(`/plans/${id}`, data) as unknown as Promise<Plan>,
  deletePlan: (id: string) =>
    axiosClient.delete(`/plans/${id}`) as unknown as Promise<void>,
};

export const subscriptionService = {
  getSubscriptions: (params?: any) =>
    axiosClient.get<Subscription[]>('/subscriptions', { params }) as unknown as Promise<Subscription[]>,
  getAll: (params?: any) =>
    axiosClient.get<Subscription[]>('/subscriptions', { params }) as unknown as Promise<Subscription[]>,
  getSubscriptionById: (id: string) =>
    axiosClient.get<Subscription>(`/subscriptions/${id}`) as unknown as Promise<Subscription>,
  createSubscription: (data: any) =>
    axiosClient.post<Subscription>('/subscriptions', data) as unknown as Promise<Subscription>,
  create: (data: any) =>
    axiosClient.post<Subscription>('/subscriptions', data) as unknown as Promise<Subscription>,
  sendQuotation: (id: string) =>
    axiosClient.post<Subscription>(`/subscriptions/${id}/send-quote`) as unknown as Promise<Subscription>,
  acceptQuotation: (id: string) =>
    axiosClient.post<Subscription>(`/subscriptions/${id}/accept-quote`) as unknown as Promise<Subscription>,
  activateSubscription: (id: string) =>
    axiosClient.post<Subscription>(`/subscriptions/${id}/activate`) as unknown as Promise<Subscription>,
  renew: (id: string) =>
    axiosClient.post<Subscription>(`/subscriptions/${id}/activate`) as unknown as Promise<Subscription>,
  pauseSubscription: (id: string, reason?: string) =>
    axiosClient.post<Subscription>(`/subscriptions/${id}/pause`, { reason }) as unknown as Promise<Subscription>,
  pause: (id: string, reason?: string) =>
    axiosClient.post<Subscription>(`/subscriptions/${id}/pause`, { reason }) as unknown as Promise<Subscription>,
  resumeSubscription: (id: string) =>
    axiosClient.post<Subscription>(`/subscriptions/${id}/resume`) as unknown as Promise<Subscription>,
  resume: (id: string) =>
    axiosClient.post<Subscription>(`/subscriptions/${id}/resume`) as unknown as Promise<Subscription>,
  closeSubscription: (id: string, reason?: string) =>
    axiosClient.post<Subscription>(`/subscriptions/${id}/close`, { reason }) as unknown as Promise<Subscription>,
  close: (id: string, reason?: string) =>
    axiosClient.post<Subscription>(`/subscriptions/${id}/close`, { reason }) as unknown as Promise<Subscription>,
};

export const quotationService = {
  getQuotations: (params?: any) =>
    axiosClient.get<Quotation[]>('/quotations', { params }) as unknown as Promise<Quotation[]>,
  getAll: (params?: any) =>
    axiosClient.get<Quotation[]>('/quotations', { params }) as unknown as Promise<Quotation[]>,
  getById: (id: string) =>
    axiosClient.get<Quotation>(`/quotations/${id}`) as unknown as Promise<Quotation>,
  create: (data: any) =>
    axiosClient.post<Quotation>('/quotations', data) as unknown as Promise<Quotation>,
  update: (id: string, data: any) =>
    axiosClient.put<Quotation>(`/quotations/${id}`, data) as unknown as Promise<Quotation>,
  send: (id: string) =>
    axiosClient.post<Quotation>(`/quotations/${id}/send`) as unknown as Promise<Quotation>,
  accept: (id: string) =>
    axiosClient.post<Quotation>(`/quotations/${id}/accept`) as unknown as Promise<Quotation>,
  reject: (id: string, reason?: string) =>
    axiosClient.post<Quotation>(`/quotations/${id}/reject`, { reason }) as unknown as Promise<Quotation>,
  convertToSubscription: (id: string, data?: any) =>
    axiosClient.post<Subscription>(`/quotations/${id}/convert`, data) as unknown as Promise<Subscription>,
};

export const quotationTemplateService = {
  getAll: (params?: any) =>
    axiosClient.get<QuotationTemplate[]>('/quotation-templates', { params }) as unknown as Promise<QuotationTemplate[]>,
  getById: (id: string) =>
    axiosClient.get<QuotationTemplate>(`/quotation-templates/${id}`) as unknown as Promise<QuotationTemplate>,
  create: (data: any) =>
    axiosClient.post<QuotationTemplate>('/quotation-templates', data) as unknown as Promise<QuotationTemplate>,
  update: (id: string, data: any) =>
    axiosClient.put<QuotationTemplate>(`/quotation-templates/${id}`, data) as unknown as Promise<QuotationTemplate>,
  delete: (id: string) =>
    axiosClient.delete(`/quotation-templates/${id}`) as unknown as Promise<void>,
};

export const invoiceService = {
  getInvoices: (params?: any) =>
    axiosClient.get<Invoice[]>('/invoices', { params }) as unknown as Promise<Invoice[]>,
  getAll: (params?: any) =>
    axiosClient.get<Invoice[]>('/invoices', { params }) as unknown as Promise<Invoice[]>,
  getInvoiceById: (id: string) =>
    axiosClient.get<Invoice>(`/invoices/${id}`) as unknown as Promise<Invoice>,
  generateInvoice: (subscriptionId: string) =>
    axiosClient.post<Invoice>('/invoices/generate', { subscriptionId }) as unknown as Promise<Invoice>,
  getPdfUrl: (id: string) => `${axiosClient.defaults.baseURL}/invoices/${id}/pdf`,
  downloadPdf: async (id: string, customFilename?: string): Promise<void> => {
    const token = localStorage.getItem('brightloop_token');
    const baseURL = axiosClient.defaults.baseURL || '/api/v1';
    const response = await fetch(`${baseURL}/invoices/${id}/pdf`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `Failed to download invoice PDF (status ${response.status})`);
    }

    let filename = customFilename || `invoice-${id}.pdf`;
    const disposition = response.headers.get('Content-Disposition');
    if (!customFilename && disposition) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(link);
  },
};

export const paymentService = {
  getPayments: (params?: any) =>
    axiosClient.get<Payment[]>('/payments', { params }) as unknown as Promise<Payment[]>,
  getAll: (params?: any) =>
    axiosClient.get<Payment[]>('/payments', { params }) as unknown as Promise<Payment[]>,
  recordPayment: (data: any) =>
    axiosClient.post<Payment>('/payments', data) as unknown as Promise<Payment>,
  create: (data: any) =>
    axiosClient.post<Payment>('/payments', data) as unknown as Promise<Payment>,
};

export const discountService = {
  getDiscounts: (params?: any) =>
    axiosClient.get<Discount[]>('/discounts', { params }) as unknown as Promise<Discount[]>,
  getAll: (params?: any) =>
    axiosClient.get<Discount[]>('/discounts', { params }) as unknown as Promise<Discount[]>,
  getById: (id: string) =>
    axiosClient.get<Discount>(`/discounts/${id}`) as unknown as Promise<Discount>,
  createDiscount: (data: any) =>
    axiosClient.post<Discount>('/discounts', data) as unknown as Promise<Discount>,
  create: (data: any) =>
    axiosClient.post<Discount>('/discounts', data) as unknown as Promise<Discount>,
  update: (id: string, data: any) =>
    axiosClient.put<Discount>(`/discounts/${id}`, data) as unknown as Promise<Discount>,
  deleteDiscount: (id: string) =>
    axiosClient.delete(`/discounts/${id}`) as unknown as Promise<void>,
  validateDiscount: (code: string, quantity: number, subtotal: number) =>
    axiosClient.post<any>('/discounts/validate', { code, quantity, subtotal }) as unknown as Promise<any>,
};

export const analyticsService = {
  getOverview: async (params?: any): Promise<AnalyticsOverview> => {
    const res = await (axiosClient.get<AnalyticsOverview>('/analytics/overview', { params }) as unknown as Promise<AnalyticsOverview>);
    if (res && res.kpis) {
      res.mrr = res.kpis.mrr;
      res.arr = res.kpis.arr;
      res.activeSubscriptions = res.kpis.activeSubscriptions;
      res.totalRevenue = res.kpis.totalCollectedRevenue;
      res.totalSubscriptions = res.kpis.totalSubscriptions;
    }
    return res;
  },

  getRevenue: (params?: any): Promise<RevenueAnalytics> => {
    return axiosClient.get<RevenueAnalytics>('/analytics/revenue', { params }) as unknown as Promise<RevenueAnalytics>;
  },

  getSubscriptions: (params?: any): Promise<SubscriptionAnalytics> => {
    return axiosClient.get<SubscriptionAnalytics>('/analytics/subscriptions', { params }) as unknown as Promise<SubscriptionAnalytics>;
  },

  getCustomers: (params?: any): Promise<CustomerAnalytics> => {
    return axiosClient.get<CustomerAnalytics>('/analytics/customers', { params }) as unknown as Promise<CustomerAnalytics>;
  },

  getBilling: (params?: any): Promise<BillingAnalytics> => {
    return axiosClient.get<BillingAnalytics>('/analytics/billing', { params }) as unknown as Promise<BillingAnalytics>;
  },

  getProducts: (): Promise<ProductAnalytics> => {
    return axiosClient.get<ProductAnalytics>('/analytics/products') as unknown as Promise<ProductAnalytics>;
  },

  getRevenueTrend: (months = 6): Promise<any[]> => {
    return axiosClient.get<any[]>('/analytics/revenue-trend', { params: { months } }) as unknown as Promise<any[]>;
  },

  downloadCsv: async (type = 'summary', params?: any) => {
    const token = localStorage.getItem('brightloop_token');
    const query = new URLSearchParams({ type, ...params }).toString();
    const response = await fetch(`/api/v1/analytics/export/csv?${query}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to generate CSV export');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brightloop-${type}-report-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  downloadPdf: async (params?: any) => {
    const token = localStorage.getItem('brightloop_token');
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`/api/v1/analytics/export/pdf${query ? `?${query}` : ''}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to generate PDF report');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brightloop-executive-analytics-${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

export const customerService = {
  getCustomers: async () => {
    const subs = await subscriptionService.getSubscriptions();
    const customerMap = new Map<string, any>();
    subs.forEach((s) => {
      if (s.customer && !customerMap.has(s.customer.id)) {
        customerMap.set(s.customer.id, {
          ...s.customer,
          activeSubscriptionsCount: subs.filter((x) => x.customerId === s.customerId && x.status === 'ACTIVE').length,
          totalRevenue: subs
            .filter((x) => x.customerId === s.customerId)
            .reduce((acc, curr) => acc + Number(curr.totalAmount), 0),
        });
      }
    });
    return Array.from(customerMap.values());
  },
  getAll: async () => {
    return customerService.getCustomers();
  },
  create: async (data: any) => {
    return data;
  },
};
