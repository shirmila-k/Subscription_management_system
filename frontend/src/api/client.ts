const API_BASE = 'http://localhost:5000/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('brightloop_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = json?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return json.data !== undefined ? json.data : json;
}

export const api = {
  // Auth
  login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<any>('/auth/me'),
  forgotPassword: (email: string) => request<any>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (data: any) => request<any>('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),

  // Products & Variants
  getProducts: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return request<any[]>(`/products${query ? `?${query}` : ''}`);
  },
  getProductById: (id: string) => request<any>(`/products/${id}`),
  createProduct: (data: any) => request<any>('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) => request<any>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: string) => request<any>(`/products/${id}`, { method: 'DELETE' }),
  addVariant: (productId: string, data: any) => request<any>(`/products/${productId}/variants`, { method: 'POST', body: JSON.stringify(data) }),

  // Plans
  getPlans: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return request<any[]>(`/plans${query ? `?${query}` : ''}`);
  },
  getPlanById: (id: string) => request<any>(`/plans/${id}`),
  createPlan: (data: any) => request<any>('/plans', { method: 'POST', body: JSON.stringify(data) }),
  updatePlan: (id: string, data: any) => request<any>(`/plans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePlan: (id: string) => request<any>(`/plans/${id}`, { method: 'DELETE' }),

  // Discounts
  getDiscounts: () => request<any[]>('/discounts'),
  createDiscount: (data: any) => request<any>('/discounts', { method: 'POST', body: JSON.stringify(data) }),
  deleteDiscount: (id: string) => request<any>(`/discounts/${id}`, { method: 'DELETE' }),
  validateDiscount: (code: string, quantity: number, subtotal: number) =>
    request<any>('/discounts/validate', {
      method: 'POST',
      body: JSON.stringify({ code, quantity, subtotal }),
    }),

  // Subscriptions & Lifecycle
  getSubscriptions: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return request<any[]>(`/subscriptions${query ? `?${query}` : ''}`);
  },
  getSubscriptionById: (id: string) => request<any>(`/subscriptions/${id}`),
  createSubscription: (data: any) => request<any>('/subscriptions', { method: 'POST', body: JSON.stringify(data) }),
  sendQuotation: (id: string) => request<any>(`/subscriptions/${id}/send-quote`, { method: 'POST' }),
  acceptQuotation: (id: string) => request<any>(`/subscriptions/${id}/accept-quote`, { method: 'POST' }),
  activateSubscription: (id: string) => request<any>(`/subscriptions/${id}/activate`, { method: 'POST' }),
  pauseSubscription: (id: string, reason?: string) =>
    request<any>(`/subscriptions/${id}/pause`, { method: 'POST', body: JSON.stringify({ reason }) }),
  resumeSubscription: (id: string) => request<any>(`/subscriptions/${id}/resume`, { method: 'POST' }),
  closeSubscription: (id: string, reason?: string) =>
    request<any>(`/subscriptions/${id}/close`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Invoices & Billing
  getInvoices: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return request<any[]>(`/invoices${query ? `?${query}` : ''}`);
  },
  getInvoiceById: (id: string) => request<any>(`/invoices/${id}`),
  generateInvoice: (subscriptionId: string) =>
    request<any>('/invoices/generate', { method: 'POST', body: JSON.stringify({ subscriptionId }) }),
  getInvoicePdfUrl: (id: string) => `${API_BASE}/invoices/${id}/pdf`,

  // Payments
  getPayments: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return request<any[]>(`/payments${query ? `?${query}` : ''}`);
  },
  recordPayment: (data: any) => request<any>('/payments', { method: 'POST', body: JSON.stringify(data) }),

  // Analytics
  getAnalyticsOverview: () => request<any>('/analytics/overview'),
  getRevenueTrend: () => request<any[]>('/analytics/revenue-trend'),

  // Jobs
  triggerBilling: () => request<any>('/jobs/run-billing', { method: 'POST' }),
  triggerReminders: () => request<any>('/jobs/run-reminders', { method: 'POST' }),
  triggerClosures: () => request<any>('/jobs/run-closures', { method: 'POST' }),
  triggerOverdue: () => request<any>('/jobs/run-overdue', { method: 'POST' }),
};
