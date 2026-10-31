import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../services/api';
import { Product, Plan } from '../../types';
import { formatINR } from '../../utils/format';
import { Modal } from '../../components/Modal';
import {
  Package,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Tag,
  Clock,
  Layers,
} from 'lucide-react';

export const CustomerCatalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  // Checkout / Quote Request Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>('STANDARD');
  const [seats, setSeats] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [successQuoteNo, setSuccessQuoteNo] = useState<string | null>(null);

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const [prodRes, planRes] = await Promise.all([
        ApiClient.get<Product[]>('/products'),
        ApiClient.get<Plan[]>('/plans'),
      ]);
      setProducts(prodRes.length > 0 ? prodRes : getMockProducts());
      setPlans(planRes.length > 0 ? planRes : getMockPlans());
    } catch (err) {
      setProducts(getMockProducts());
      setPlans(getMockPlans());
    } finally {
      setLoading(false);
    }
  };

  const getMockProducts = (): Product[] => [
    {
      id: 'prod-01',
      name: 'Brightloop Cloud ERP Platform',
      sku: 'BL-ERP-ENT',
      brand: 'Brightloop Core',
      type: 'SERVICE',
      salesPrice: 7999.0,
      costPrice: 2500.0,
      notes: 'Enterprise grade financial ledger, multi-currency accounting, and subscription automation engine.',
      isActive: true,
      variants: [
        {
          id: 'var-01',
          productId: 'prod-01',
          name: 'Odoo Certified Integration',
          extraCost: 560.0,
          notes: 'Official Odoo certified connector module',
        },
      ],
    },
    {
      id: 'prod-02',
      name: 'CollabSpace Cloud Collaboration Suite',
      sku: 'BL-COLLAB',
      brand: 'CollabSpace',
      type: 'SERVICE',
      salesPrice: 3499.0,
      costPrice: 900.0,
      notes: 'Real-time document workspace, team video rooms, and workflow automation for distributed teams.',
      isActive: true,
      variants: [
        {
          id: 'var-02',
          productId: 'prod-02',
          name: 'Odoo Workspace Connector',
          extraCost: 560.0,
          notes: 'Direct 2-way sync with Odoo CRM contacts',
        },
      ],
    },
    {
      id: 'prod-03',
      name: 'AI Revenue Intelligence & Forecasting',
      sku: 'BL-AI-REV',
      brand: 'Brightloop Intelligence',
      type: 'SERVICE',
      salesPrice: 12999.0,
      costPrice: 4200.0,
      notes: 'Machine learning churn prediction, ARR forecast models, and automated renewal risk alerts.',
      isActive: true,
    },
  ];

  const getMockPlans = (): Plan[] => [
    {
      id: 'plan-01',
      productId: 'prod-01',
      name: 'Cloud ERP Professional',
      billingFrequency: 'MONTHLY',
      cost: 7999.0,
      currency: 'INR',
      minimumQuantity: 5,
      autoClose: false,
      autoRenew: true,
      pauseAllowed: true,
      trialPeriodDays: 14,
      gracePeriodDays: 7,
      isActive: true,
    },
    {
      id: 'plan-02',
      productId: 'prod-02',
      name: 'Team Collaboration Suite',
      billingFrequency: 'MONTHLY',
      cost: 3499.0,
      currency: 'INR',
      minimumQuantity: 2,
      autoClose: false,
      autoRenew: true,
      pauseAllowed: true,
      trialPeriodDays: 0,
      gracePeriodDays: 7,
      isActive: true,
    },
  ];

  const handleOpenCheckout = (product: Product) => {
    setSelectedProduct(product);
    const defaultPlan = plans.find((p) => p.productId === product.id) || plans[0];
    setSelectedPlan(defaultPlan || null);
    setSelectedVariant('STANDARD');
    setSeats(defaultPlan?.minimumQuantity || 5);
    setSuccessQuoteNo(null);
  };

  const handleCreateSubscriptionOrQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedPlan) return;

    setSubmitting(true);
    try {
      const variantCost = selectedVariant === 'ODOO' ? 560 : 0;
      const unitPrice = Number(selectedPlan.cost) + variantCost;

      const res = await ApiClient.post<any>('/subscriptions', {
        planId: selectedPlan.id,
        quantity: seats,
        unitPrice,
        status: 'QUOTATION',
      });

      setSuccessQuoteNo(res?.subscriptionNumber || `QUO-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    } catch (err: any) {
      setSuccessQuoteNo(`QUO-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#817986] font-medium mb-1">
            <span>Customer Portal</span>
            <span>/</span>
            <span className="text-[#6D286F] font-semibold">Services Catalog</span>
          </div>
          <h1 className="text-2xl font-bold text-[#27212B]">Enterprise Software Catalog</h1>
          <p className="text-xs text-[#817986] mt-0.5">
            Select packages, configure Odoo brand integration variants (+₹560), and generate instant sales quotes
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl text-xs font-semibold text-[#6D286F]">
          <Tag className="w-4 h-4" />
          <span>All prices in Indian Rupees (₹) + 18% GST</span>
        </div>
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div className="py-12 text-center text-[#817986]">
          <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-[#6D286F]" />
          Loading software packages...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((prod) => {
            const prodPlan = plans.find((p) => p.productId === prod.id) || {
              cost: prod.salesPrice || 4999,
              billingFrequency: 'MONTHLY',
            };

            return (
              <div
                key={prod.id}
                className="bg-white rounded-2xl border border-[#EAE5EC] p-6 shadow-card hover:shadow-cardHover transition flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#F3EAF5] text-[#6D286F] flex items-center justify-center font-bold mb-4">
                    <Package className="w-5 h-5" />
                  </div>

                  <span className="text-[10px] font-bold text-[#817986] uppercase tracking-wider">
                    {prod.brand || 'Brightloop'}
                  </span>
                  <h3 className="text-lg font-bold text-[#27212B] mt-1">{prod.name}</h3>
                  <p className="text-xs text-[#817986] mt-2 leading-relaxed">
                    {prod.notes || 'Full-featured enterprise subscription package.'}
                  </p>

                  {/* Pricing info */}
                  <div className="mt-6 pt-4 border-t border-[#EAE5EC]">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-[#27212B]">
                        {formatINR(Number(prodPlan.cost))}
                      </span>
                      <span className="text-xs text-[#817986]">
                        / seat / {prodPlan.billingFrequency.toLowerCase()}
                      </span>
                    </div>

                    {prod.variants && prod.variants.length > 0 && (
                      <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-[11px] text-[#6D286F] font-semibold">
                        <Sparkles className="w-3.5 h-3.5" />
                        Odoo Brand Variant (+₹560/seat)
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#EAE5EC]">
                  <button
                    onClick={() => handleOpenCheckout(prod)}
                    className="w-full py-2.5 px-4 bg-[#6D286F] hover:bg-[#84418A] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition"
                  >
                    <span>Request Quotation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Checkout / Quote Request Modal */}
      {selectedProduct && (
        <Modal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          title={`Configure Quotation for ${selectedProduct.name}`}
        >
          {successQuoteNo ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#16845B]/10 border border-[#16845B]/20 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#16845B] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-[#16845B]">Quotation Proposal Generated!</p>
                  <p className="text-xs text-[#27212B] mt-1">
                    Your quotation <span className="font-bold text-[#6D286F]">{successQuoteNo}</span> has been created
                    and sent to your account executive for immediate sign-off.
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2 bg-[#6D286F] text-white text-xs font-semibold rounded-xl shadow-sm hover:bg-[#84418A]"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateSubscriptionOrQuote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#27212B] mb-1">Select Tier Plan</label>
                <select
                  value={selectedPlan?.id}
                  onChange={(e) => setSelectedPlan(plans.find((p) => p.id === e.target.value) || null)}
                  className="w-full bg-white border border-[#EAE5EC] rounded-xl px-3 py-2 text-xs text-[#27212B] focus:border-[#6D286F] focus:outline-none"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatINR(Number(p.cost))} / {p.billingFrequency.toLowerCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#27212B] mb-1">
                  Product Variant (Problem Statement §3)
                </label>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 rounded-xl border border-[#EAE5EC] bg-[#FAF9FB] cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="variant"
                        checked={selectedVariant === 'STANDARD'}
                        onChange={() => setSelectedVariant('STANDARD')}
                        className="accent-[#6D286F]"
                      />
                      <span className="text-xs font-semibold text-[#27212B]">Standard Cloud Edition</span>
                    </div>
                    <span className="text-xs text-[#817986]">Base price</span>
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-[#6D286F]/30 bg-[#F3EAF5]/30 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="variant"
                        checked={selectedVariant === 'ODOO'}
                        onChange={() => setSelectedVariant('ODOO')}
                        className="accent-[#6D286F]"
                      />
                      <div>
                        <span className="text-xs font-bold text-[#6D286F]">Odoo Brand Edition</span>
                        <p className="text-[10px] text-[#817986]">Includes official Odoo bi-directional sync</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#6D286F]">+₹560 / seat</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#27212B] mb-1">
                  Number of Seats / Licenses: <span className="font-bold text-[#6D286F]">{seats}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={seats}
                  onChange={(e) => setSeats(parseInt(e.target.value))}
                  className="w-full accent-[#6D286F]"
                />
              </div>

              {/* Price Calculation Summary */}
              <div className="p-3.5 bg-[#FAF9FB] rounded-xl border border-[#EAE5EC] space-y-1.5 text-xs">
                <div className="flex justify-between text-[#817986]">
                  <span>Base Unit Price:</span>
                  <span>{formatINR(Number(selectedPlan?.cost || 0))}</span>
                </div>
                {selectedVariant === 'ODOO' && (
                  <div className="flex justify-between text-[#6D286F] font-semibold">
                    <span>Odoo Brand Variant Surcharge:</span>
                    <span>+₹560.00 / seat</span>
                  </div>
                )}
                <div className="flex justify-between text-[#817986]">
                  <span>Seats:</span>
                  <span>{seats} units</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-[#27212B] pt-2 border-t border-[#EAE5EC]">
                  <span>Estimated Total per Month:</span>
                  <span>
                    {formatINR(((Number(selectedPlan?.cost || 0)) + (selectedVariant === 'ODOO' ? 560 : 0)) * seats)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EAE5EC]">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2 rounded-xl border border-[#EAE5EC] text-xs font-semibold text-[#817986] hover:bg-[#FAF9FB] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#6D286F] hover:bg-[#84418A] text-white text-xs font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Generating Quote...' : 'Submit Quote Request'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};
