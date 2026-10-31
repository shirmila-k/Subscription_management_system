import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  quotationService,
  quotationTemplateService,
  customerService,
  productService,
  planService,
  discountService,
} from '../../services';
import { Quotation, QuotationTemplate, Product, Plan } from '../../types';

interface BuilderLine {
  id: string;
  productId: string;
  planId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
}

export const QuotationsPage: React.FC = () => {
  const navigate = useNavigate();

  // Data states
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [templates, setTemplates] = useState<QuotationTemplate[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters & UI states
  const [activeTab, setActiveTab] = useState<'all' | 'DRAFT' | 'SENT' | 'ACCEPTED' | 'CONVERTED' | 'EXPIRED'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Quote Builder State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [builderTerms, setBuilderTerms] = useState<string>('Payment due Net 30 days upon invoice receipt.');
  const [builderValidityDays, setBuilderValidityDays] = useState<number>(30);
  const [builderDiscountCode, setBuilderDiscountCode] = useState<string>('');
  const [builderDiscountAmount, setBuilderDiscountAmount] = useState<number>(0);
  const [builderNotes, setBuilderNotes] = useState<string>('');
  const [lineItems, setLineItems] = useState<BuilderLine[]>([
    {
      id: 'line-1',
      productId: '',
      planId: '',
      description: 'Standard SaaS Cloud Tier',
      quantity: 1,
      unitPrice: 2500,
      discountAmount: 0,
      taxAmount: 450,
    },
  ]);

  // Template Form State
  const [newTemplateData, setNewTemplateData] = useState({
    name: '',
    description: '',
    defaultTerms: 'Net 30 days. Standard SLA guarantees 99.9% availability.',
    defaultValidityDays: 30,
  });

  const loadAllData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [quotesData, templatesData, customersData, productsData, plansData] = await Promise.all([
        quotationService.getAll(),
        quotationTemplateService.getAll().catch(() => []),
        customerService.getAll().catch(() => []),
        productService.getAll().catch(() => []),
        planService.getAll().catch(() => []),
      ]);

      setQuotations(quotesData || []);
      setTemplates(templatesData || []);
      setCustomers(customersData || []);
      setProducts(productsData || []);
      setPlans(plansData || []);

      if (customersData && customersData.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(customersData[0].id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load quotations data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const showAlert = (message: string, type: 'success' | 'error' = 'success') => {
    setActionAlert({ type, message });
    setTimeout(() => setActionAlert(null), 5000);
  };

  // When a template is selected, auto-fill terms and validity
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    const t = templates.find((tpl) => tpl.id === templateId);
    if (t) {
      if (t.defaultTerms) setBuilderTerms(t.defaultTerms);
      if (t.defaultValidityDays) setBuilderValidityDays(t.defaultValidityDays);
      if (t.defaultItems && Array.isArray(t.defaultItems) && t.defaultItems.length > 0) {
        setLineItems(
          t.defaultItems.map((item: any, idx: number) => ({
            id: `line-${idx + 1}`,
            productId: item.productId || '',
            planId: item.planId || '',
            description: item.description || 'Custom Service',
            quantity: item.quantity || 1,
            unitPrice: Number(item.unitPrice) || 0,
            discountAmount: Number(item.discountAmount) || 0,
            taxAmount: Math.round(((Number(item.quantity || 1) * Number(item.unitPrice || 0) * 0.18) * 100)) / 100,
          }))
        );
      }
    }
  };

  // Add line item
  const handleAddLine = () => {
    setLineItems([
      ...lineItems,
      {
        id: `line-${Date.now()}`,
        productId: '',
        planId: '',
        description: 'New Service Line Item',
        quantity: 1,
        unitPrice: 1000,
        discountAmount: 0,
        taxAmount: 180,
      },
    ]);
  };

  // Remove line item
  const handleRemoveLine = (id: string) => {
    if (lineItems.length === 1) {
      showAlert('A quotation must contain at least one line item', 'error');
      return;
    }
    setLineItems(lineItems.filter((l) => l.id !== id));
  };

  // Update line field
  const handleUpdateLine = (id: string, field: keyof BuilderLine, value: any) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        // If product changed, update description and price
        if (field === 'productId') {
          const prod = products.find((p) => p.id === value);
          if (prod) {
            updated.description = `${prod.name}`;
          }
        }

        // If plan changed, update unitPrice and description
        if (field === 'planId') {
          const plan = plans.find((p) => p.id === value);
          if (plan) {
            updated.unitPrice = Number(plan.price);
            updated.description = `${plan.name} (${plan.billingFrequency})`;
            if (plan.productId) updated.productId = plan.productId;
          }
        }

        // Recalculate tax
        const raw = (Number(updated.quantity) || 1) * (Number(updated.unitPrice) || 0);
        const taxable = Math.max(0, raw - (Number(updated.discountAmount) || 0));
        updated.taxAmount = Math.round(((taxable * 0.18) * 100)) / 100;

        return updated;
      })
    );
  };

  // Validate discount code against server
  const handleValidateCoupon = async () => {
    if (!builderDiscountCode.trim()) return;
    try {
      const subtotalEst = lineItems.reduce(
        (sum, item) => sum + (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
        0
      );
      const totalQty = lineItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
      const res: any = await discountService.validateDiscount(
        builderDiscountCode.trim(),
        totalQty,
        subtotalEst
      );
      setBuilderDiscountAmount(res.discountAmount || 0);
      showAlert(`Coupon "${builderDiscountCode}" applied: ₹${res.discountAmount} discount!`);
    } catch (err: any) {
      showAlert(err.response?.data?.message || err.message || 'Invalid coupon code', 'error');
      setBuilderDiscountAmount(0);
    }
  };

  // Financial calculations
  const rawSubtotal = lineItems.reduce(
    (acc, item) => acc + (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
    0
  );
  const itemsDiscount = lineItems.reduce(
    (acc, item) => acc + (Number(item.discountAmount) || 0),
    0
  );
  const totalDiscount = itemsDiscount + builderDiscountAmount;
  const taxableAmount = Math.max(0, rawSubtotal - totalDiscount);
  const calculatedTax = Math.round(((taxableAmount * 0.18) * 100)) / 100;
  const grandTotal = Math.round((taxableAmount + calculatedTax) * 100) / 100;

  // Create quotation submit
  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      showAlert('Please select a customer for this quotation', 'error');
      return;
    }
    if (lineItems.length === 0) {
      showAlert('Please add at least one line item', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerId: selectedCustomerId,
        templateId: selectedTemplateId || undefined,
        validityDays: builderValidityDays,
        terms: builderTerms,
        notes: builderNotes || undefined,
        discountAmount: builderDiscountAmount,
        discountCode: builderDiscountCode || undefined,
        taxRate: 18,
        items: lineItems.map((item) => ({
          productId: item.productId || undefined,
          planId: item.planId || undefined,
          description: item.description,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          discountAmount: Number(item.discountAmount) || 0,
        })),
      };

      const created = await quotationService.create(payload);
      showAlert(`Quotation ${created.quotationNumber} generated successfully!`);
      await loadAllData();

      // Reset builder form
      setBuilderDiscountCode('');
      setBuilderDiscountAmount(0);
      setBuilderNotes('');
    } catch (err: any) {
      showAlert(err.response?.data?.message || err.message || 'Failed to create quotation', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send quotation (DRAFT -> SENT)
  const handleSendQuotation = async (id: string, quoteNumber: string) => {
    try {
      await quotationService.send(id);
      showAlert(`Quotation ${quoteNumber} issued and sent to customer.`);
      await loadAllData();
    } catch (err: any) {
      showAlert(err.response?.data?.message || err.message || 'Failed to send quotation', 'error');
    }
  };

  // Accept quotation (SENT -> ACCEPTED)
  const handleAcceptQuotation = async (id: string, quoteNumber: string) => {
    try {
      await quotationService.accept(id);
      showAlert(`Quotation ${quoteNumber} accepted! It is now eligible for subscription conversion.`);
      await loadAllData();
    } catch (err: any) {
      showAlert(err.response?.data?.message || err.message || 'Failed to accept quotation', 'error');
    }
  };

  // Reject quotation
  const handleRejectQuotation = async (id: string, quoteNumber: string) => {
    const reason = prompt(`Enter rejection reason for ${quoteNumber}:`);
    if (reason === null) return;
    try {
      await quotationService.reject(id, reason);
      showAlert(`Quotation ${quoteNumber} rejected.`);
      await loadAllData();
    } catch (err: any) {
      showAlert(err.response?.data?.message || err.message || 'Failed to reject quotation', 'error');
    }
  };

  // 🌟 CONVERT TO SUBSCRIPTION 🌟
  const handleConvertToSubscription = async (id: string, quoteNumber: string) => {
    setConvertingId(id);
    try {
      const sub = await quotationService.convertToSubscription(id, {
        paymentTerms: 'NET_30',
        autoRenew: true,
        notes: `Converted from quotation ${quoteNumber}`,
      });

      showAlert(
        `🎉 Success! Quotation ${quoteNumber} converted into confirmed subscription ${sub.subscriptionNumber}! Agreed pricing and line items are locked.`,
        'success'
      );
      await loadAllData();
    } catch (err: any) {
      showAlert(
        err.response?.data?.message || err.message || 'Quote-to-subscription conversion failed',
        'error'
      );
    } finally {
      setConvertingId(null);
    }
  };

  // Create Template submit
  const handleCreateTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateData.name) {
      showAlert('Template name is required', 'error');
      return;
    }
    try {
      await quotationTemplateService.create({
        name: newTemplateData.name,
        description: newTemplateData.description || undefined,
        defaultTerms: newTemplateData.defaultTerms,
        defaultValidityDays: Number(newTemplateData.defaultValidityDays) || 30,
        defaultItems: lineItems.map((item) => ({
          productId: item.productId || null,
          planId: item.planId || null,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: item.discountAmount,
        })),
      });

      showAlert(`Quotation template "${newTemplateData.name}" created!`);
      setIsTemplateModalOpen(false);
      setNewTemplateData({
        name: '',
        description: '',
        defaultTerms: 'Net 30 days. Standard SLA guarantees 99.9% availability.',
        defaultValidityDays: 30,
      });
      const updatedTpls = await quotationTemplateService.getAll();
      setTemplates(updatedTpls || []);
    } catch (err: any) {
      showAlert(err.response?.data?.message || err.message || 'Failed to save template', 'error');
    }
  };

  // Filtered quotations
  const filteredQuotes = quotations.filter((q) => {
    const matchesTab = activeTab === 'all' || q.status === activeTab;
    const customerName = q.customer ? `${q.customer.firstName} ${q.customer.lastName} ${q.customer.companyName || ''}` : '';
    const matchesSearch =
      q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Pipeline metrics
  const totalPipelineAmount = quotations.reduce((sum, q) => sum + Number(q.totalAmount || 0), 0);
  const draftCount = quotations.filter((q) => q.status === 'DRAFT').length;
  const sentCount = quotations.filter((q) => q.status === 'SENT').length;
  const acceptedCount = quotations.filter((q) => q.status === 'ACCEPTED').length;
  const convertedCount = quotations.filter((q) => q.status === 'CONVERTED').length;
  const expiredCount = quotations.filter((q) => q.status === 'EXPIRED').length;

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Action Notification Alert Banner */}
      {actionAlert && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-xs animate-fade-in ${
            actionAlert.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">
              {actionAlert.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{actionAlert.message}</span>
          </div>
          <button
            onClick={() => setActionAlert(null)}
            className="p-1 hover:bg-black/5 rounded text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#81737e] uppercase tracking-wider mb-1 font-medium">
            <span>Sales Operations</span>
            <span>•</span>
            <span>Quote-to-Subscription Engine</span>
          </div>
          <h1 className="text-3xl font-bold text-[#1f1924] tracking-tight">Quotations & Offers</h1>
          <p className="text-sm text-[#81737e] mt-0.5">
            Create custom proposals, configure product surcharges, and convert accepted quotes into recurring subscriptions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsTemplateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#EAE5EC] hover:bg-[#FAF9FB] text-xs font-semibold text-[#1f1924] shadow-xs transition"
          >
            <span className="material-symbols-outlined text-[18px] text-[#6D286F]">bookmark_add</span>
            <span>Save as Template</span>
          </button>
          <a
            href="#quotation-builder"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#6D286F] hover:bg-[#530D57] text-white text-xs font-semibold shadow-xs transition"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>New Quotation</span>
          </a>
        </div>
      </div>

      {/* 5 KPI Pipeline Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Pipeline */}
        <div className="p-4 rounded-xl bg-white border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#81737e] font-medium">Total Quotes</span>
            <span className="p-1 rounded-md bg-[#FAF9FB] text-[#6D286F]">
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-[#1f1924]">{quotations.length}</span>
            <span className="text-xs text-[#81737e]">total</span>
          </div>
          <p className="text-xs text-[#81737e] mt-1">
            Pipeline: <span className="font-semibold text-[#6D286F]">₹{totalPipelineAmount.toLocaleString('en-IN')}</span>
          </p>
        </div>

        {/* Drafts */}
        <div className="p-4 rounded-xl bg-white border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#81737e] font-medium">Draft Proposals</span>
            <span className="p-1 rounded-md bg-[#FAF9FB] text-[#81737e]">
              <span className="material-symbols-outlined text-[18px]">edit_note</span>
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-[#1f1924]">{draftCount}</span>
            <span className="text-xs text-[#81737e]">drafts</span>
          </div>
          <p className="text-xs text-[#81737e] mt-1">Preparing for customer issue</p>
        </div>

        {/* Sent / In Review */}
        <div className="p-4 rounded-xl bg-white border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#81737e] font-medium">Awaiting Acceptance</span>
            <span className="p-1 rounded-md bg-[#FAF9FB] text-[#B7791F]">
              <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-[#B7791F]">{sentCount}</span>
            <span className="text-xs text-[#81737e]">issued</span>
          </div>
          <p className="text-xs text-[#81737e] mt-1">Under client evaluation</p>
        </div>

        {/* Accepted / Ready to Convert */}
        <div className="p-4 rounded-xl bg-white border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#81737e] font-medium">Accepted (Ready)</span>
            <span className="p-1 rounded-md bg-emerald-50 text-emerald-700">
              <span className="material-symbols-outlined text-[18px]">task_alt</span>
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-emerald-700">{acceptedCount}</span>
            <span className="text-xs text-[#81737e]">ready</span>
          </div>
          <p className="text-xs text-emerald-700 mt-1 font-medium">Eligible for 1-click conversion</p>
        </div>

        {/* Grand Quoted Value */}
        <div className="p-4 rounded-xl bg-[#6D286F] text-white shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[#f5eaf9]">Converted Deals</span>
              <span className="material-symbols-outlined text-[#ffd6f8] text-[20px]">
                verified
              </span>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight mt-1 tabular-nums">
              {convertedCount} <span className="text-xs font-normal opacity-80">subscriptions</span>
            </div>
          </div>
          <div className="pt-2 flex items-center justify-between text-[11px] text-[#f5eaf9]">
            <span>Active Subscriptions</span>
            <span className="text-white font-bold">Confirmed</span>
          </div>
        </div>
      </div>

      {/* Tabs and Search Toolbar */}
      <div className="bg-white rounded-xl p-4 border border-[#EAE5EC] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Quotes', count: quotations.length },
            { id: 'DRAFT', label: 'Draft', count: draftCount },
            { id: 'SENT', label: 'Sent', count: sentCount },
            { id: 'ACCEPTED', label: 'Accepted', count: acceptedCount },
            { id: 'CONVERTED', label: 'Converted', count: convertedCount },
            { id: 'EXPIRED', label: 'Expired', count: expiredCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              type="button"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-[#6D286F] text-white shadow-xs'
                  : 'bg-[#FAF9FB] text-[#1f1924] hover:bg-[#f5eaf9] border border-[#EAE5EC]'
              }`}
            >
              {tab.label} <span className="opacity-75">({tab.count})</span>
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#81737e] text-[18px]">
            search
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs text-[#1f1924] placeholder:text-[#81737e] outline-none focus:border-[#6D286F]"
            placeholder="Search by quote # or customer..."
            type="text"
          />
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-xl border border-[#EAE5EC] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-[#81737e] space-y-3">
            <span className="material-symbols-outlined text-[32px] animate-spin text-[#6D286F]">
              progress_activity
            </span>
            <span className="text-xs font-semibold">Loading Brightloop quotations...</span>
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <span className="material-symbols-outlined text-[48px] text-[#81737e]/40">
              receipt_long
            </span>
            <div className="text-sm font-bold text-[#1f1924]">No quotations found</div>
            <p className="text-xs text-[#81737e] max-w-sm">
              No quotations match your current filter. Prepare a customized offer below using the Quotation Builder.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF9FB] text-[#81737e] uppercase tracking-wider font-semibold border-b border-[#EAE5EC]">
                <tr>
                  <th className="py-3 px-5">Quotation Number</th>
                  <th className="py-3 px-5">Customer</th>
                  <th className="py-3 px-5">Items Breakdown</th>
                  <th className="py-3 px-5">Quotation Date</th>
                  <th className="py-3 px-5">Valid Until</th>
                  <th className="py-3 px-5 text-right">Total Amount</th>
                  <th className="py-3 px-5 text-center">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE5EC] text-[#1f1924]">
                {filteredQuotes.map((q) => (
                  <tr key={q.id} className="hover:bg-[#FAF9FB] transition group">
                    <td className="py-3.5 px-5 font-semibold text-[#6D286F] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-[#81737e]">
                          description
                        </span>
                        <span>{q.quotationNumber}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-sm text-[#1f1924]">
                        {q.customer ? `${q.customer.firstName} ${q.customer.lastName}` : 'Direct Customer'}
                      </div>
                      <span className="text-[10px] text-[#81737e]">
                        {q.customer?.companyName || q.customer?.email}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-[#FAF9FB] border border-[#EAE5EC] text-xs text-[#1f1924]">
                        {q.items?.length || 0} line items
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-[#81737e] whitespace-nowrap">
                      {new Date(q.quotationDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="text-xs text-[#81737e]">
                        {new Date(q.expiryDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right font-bold tabular-nums whitespace-nowrap">
                      ₹{Number(q.totalAmount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-5 text-center whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          q.status === 'CONVERTED'
                            ? 'bg-[#f5eaf9] text-[#6D286F] border border-[#d9a0d9]'
                            : q.status === 'ACCEPTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : q.status === 'SENT'
                            ? 'bg-[#FEF6E9] text-[#B7791F]'
                            : q.status === 'DRAFT'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-[#FDF0F2] text-[#C53B4B]'
                        }`}
                      >
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {/* State: DRAFT -> Send */}
                        {q.status === 'DRAFT' && (
                          <button
                            type="button"
                            onClick={() => handleSendQuotation(q.id, q.quotationNumber)}
                            className="px-2.5 py-1 rounded bg-[#6D286F] text-white text-[11px] font-semibold hover:bg-[#530D57] transition shadow-xs flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">send</span>
                            <span>Issue / Send</span>
                          </button>
                        )}

                        {/* State: SENT -> Accept / Reject */}
                        {q.status === 'SENT' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleAcceptQuotation(q.id, q.quotationNumber)}
                              className="px-2.5 py-1 rounded bg-emerald-700 text-white text-[11px] font-semibold hover:bg-emerald-800 transition shadow-xs flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[14px]">check</span>
                              <span>Accept</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectQuotation(q.id, q.quotationNumber)}
                              className="px-2 py-1 rounded bg-rose-100 text-rose-800 text-[11px] font-semibold hover:bg-rose-200 transition"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {/* State: ACCEPTED -> Convert to Subscription */}
                        {q.status === 'ACCEPTED' && (
                          <button
                            type="button"
                            disabled={convertingId === q.id}
                            onClick={() => handleConvertToSubscription(q.id, q.quotationNumber)}
                            className="px-3 py-1 rounded bg-[#6D286F] text-white text-[11px] font-semibold hover:bg-[#530D57] transition shadow-xs flex items-center gap-1 disabled:opacity-50"
                          >
                            {convertingId === q.id ? (
                              <span className="material-symbols-outlined text-[14px] animate-spin">
                                progress_activity
                              </span>
                            ) : (
                              <span className="material-symbols-outlined text-[14px]">
                                autorenew
                              </span>
                            )}
                            <span>Convert to Subscription</span>
                          </button>
                        )}

                        {/* State: CONVERTED -> View Subscription Link */}
                        {q.status === 'CONVERTED' && q.subscription && (
                          <button
                            type="button"
                            onClick={() => navigate('/admin/subscriptions')}
                            className="px-2.5 py-1 rounded bg-purple-50 text-[#6D286F] border border-purple-200 text-[11px] font-semibold hover:bg-purple-100 transition flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">link</span>
                            <span>{q.subscription.subscriptionNumber}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interactive Quotation Builder Form */}
      <form
        id="quotation-builder"
        onSubmit={handleCreateQuotation}
        className="w-full bg-white rounded-xl border border-[#EAE5EC] shadow-sm p-6 space-y-6"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-2 border-b border-[#EAE5EC]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] flex items-center justify-center text-[#6D286F]">
              <span className="material-symbols-outlined text-[24px]">tune</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#1f1924]">New Quotation Builder</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#f5eaf9] text-[#6D286F] text-xs font-semibold">
                  Live Pricing Engine
                </span>
              </div>
              <p className="text-xs text-[#81737e]">
                Select customer, configure line items and surcharges, apply promo codes, and lock agreed terms.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAddLine}
              className="px-3 py-1.5 rounded-lg border border-[#EAE5EC] bg-[#FAF9FB] hover:bg-[#f5eaf9] text-xs font-semibold text-[#1f1924] transition flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Add Line Item</span>
            </button>
          </div>
        </div>

        {/* Builder Customer & Template Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-4 rounded-xl bg-[#FAF9FB] border border-[#EAE5EC]">
          <div>
            <label className="block text-xs font-semibold text-[#81737e] uppercase tracking-wider mb-1">
              Select Customer Account *
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-white border border-[#EAE5EC] text-xs text-[#1f1924] font-medium outline-none focus:border-[#6D286F]"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} {c.companyName ? `(${c.companyName})` : ''} - {c.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#81737e] uppercase tracking-wider mb-1">
              Apply Reusable Template (Optional)
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-[#EAE5EC] text-xs text-[#1f1924] outline-none focus:border-[#6D286F]"
            >
              <option value="">None (Custom Quote)</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.defaultValidityDays}d validity)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#81737e] uppercase tracking-wider mb-1">
              Validity Window (Days) *
            </label>
            <input
              type="number"
              min={1}
              max={365}
              value={builderValidityDays}
              onChange={(e) => setBuilderValidityDays(Number(e.target.value))}
              required
              className="w-full px-3 py-2 rounded-lg bg-white border border-[#EAE5EC] text-xs text-[#1f1924] outline-none focus:border-[#6D286F]"
            />
          </div>
        </div>

        {/* Dynamic Line Items Table */}
        <div className="border border-[#EAE5EC] rounded-xl overflow-hidden">
          <div className="bg-[#FAF9FB] px-4 py-2.5 border-b border-[#EAE5EC] flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#81737e]">
              Quotation Line Items
            </span>
            <span className="text-[11px] text-[#81737e]">GST 18% automatically computed</span>
          </div>

          <div className="divide-y divide-[#EAE5EC]">
            {lineItems.map((item, idx) => (
              <div key={item.id} className="p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                {/* Product / Plan Pickers */}
                <div className="md:col-span-5 space-y-1.5">
                  <div className="flex gap-2">
                    <select
                      value={item.planId}
                      onChange={(e) => handleUpdateLine(item.id, 'planId', e.target.value)}
                      className="w-1/2 px-2.5 py-1.5 rounded-lg border border-[#EAE5EC] bg-white text-xs text-[#1f1924] outline-none"
                    >
                      <option value="">Choose Plan...</option>
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (₹{Number(p.price)})
                        </option>
                      ))}
                    </select>

                    <select
                      value={item.productId}
                      onChange={(e) => handleUpdateLine(item.id, 'productId', e.target.value)}
                      className="w-1/2 px-2.5 py-1.5 rounded-lg border border-[#EAE5EC] bg-white text-xs text-[#1f1924] outline-none"
                    >
                      <option value="">Choose Product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleUpdateLine(item.id, 'description', e.target.value)}
                    placeholder="Line item description / specification..."
                    required
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#EAE5EC] bg-white text-xs text-[#1f1924] outline-none"
                  />
                </div>

                {/* Quantity */}
                <div className="md:col-span-2">
                  <label className="text-[10px] text-[#81737e] uppercase font-semibold">Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => handleUpdateLine(item.id, 'quantity', Number(e.target.value))}
                    required
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#EAE5EC] bg-white text-xs text-[#1f1924] outline-none"
                  />
                </div>

                {/* Unit Price */}
                <div className="md:col-span-2">
                  <label className="text-[10px] text-[#81737e] uppercase font-semibold">Unit Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={item.unitPrice}
                    onChange={(e) => handleUpdateLine(item.id, 'unitPrice', Number(e.target.value))}
                    required
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#EAE5EC] bg-white text-xs text-[#1f1924] outline-none"
                  />
                </div>

                {/* Discount */}
                <div className="md:col-span-2">
                  <label className="text-[10px] text-[#81737e] uppercase font-semibold">Line Discount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={item.discountAmount}
                    onChange={(e) => handleUpdateLine(item.id, 'discountAmount', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#EAE5EC] bg-white text-xs text-[#1f1924] outline-none"
                  />
                </div>

                {/* Delete button */}
                <div className="md:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveLine(item.id)}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition"
                    title="Remove item"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coupon and Financial Totals Box */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#81737e] uppercase tracking-wider mb-1">
                Promotional Coupon Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={builderDiscountCode}
                  onChange={(e) => setBuilderDiscountCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ENTERPRISE_ANNUAL_15"
                  className="flex-1 px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs font-mono uppercase text-[#1f1924] outline-none focus:border-[#6D286F]"
                />
                <button
                  type="button"
                  onClick={handleValidateCoupon}
                  className="px-3.5 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] hover:bg-[#f5eaf9] text-xs font-semibold text-[#6D286F] transition"
                >
                  Verify Coupon
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#81737e] uppercase tracking-wider mb-1">
                Agreed Terms & Conditions
              </label>
              <textarea
                rows={3}
                value={builderTerms}
                onChange={(e) => setBuilderTerms(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs text-[#1f1924] outline-none focus:border-[#6D286F]"
              />
            </div>
          </div>

          {/* Totals Summary Card */}
          <div className="p-5 rounded-xl bg-[#FAF9FB] border border-[#EAE5EC] space-y-3">
            <div className="flex items-center justify-between text-xs text-[#81737e]">
              <span>Gross Subtotal:</span>
              <span className="font-semibold text-[#1f1924]">₹{rawSubtotal.toLocaleString('en-IN')}</span>
            </div>

            {totalDiscount > 0 && (
              <div className="flex items-center justify-between text-xs text-emerald-700">
                <span>Total Discount Applied:</span>
                <span className="font-semibold">-₹{totalDiscount.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-[#81737e]">
              <span>Taxable Value:</span>
              <span className="font-semibold text-[#1f1924]">₹{taxableAmount.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-[#81737e]">
              <span>GST Tax (18%):</span>
              <span className="font-semibold text-[#1f1924]">₹{calculatedTax.toLocaleString('en-IN')}</span>
            </div>

            <div className="pt-3 border-t border-[#EAE5EC] flex items-center justify-between">
              <span className="text-sm font-bold text-[#1f1924]">Grand Quoted Total:</span>
              <span className="text-xl font-bold text-[#6D286F] tabular-nums">
                ₹{grandTotal.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-lg bg-[#6D286F] hover:bg-[#530D57] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="material-symbols-outlined text-[16px] animate-spin">
                    progress_activity
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-[16px]">receipt</span>
                )}
                <span>Generate Official Quotation</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Save Template Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#EAE5EC] shadow-2xl p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-[#EAE5EC] pb-3">
              <h3 className="font-bold text-sm text-[#1f1924]">Create Quotation Template</h3>
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="p-1 hover:bg-[#FAF9FB] rounded text-[#81737e]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTemplateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#81737e] uppercase mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise Cloud Annual SLA"
                  value={newTemplateData.name}
                  onChange={(e) => setNewTemplateData({ ...newTemplateData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] outline-none focus:border-[#6D286F]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#81737e] uppercase mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Standard package for corporate accounts..."
                  value={newTemplateData.description}
                  onChange={(e) => setNewTemplateData({ ...newTemplateData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] outline-none focus:border-[#6D286F]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#81737e] uppercase mb-1">
                  Default Validity (Days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={newTemplateData.defaultValidityDays}
                  onChange={(e) =>
                    setNewTemplateData({ ...newTemplateData, defaultValidityDays: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] outline-none focus:border-[#6D286F]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#81737e] uppercase mb-1">
                  Default Terms & Conditions
                </label>
                <textarea
                  rows={3}
                  value={newTemplateData.defaultTerms}
                  onChange={(e) => setNewTemplateData({ ...newTemplateData, defaultTerms: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] outline-none focus:border-[#6D286F]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#EAE5EC] text-[#81737e] hover:bg-[#FAF9FB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#6D286F] text-white font-semibold hover:bg-[#530D57] transition"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationsPage;
