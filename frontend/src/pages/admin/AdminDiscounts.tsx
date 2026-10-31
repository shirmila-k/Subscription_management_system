import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../services/api';
import { Discount } from '../../types';
import { Modal } from '../../components/Modal';
import { Tag, Plus, CheckCircle, Clock } from 'lucide-react';

export const AdminDiscounts: React.FC = () => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [code, setCode] = useState('');
  const [type, setType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [value, setValue] = useState('20');
  const [minQuantity, setMinQuantity] = useState('1');
  const [startDate, setStartDate] = useState('2025-01-01');
  const [endDate, setEndDate] = useState('2027-12-31');
  const [maxUses, setMaxUses] = useState('500');

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.get<Discount[]>('/discounts');
      setDiscounts(data);
    } catch (err) {
      // Mock Fallback
      setDiscounts([
        {
          id: 'd1',
          code: 'WELCOME20',
          type: 'PERCENTAGE',
          value: 20.0,
          minQuantity: 1,
          minPurchaseAmount: 50.0,
          startDate: '2025-01-01T00:00:00Z',
          endDate: '2027-12-31T00:00:00Z',
          maxUses: 500,
          usedCount: 42,
          isActive: true,
        },
        {
          id: 'd2',
          code: 'ENTERPRISE100',
          type: 'FIXED',
          value: 100.0,
          minQuantity: 5,
          minPurchaseAmount: 500.0,
          startDate: '2025-01-01T00:00:00Z',
          endDate: '2026-12-31T00:00:00Z',
          maxUses: 100,
          usedCount: 15,
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
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        maxUses: maxUses ? Number(maxUses) : undefined,
      });
      setIsModalOpen(false);
      setCode('');
      fetchDiscounts();
    } catch (err: any) {
      alert(err.message || 'Failed to create discount rule');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Discount Rules</h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure promotional vouchers, quantity minimums, usage caps, and validity windows
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl shadow-lg shadow-brand-600/30 transition text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Discount Code</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {discounts.map((discount) => (
          <div
            key={discount.id}
            className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 hover:border-slate-700 transition"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-base font-extrabold text-brand-400 bg-brand-500/10 px-3 py-1 rounded-xl border border-brand-500/20">
                {discount.code}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                Active
              </span>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white">
                {discount.type === 'PERCENTAGE' ? `${discount.value}%` : `$${discount.value}`}
              </span>
              <span className="text-xs text-slate-400 font-medium">DISCOUNT</span>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Min. Quantity:</span>
                <span className="font-semibold text-white">{discount.minQuantity} items</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Usage Limit:</span>
                <span className="font-semibold text-white">
                  {discount.usedCount} / {discount.maxUses || 'Unlimited'} used
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Expires:</span>
                <span className="font-semibold text-white">
                  {new Date(discount.endDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Discount Coupon">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Coupon Code</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. FLASH30"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono uppercase focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Discount Value</label>
              <input
                type="number"
                step="0.01"
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Min. Quantity</label>
              <input
                type="number"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Max Usages</label>
              <input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md transition"
            >
              Create Rule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
