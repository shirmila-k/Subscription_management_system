import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../services/api';
import { Plan, BillingFrequency, Product } from '../../types';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { SearchInput } from '../../components/SearchInput';
import { StatusBadge } from '../../components/StatusBadge';
import { formatINR } from '../../utils/format';
import { Plus, Check, X, Clock, CalendarCheck, CheckCircle2 } from 'lucide-react';

export const AdminPlans: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [name, setName] = useState('');
  const [cost, setCost] = useState('8250');
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>('MONTHLY');
  const [minimumQuantity, setMinimumQuantity] = useState('1');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [trialDays, setTrialDays] = useState('14');
  const [gracePeriodDays, setGracePeriodDays] = useState('7');
  const [autoClose, setAutoClose] = useState(true);
  const [autoRenew, setAutoRenew] = useState(true);
  const [pauseAllowed, setPauseAllowed] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansData, productsData] = await Promise.all([
        ApiClient.get<Plan[]>('/plans'),
        ApiClient.get<Product[]>('/products'),
      ]);
      setPlans(plansData);
      setProducts(productsData);
      if (productsData.length > 0) {
        setSelectedProductId(productsData[0].id);
      }
    } catch (err) {
      // Mock Fallback matching Stitch Design
      const mockProducts: Product[] = [
        {
          id: 'prod-1',
          name: 'Brightloop Cloud ERP Platform',
          sku: 'PROD-BL-ERP-01',
          isActive: true,
          variants: [
            { id: 'var-1', productId: 'prod-1', name: 'Standard Edition', sku: 'VAR-STD', extraCost: 0, isActive: true },
            { id: 'var-2', productId: 'prod-1', name: 'Odoo Brand Edition (+₹560)', sku: 'VAR-ODOO', extraCost: 560, isActive: true },
          ],
        },
      ];
      setProducts(mockProducts);
      setSelectedProductId('prod-1');

      setPlans([
        {
          id: 'p1',
          productId: 'prod-1',
          name: 'Cloud ERP Professional (Monthly)',
          billingFrequency: 'MONTHLY',
          cost: 8250.0,
          currency: 'INR',
          minimumQuantity: 1,
          autoClose: true,
          autoRenew: true,
          pauseAllowed: true,
          trialPeriodDays: 14,
          gracePeriodDays: 7,
          isActive: true,
          product: mockProducts[0],
        },
        {
          id: 'p2',
          productId: 'prod-1',
          name: 'Cloud ERP Enterprise (Annual)',
          billingFrequency: 'YEARLY',
          cost: 82500.0,
          currency: 'INR',
          minimumQuantity: 1,
          autoClose: true,
          autoRenew: true,
          pauseAllowed: true,
          trialPeriodDays: 30,
          gracePeriodDays: 15,
          isActive: true,
          product: mockProducts[0],
        },
        {
          id: 'p3',
          productId: 'prod-1',
          name: 'AI Document Processing (Weekly)',
          billingFrequency: 'WEEKLY',
          cost: 2490.0,
          currency: 'INR',
          minimumQuantity: 1,
          autoClose: false,
          autoRenew: true,
          pauseAllowed: true,
          trialPeriodDays: 7,
          gracePeriodDays: 3,
          isActive: true,
          product: mockProducts[0],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      alert('Please select a product');
      return;
    }

    try {
      await ApiClient.post('/plans', {
        productId: selectedProductId,
        variantId: selectedVariantId || undefined,
        name,
        cost: Number(cost),
        billingFrequency,
        minimumQuantity: Number(minimumQuantity),
        validFrom: validFrom ? new Date(validFrom) : undefined,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        trialPeriodDays: Number(trialDays),
        gracePeriodDays: Number(gracePeriodDays),
        autoClose,
        autoRenew,
        pauseAllowed,
      });
      setIsModalOpen(false);
      setName('');
      setCost('8250');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create plan');
    }
  };

  const filtered = plans.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.billingFrequency.toLowerCase().includes(search.toLowerCase()) ||
      (p.product && p.product.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#27212B] tracking-tight">
            Pricing Plans & Lifecycles
          </h1>
          <p className="text-sm text-[#817986] mt-0.5">
            Configure frequencies (Daily, Weekly, Monthly, Yearly) and admin lifecycle rules (Auto-close, Auto-renew, Pause)
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          New Plan
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center justify-between gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search plans by cadence, name, or product..."
          className="w-full max-w-md"
        />
        <span className="text-xs text-[#817986] font-medium hidden sm:block">
          Showing {filtered.length} plan(s)
        </span>
      </div>

      {loading ? (
        <div className="py-16 text-center text-[#817986] bg-white rounded-2xl border border-[#EAE5EC]">
          <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-[#6D286F]" />
          Loading pricing plans...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-[#817986] bg-white rounded-2xl border border-[#EAE5EC]">
          <CalendarCheck className="w-12 h-12 text-[#D1ACD7] mx-auto mb-2" />
          <p className="text-base font-bold text-[#27212B]">No plans found</p>
          <p className="text-xs text-[#817986] mt-1">Try another search or create a new plan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-2xl p-6 border border-[#EAE5EC] shadow-card hover:shadow-cardHover flex flex-col justify-between transition"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6D286F] bg-[#F3EAF5] px-2.5 py-0.5 rounded-full border border-[#E5D1E8]">
                    {plan.billingFrequency}
                  </span>
                  <StatusBadge status={plan.isActive ? 'ACTIVE' : 'DRAFT'} size="sm" />
                </div>

                <div className="mt-4">
                  <p className="text-xs text-[#817986] font-medium">Product: {plan.product?.name || 'Brightloop Service'}</p>
                  <h3 className="text-xl font-extrabold text-[#27212B] mt-0.5">{plan.name}</h3>
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-[#27212B]">{formatINR(plan.cost)}</span>
                  <span className="text-xs text-[#817986] font-semibold uppercase">
                    / {plan.billingFrequency.toLowerCase()}
                  </span>
                </div>

                <p className="text-xs text-[#817986] mt-2">
                  Min Quantity: <span className="font-semibold text-[#27212B]">{plan.minimumQuantity} user seats</span>
                </p>

                {/* Lifecycle Rules Box */}
                <div className="mt-4 pt-4 border-t border-[#EAE5EC] space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#817986]">Plan Lifecycle Governance</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-[#27212B]">
                      {plan.autoClose ? (
                        <Check className="w-3.5 h-3.5 text-[#16845B]" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-[#C53B4B]" />
                      )}
                      <span>Auto-Close</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#27212B]">
                      {plan.autoRenew ? (
                        <Check className="w-3.5 h-3.5 text-[#16845B]" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-[#C53B4B]" />
                      )}
                      <span>Auto-Renew</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#27212B]">
                      {plan.pauseAllowed ? (
                        <Check className="w-3.5 h-3.5 text-[#16845B]" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-[#C53B4B]" />
                      )}
                      <span>Pause Allowed</span>
                    </div>
                    <div className="text-[#817986] text-[11px]">
                      <span>Trial: </span>
                      <strong className="text-[#27212B]">{plan.trialPeriodDays}d</strong>
                      <span className="ml-1 text-[#817986]">| Grace: </span>
                      <strong className="text-[#27212B]">{plan.gracePeriodDays}d</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#EAE5EC] flex items-center justify-between text-xs text-[#817986]">
                <span>Rule: {plan.autoClose ? 'Closes on expiry' : 'Requires manual closure'}</span>
                <span className="font-mono text-[11px] text-[#817986]">ID: {plan.id.slice(0, 8)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Plan Creation */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Plan with Lifecycle Rules" maxWidth="xl">
        <form onSubmit={handleCreatePlan} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#27212B] mb-1">Target Product</label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                setSelectedVariantId('');
              }}
              required
              className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:bg-white"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && selectedProduct.variants && selectedProduct.variants.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Target Variant (Optional)</label>
              <select
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(e.target.value)}
                className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:bg-white"
              >
                <option value="">Base Product (Standard)</option>
                {selectedProduct.variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} {Number(v.extraCost) > 0 ? `(+${formatINR(v.extraCost)})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#27212B] mb-1">Plan Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cloud ERP Professional (Monthly)"
              className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Billing Frequency</label>
              <select
                value={billingFrequency}
                onChange={(e) => setBillingFrequency(e.target.value as BillingFrequency)}
                className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:bg-white"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Plan Cost (₹)</label>
              <input
                type="number"
                step="1"
                required
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="8250"
                className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#6D286F] font-bold focus:outline-none focus:border-[#6D286F] focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Min Seats</label>
              <input
                type="number"
                min="1"
                value={minimumQuantity}
                onChange={(e) => setMinimumQuantity(e.target.value)}
                className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3 py-2 text-xs text-[#27212B] focus:outline-none focus:border-[#6D286F]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Trial (Days)</label>
              <input
                type="number"
                min="0"
                value={trialDays}
                onChange={(e) => setTrialDays(e.target.value)}
                className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3 py-2 text-xs text-[#27212B] focus:outline-none focus:border-[#6D286F]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Grace (Days)</label>
              <input
                type="number"
                min="0"
                value={gracePeriodDays}
                onChange={(e) => setGracePeriodDays(e.target.value)}
                className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3 py-2 text-xs text-[#27212B] focus:outline-none focus:border-[#6D286F]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Valid From</label>
              <input
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-xs text-[#27212B] focus:outline-none focus:border-[#6D286F]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Valid Until</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-xs text-[#27212B] focus:outline-none focus:border-[#6D286F]"
              />
            </div>
          </div>

          {/* Lifecycle Checkbox Toggles */}
          <div className="bg-[#FAF9FB] p-3 rounded-xl border border-[#EAE5EC] space-y-2">
            <p className="text-xs font-bold text-[#27212B] mb-1.5">Lifecycle Governance (Plan by Plan)</p>
            <label className="flex items-center gap-2 text-xs text-[#27212B] cursor-pointer">
              <input
                type="checkbox"
                checked={autoClose}
                onChange={(e) => setAutoClose(e.target.checked)}
                className="rounded text-[#6D286F] focus:ring-[#6D286F]"
              />
              <span>Auto-Close: Plan closes automatically on end date</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-[#27212B] cursor-pointer">
              <input
                type="checkbox"
                checked={autoRenew}
                onChange={(e) => setAutoRenew(e.target.checked)}
                className="rounded text-[#6D286F] focus:ring-[#6D286F]"
              />
              <span>Auto-Renew: Generates invoice and rolls over billing cycle</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-[#27212B] cursor-pointer">
              <input
                type="checkbox"
                checked={pauseAllowed}
                onChange={(e) => setPauseAllowed(e.target.checked)}
                className="rounded text-[#6D286F] focus:ring-[#6D286F]"
              />
              <span>Pause Allowed: Customers & staff can pause or resume active subscription</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#EAE5EC]">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Plan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminPlans;
