import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../services/api';
import { Discount, Product } from '../../types';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { SearchInput } from '../../components/SearchInput';
import { formatINR, formatDate } from '../../utils/format';
import { Tag, Plus, CheckCircle, Clock, Percent, Package } from 'lucide-react';

export const AdminDiscounts: React.FC = () => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [code, setCode] = useState('');
  const [type, setType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [value, setValue] = useState('20');
  const [minQuantity, setMinQuantity] = useState('1');
  const [minPurchaseAmount, setMinPurchaseAmount] = useState('0');
  const [startDate, setStartDate] = useState('2025-01-01');
  const [endDate, setEndDate] = useState('2027-12-31');
  const [maxUses, setMaxUses] = useState('500');
  const [productId, setProductId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [discountsData, productsData] = await Promise.all([
        ApiClient.get<Discount[]>('/discounts'),
        ApiClient.get<Product[]>('/products'),
      ]);
      setDiscounts(discountsData);
      setProducts(productsData);
    } catch (err) {
      // Mock Fallback matching Stitch Design
      setDiscounts([
        {
          id: 'd1',
          code: 'WELCOME20',
          type: 'PERCENTAGE',
          value: 20.0,
          minQuantity: 1,
          minPurchaseAmount: 4000.0,
          startDate: '2025-01-01T00:00:00Z',
          endDate: '2027-12-31T00:00:00Z',
          maxUses: 500,
          usedCount: 142,
          isActive: true,
        },
        {
          id: 'd2',
          code: 'ENTERPRISE1000',
          type: 'FIXED',
          value: 10000.0,
          minQuantity: 5,
          minPurchaseAmount: 50000.0,
          startDate: '2025-01-01T00:00:00Z',
          endDate: '2026-12-31T00:00:00Z',
          maxUses: 100,
          usedCount: 28,
          isActive: true,
        },
        {
          id: 'd3',
          code: 'SEATBOOST15',
          type: 'PERCENTAGE',
          value: 15.0,
          minQuantity: 10,
          minPurchaseAmount: 25000.0,
          startDate: '2026-01-01T00:00:00Z',
          endDate: '2027-01-01T00:00:00Z',
          maxUses: 200,
          usedCount: 19,
          isActive: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.post('/discounts', {
        code,
        type,
        value: Number(value),
        minQuantity: Number(minQuantity),
        minPurchaseAmount: Number(minPurchaseAmount),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        maxUses: maxUses ? Number(maxUses) : undefined,
        productId: productId || undefined,
      });
      setIsModalOpen(false);
      setCode('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create discount rule');
    }
  };

  const handleToggleActive = async (discount: Discount) => {
    try {
      await ApiClient.patch(`/discounts/${discount.id}`, {
        isActive: !discount.isActive,
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update discount');
    }
  };

  const filtered = discounts.filter(
    (d) =>
      d.code.toLowerCase().includes(search.toLowerCase()) ||
      d.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#27212B] tracking-tight">
            Discount Rules & Vouchers
          </h1>
          <p className="text-sm text-[#817986] mt-0.5">
            Configure promotional vouchers, bulk-seat incentives, usage limits, and automatic billing applications
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          New Discount Code
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center justify-between gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search promo codes (e.g. WELCOME20)..."
          className="w-full max-w-md"
        />
        <span className="text-xs text-[#817986] font-medium hidden sm:block">
          Showing {filtered.length} rule(s)
        </span>
      </div>

      {loading ? (
        <div className="py-16 text-center text-[#817986] bg-white rounded-2xl border border-[#EAE5EC]">
          <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-[#6D286F]" />
          Loading discount rules...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-[#817986] bg-white rounded-2xl border border-[#EAE5EC]">
          <Tag className="w-12 h-12 text-[#D1ACD7] mx-auto mb-2" />
          <p className="text-base font-bold text-[#27212B]">No discount codes found</p>
          <p className="text-xs text-[#817986] mt-1">Create your first promo code or adjust search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((discount) => {
            const usagePercent = discount.maxUses
              ? Math.min(100, Math.round((discount.usedCount / discount.maxUses) * 100))
              : null;

            return (
              <div
                key={discount.id}
                className="bg-white rounded-2xl p-6 border border-[#EAE5EC] shadow-card hover:shadow-cardHover flex flex-col justify-between transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black px-3 py-1 bg-[#F3EAF5] text-[#6D286F] border border-[#E5D1E8] rounded-xl tracking-wider">
                      {discount.code}
                    </span>
                    <button
                      onClick={() => handleToggleActive(discount)}
                      className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold transition ${
                        discount.isActive
                          ? 'bg-[#E8F5EE] text-[#16845B] border-[#C3E8D5] hover:bg-[#D5EFE2]'
                          : 'bg-[#FAF9FB] text-[#817986] border-[#EAE5EC] hover:bg-[#F0ECF2]'
                      }`}
                    >
                      {discount.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-3xl font-black text-[#27212B]">
                      {discount.type === 'PERCENTAGE' ? `${discount.value}% OFF` : `${formatINR(discount.value)} OFF`}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1 text-xs text-[#817986]">
                    <p className="flex items-center gap-1.5 text-[#27212B]">
                      <Package className="w-3.5 h-3.5 text-[#6D286F]" />
                      Scope:{' '}
                      <strong>
                        {discount.product?.name ? `Product: ${discount.product.name}` : 'Whole Subscription'}
                      </strong>
                    </p>
                    <p>
                      Min Seats Required:{' '}
                      <span className="font-semibold text-[#27212B]">{discount.minQuantity} seat(s)</span>
                    </p>
                    {discount.minPurchaseAmount > 0 && (
                      <p>
                        Min Spend Required:{' '}
                        <span className="font-semibold text-[#27212B]">{formatINR(discount.minPurchaseAmount)}</span>
                      </p>
                    )}
                    <p className="text-[#817986] text-[11px]">
                      Valid: {formatDate(discount.startDate)} &rarr; {formatDate(discount.endDate)}
                    </p>
                  </div>

                  {/* Usage Quota Bar */}
                  {discount.maxUses && (
                    <div className="mt-4 pt-3 border-t border-[#EAE5EC]">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-[#817986]">Usage Quota</span>
                        <span className="font-bold text-[#27212B]">
                          {discount.usedCount} / {discount.maxUses} uses ({usagePercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#FAF9FB] border border-[#EAE5EC] h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            (usagePercent || 0) > 85 ? 'bg-[#C53B4B]' : 'bg-[#6D286F]'
                          }`}
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-3 border-t border-[#EAE5EC] text-[11px] text-[#817986] flex justify-between">
                  <span>Auto-applied to next invoice</span>
                  <span className="font-mono text-[#817986]">{discount.id.slice(0, 8)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Creating Discount */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Discount Rule" maxWidth="xl">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Coupon Code</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. WELCOME20 or MORESEATS15"
                className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:bg-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Discount Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:bg-white"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">
                Value {type === 'PERCENTAGE' ? '(%)' : '(₹)'}
              </label>
              <input
                type="number"
                step="1"
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="20"
                className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#6D286F] font-bold focus:outline-none focus:border-[#6D286F] focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Min Seats</label>
              <input
                type="number"
                min="1"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                placeholder="1"
                className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Min Spend (₹)</label>
              <input
                type="number"
                min="0"
                value={minPurchaseAmount}
                onChange={(e) => setMinPurchaseAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#27212B] mb-1">Discount Scope</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:bg-white"
            >
              <option value="">Whole Subscription (All products & line items)</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  Target Product: {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-xs text-[#27212B] focus:outline-none focus:border-[#6D286F]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-xs text-[#27212B] focus:outline-none focus:border-[#6D286F]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#27212B] mb-1">Max Usages Cap (Optional)</label>
            <input
              type="number"
              min="1"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="e.g. 500"
              className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:bg-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#EAE5EC]">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Discount Rule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminDiscounts;
